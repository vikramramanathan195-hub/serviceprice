import os
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.component_data import COMPONENTS_BY_PRODUCT
from app.data import PRODUCTS, PRODUCTS_BY_ID
from app.deals_data import DEALS_BY_ID
from app.discount import calculate_discount
from app.models import (
    DEAL_STAGE_ORDER,
    AddBomItemRequest,
    BomLineItem,
    Category,
    Deal,
    DealStage,
    DealSummary,
    DiscountQuote,
    ProductBom,
    QuoteRequest,
    Region,
    ServerProduct,
    StageChangeRequest,
    StakeholderRole,
    StakeholderSignoffRequest,
    TimelineEvent,
)

app = FastAPI(title="ServerPrice Deal Desk API", version="0.2.0")

# Extra allowed origins (e.g. a custom domain) come from a Render env var —
# comma-separated, set in the Render dashboard once you know the final URL.
# Vercel preview + prod URLs are covered by the regex below, so they don't
# need to be listed individually.
_extra_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        *_extra_origins,
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STAKEHOLDER_LABELS: dict[StakeholderRole, str] = {
    "senior-leadership": "Senior Leadership",
    "country-head-sales": "Country Head/Sales",
    "manufacturing-rd": "Manufacturing/R&D",
    "external-partner": "External Partner",
}

STAGE_LABELS: dict[str, str] = {
    "discovery": "Discovery",
    "technical-validation": "Technical Validation",
    "bom-finalized": "BOM Finalized",
    "pricing-approval": "Pricing Approval",
    "contract": "Contract",
    "closed-won": "Closed Won",
    "closed-lost": "Closed Lost",
}

# Approval hierarchy: Country Head/Sales owns the deal and goes first.
# Manufacturing/R&D and External Partner are an independent second tier —
# both unlock once Country Head/Sales approves, but neither depends on the
# other. Senior Leadership is the final executive gate, and only required
# at all when the BOM carries a discount steep enough to need escalation
# (matches the >20% threshold the discount engine already uses).
EXEC_DISCOUNT_THRESHOLD = 20.0


def _requires_executive_signoff(deal: Deal) -> bool:
    return any(item.discountPercent > EXEC_DISCOUNT_THRESHOLD for item in deal.bom)


def _stakeholder_gates(deal: Deal) -> dict[StakeholderRole, tuple[bool, str | None, bool]]:
    """role -> (locked, lockReason, required)"""
    by_role = {s.role: s for s in deal.stakeholders}
    country_head = by_role["country-head-sales"]
    tier2_locked = country_head.status != "approved"
    tier2_reason = "Waiting on Country Head/Sales approval" if tier2_locked else None

    mfg = by_role["manufacturing-rd"]
    ext = by_role["external-partner"]
    exec_required = _requires_executive_signoff(deal)
    tier3_locked = exec_required and not (mfg.status == "approved" and ext.status == "approved")
    tier3_reason = (
        "Waiting on Manufacturing/R&D and External Partner approval" if tier3_locked else None
    )

    return {
        "country-head-sales": (False, None, True),
        "manufacturing-rd": (tier2_locked, tier2_reason, True),
        "external-partner": (tier2_locked, tier2_reason, True),
        "senior-leadership": (tier3_locked, tier3_reason, exec_required),
    }


# BOM is editable through Technical Validation; once the stage says the BOM
# is finalized (or later, including a lost deal), further edits are blocked
# so the stage name is a real commitment, not just a label. Reopen it by
# reverting the stage first (the undo feature already covers that).
BOM_LOCKED_STAGES: set[str] = {
    "bom-finalized",
    "pricing-approval",
    "contract",
    "closed-won",
    "closed-lost",
}


def _bom_lock(deal: Deal) -> tuple[bool, str | None]:
    if deal.stage in BOM_LOCKED_STAGES:
        return True, f"BOM is locked — deal is in {STAGE_LABELS[deal.stage]}. Revert the stage to make changes."
    return False, None


def _with_gates(deal: Deal) -> Deal:
    """Return a display copy of the deal with locked/lockReason/required
    computed fresh — these are never persisted, only derived per-request."""
    gates = _stakeholder_gates(deal)
    display = deal.model_copy(deep=True)
    for s in display.stakeholders:
        locked, reason, required = gates[s.role]
        s.locked = locked
        s.lockReason = reason
        s.required = required
    display.bomLocked, display.bomLockReason = _bom_lock(deal)
    return display


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _get_deal(deal_id: str) -> Deal:
    deal = DEALS_BY_ID.get(deal_id)
    if deal is None:
        raise HTTPException(status_code=404, detail=f"No deal found with id '{deal_id}'")
    return deal


def _summarize(deal: Deal) -> DealSummary:
    return DealSummary(
        id=deal.id,
        name=deal.name,
        customerName=deal.customerName,
        region=deal.region,
        stage=deal.stage,
        bomTotal=round(sum(item.lineTotal for item in deal.bom), 2),
        lineItemCount=len(deal.bom),
        stakeholdersApproved=sum(1 for s in deal.stakeholders if s.status == "approved"),
        stakeholdersTotal=len(deal.stakeholders),
        createdAt=deal.createdAt,
        updatedAt=deal.updatedAt,
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


# --------------------------------------------------------------------------
# Product catalog (BOM building blocks)
# --------------------------------------------------------------------------


@app.get("/products", response_model=list[ServerProduct])
async def list_products(
    region: Region | None = Query(default=None),
    category: Category | None = Query(default=None),
    search: str | None = Query(default=None, description="Matches against product name or SKU"),
) -> list[ServerProduct]:
    results = PRODUCTS
    if region:
        results = [p for p in results if p.region == region]
    if category:
        results = [p for p in results if p.category == category]
    if search:
        q = search.strip().lower()
        results = [p for p in results if q in p.name.lower() or q in p.sku.lower()]
    return results


@app.post("/quotes/calculate", response_model=DiscountQuote)
async def calculate_quote(req: QuoteRequest) -> DiscountQuote:
    product = PRODUCTS_BY_ID.get(req.productId)
    if product is None:
        raise HTTPException(status_code=404, detail=f"No product found with id '{req.productId}'")
    return calculate_discount(product, req)


@app.get("/products/{product_id}/bom", response_model=ProductBom)
async def get_product_bom(product_id: str) -> ProductBom:
    product = PRODUCTS_BY_ID.get(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail=f"No product found with id '{product_id}'")
    components = COMPONENTS_BY_PRODUCT.get(product_id, [])
    total_cost = sum(c.unitCost * c.quantity for c in components)
    margin_usd = product.basePrice - total_cost
    margin_percent = (margin_usd / product.basePrice * 100) if product.basePrice else 0.0
    return ProductBom(
        productId=product.id,
        productName=product.name,
        sku=product.sku,
        basePrice=product.basePrice,
        components=components,
        totalBomCost=round(total_cost, 2),
        marginUsd=round(margin_usd, 2),
        marginPercent=round(margin_percent, 1),
    )


# --------------------------------------------------------------------------
# Deals
# --------------------------------------------------------------------------


@app.get("/deals", response_model=list[DealSummary])
async def list_deals(
    stage: DealStage | None = Query(default=None),
    region: Region | None = Query(default=None),
    search: str | None = Query(default=None, description="Matches against deal or customer name"),
) -> list[DealSummary]:
    results = list(DEALS_BY_ID.values())
    if stage:
        results = [d for d in results if d.stage == stage]
    if region:
        results = [d for d in results if d.region == region]
    if search:
        q = search.strip().lower()
        results = [d for d in results if q in d.name.lower() or q in d.customerName.lower()]
    results.sort(key=lambda d: d.updatedAt, reverse=True)
    return [_summarize(d) for d in results]


@app.get("/deals/{deal_id}", response_model=Deal)
async def get_deal(deal_id: str) -> Deal:
    return _with_gates(_get_deal(deal_id))


@app.post("/deals/{deal_id}/stage", response_model=Deal)
async def change_stage(deal_id: str, req: StageChangeRequest) -> Deal:
    deal = _get_deal(deal_id)

    if req.stage == deal.stage:
        raise HTTPException(status_code=400, detail=f"Deal is already in stage '{deal.stage}'")

    if deal.stage in ("closed-won", "closed-lost"):
        raise HTTPException(status_code=400, detail=f"Deal is already closed ('{deal.stage}') and cannot change stage")

    if req.stage != "closed-lost":
        try:
            current_idx = DEAL_STAGE_ORDER.index(deal.stage)
            target_idx = DEAL_STAGE_ORDER.index(req.stage)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f"Unknown stage '{req.stage}'") from exc
        if target_idx <= current_idx:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot move from '{deal.stage}' back to '{req.stage}' — stages only move forward",
            )

    if req.stage == "contract":
        gates = _stakeholder_gates(deal)
        missing = [
            STAKEHOLDER_LABELS[s.role]
            for s in deal.stakeholders
            if gates[s.role][2] and s.status != "approved"
        ]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot move to Contract — pending approval from: {', '.join(missing)}",
            )

    now = _now()
    deal.previousStage = deal.stage
    deal.stage = req.stage
    deal.updatedAt = now
    label = "Deal closed — lost" if req.stage == "closed-lost" else f"Stage advanced to {STAGE_LABELS[req.stage]}"
    deal.timeline.append(
        TimelineEvent(id=f"tl-{uuid.uuid4().hex[:8]}", at=now, type="stage-change", message=label)
    )
    return _with_gates(deal)


@app.post("/deals/{deal_id}/stage/revert", response_model=Deal)
async def revert_stage(deal_id: str) -> Deal:
    deal = _get_deal(deal_id)
    if deal.previousStage is None:
        raise HTTPException(status_code=400, detail="No stage change to undo on this deal")

    now = _now()
    reverted_from = deal.stage
    deal.stage = deal.previousStage
    deal.previousStage = None
    deal.updatedAt = now
    deal.timeline.append(
        TimelineEvent(
            id=f"tl-{uuid.uuid4().hex[:8]}",
            at=now,
            type="stage-change",
            message=f"Stage reverted to {STAGE_LABELS[deal.stage]} — correcting {STAGE_LABELS[reverted_from]}",
        )
    )
    return _with_gates(deal)


@app.post("/deals/{deal_id}/stakeholders/{role}/signoff", response_model=Deal)
async def signoff_stakeholder(deal_id: str, role: StakeholderRole, req: StakeholderSignoffRequest) -> Deal:
    deal = _get_deal(deal_id)
    stakeholder = next((s for s in deal.stakeholders if s.role == role), None)
    if stakeholder is None:
        raise HTTPException(status_code=404, detail=f"No stakeholder with role '{role}' on this deal")

    locked, lock_reason, _ = _stakeholder_gates(deal)[role]
    if locked and req.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"{STAKEHOLDER_LABELS[role]} is locked — {lock_reason}",
        )

    now = _now()
    stakeholder.status = req.status
    stakeholder.signedAt = now if req.status in ("reviewed", "approved") else None
    deal.updatedAt = now

    verb = "approved" if req.status == "approved" else "reviewed" if req.status == "reviewed" else "reset to pending"
    deal.timeline.append(
        TimelineEvent(
            id=f"tl-{uuid.uuid4().hex[:8]}",
            at=now,
            type="stakeholder-signoff",
            message=f"{STAKEHOLDER_LABELS[role]} {verb}",
            actor=req.actor or stakeholder.name,
        )
    )
    return _with_gates(deal)


@app.post("/deals/{deal_id}/bom", response_model=Deal)
async def add_bom_item(deal_id: str, req: AddBomItemRequest) -> Deal:
    deal = _get_deal(deal_id)
    locked, lock_reason = _bom_lock(deal)
    if locked:
        raise HTTPException(status_code=400, detail=lock_reason)

    product = PRODUCTS_BY_ID.get(req.productId)
    if product is None:
        raise HTTPException(status_code=404, detail=f"No product found with id '{req.productId}'")

    quote = calculate_discount(
        product,
        QuoteRequest(productId=req.productId, segment=req.segment, units=req.quantity, termMonths=req.termMonths),
    )
    now = _now()
    item = BomLineItem(
        id=f"li-{uuid.uuid4().hex[:8]}",
        productId=product.id,
        productName=product.name,
        sku=product.sku,
        quantity=req.quantity,
        termMonths=req.termMonths,
        segment=req.segment,
        unitListPrice=product.basePrice,
        discountPercent=quote.discountPercent,
        netUnitPrice=quote.netUnitPrice,
        lineTotal=quote.netTotal,
        addedAt=now,
    )
    deal.bom.append(item)
    deal.updatedAt = now
    deal.timeline.append(
        TimelineEvent(
            id=f"tl-{uuid.uuid4().hex[:8]}",
            at=now,
            type="bom-edit",
            message=f"Added {product.name} ×{req.quantity} to BOM",
        )
    )
    return _with_gates(deal)


@app.delete("/deals/{deal_id}/bom/{item_id}", response_model=Deal)
async def remove_bom_item(deal_id: str, item_id: str) -> Deal:
    deal = _get_deal(deal_id)
    locked, lock_reason = _bom_lock(deal)
    if locked:
        raise HTTPException(status_code=400, detail=lock_reason)

    item = next((i for i in deal.bom if i.id == item_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail=f"No BOM line item with id '{item_id}' on this deal")

    now = _now()
    deal.bom = [i for i in deal.bom if i.id != item_id]
    deal.updatedAt = now
    deal.timeline.append(
        TimelineEvent(
            id=f"tl-{uuid.uuid4().hex[:8]}",
            at=now,
            type="bom-edit",
            message=f"Removed {item.productName} ×{item.quantity} from BOM",
        )
    )
    return _with_gates(deal)
