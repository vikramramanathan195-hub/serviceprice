"""
In-memory seed deals for the Deal/BOM management demo.

Stakeholder chronology follows the real approval hierarchy (see
_stakeholder_gates in main.py): Country Head/Sales approves first,
Manufacturing/R&D and External Partner are an independent second tier that
unlocks once Country Head/Sales approves, and Senior Leadership is the
final executive gate — only meaningful once a BOM's discount actually
requires escalation (>20% on some line).
"""

from app.data import PRODUCTS_BY_ID
from app.discount import calculate_discount
from app.models import (
    BomLineItem,
    CustomerSegment,
    Deal,
    Stakeholder,
    TermMonths,
    TimelineEvent,
)


def _line_item(
    item_id: str,
    product_id: str,
    quantity: int,
    term_months: TermMonths,
    segment: CustomerSegment,
    added_at: str,
) -> BomLineItem:
    from app.models import QuoteRequest

    product = PRODUCTS_BY_ID[product_id]
    quote = calculate_discount(
        product,
        QuoteRequest(productId=product_id, segment=segment, units=quantity, termMonths=term_months),
    )
    return BomLineItem(
        id=item_id,
        productId=product.id,
        productName=product.name,
        sku=product.sku,
        quantity=quantity,
        termMonths=term_months,
        segment=segment,
        unitListPrice=product.basePrice,
        discountPercent=quote.discountPercent,
        netUnitPrice=quote.netUnitPrice,
        lineTotal=quote.netTotal,
        addedAt=added_at,
    )


def _stakeholders(
    country_head: tuple[str, str, str, str | None],
    mfg_rd: tuple[str, str, str, str | None],
    external: tuple[str, str, str, str | None],
    leadership: tuple[str, str, str, str | None],
) -> list[Stakeholder]:
    rows = [
        ("country-head-sales", country_head),
        ("manufacturing-rd", mfg_rd),
        ("external-partner", external),
        ("senior-leadership", leadership),
    ]
    return [
        Stakeholder(role=role, name=name, title=title, status=status, signedAt=signed_at)
        for role, (name, title, status, signed_at) in rows
    ]


DEALS: list[Deal] = [
    # BOM max discount 29% -> executive sign-off required. Country Head
    # approved first, both tier-2 roles approved, leadership still pending
    # because it's the last gate to clear.
    Deal(
        id="deal-atlas-americas",
        name="Atlas Compute Refresh — Kestrel Americas",
        customerName="Kestrel Dynamics — Americas Enterprise",
        region="us-east",
        stage="pricing-approval",
        createdAt="2026-08-04T13:00:00Z",
        updatedAt="2026-08-29T17:20:00Z",
        stakeholders=_stakeholders(
            ("Dana Ruiz", "Country Head, US Sales", "approved", "2026-08-10T14:00:00Z"),
            ("Priya Nandakumar", "Director, Manufacturing Ops", "approved", "2026-08-24T14:10:00Z"),
            ("Chen Wu", "External Partner — Solace Manufacturing", "approved", "2026-08-26T09:00:00Z"),
            ("Marcus Webb", "SVP, Global Sales", "pending", None),
        ),
        bom=[
            _line_item("li-1", "srv-c7i-metal", 40, 24, "enterprise", "2026-08-10T10:00:00Z"),
            _line_item("li-2", "srv-net-fab400", 8, 24, "enterprise", "2026-08-14T09:30:00Z"),
        ],
        timeline=[
            TimelineEvent(id="tl-1", at="2026-08-04T13:00:00Z", type="stage-change", message="Deal created — Discovery", actor=None),
            TimelineEvent(id="tl-2", at="2026-08-10T10:00:00Z", type="bom-edit", message="Added Atlas C7i Compute Node ×40 to BOM", actor=None),
            TimelineEvent(id="tl-3", at="2026-08-10T14:00:00Z", type="stakeholder-signoff", message="Country Head/Sales approved", actor="Dana Ruiz"),
            TimelineEvent(id="tl-4", at="2026-08-14T09:30:00Z", type="bom-edit", message="Added Meridian Fabric 400G Switch ×8 to BOM", actor=None),
            TimelineEvent(id="tl-5", at="2026-08-16T11:00:00Z", type="stage-change", message="Stage advanced to Technical Validation", actor=None),
            TimelineEvent(id="tl-6", at="2026-08-20T09:00:00Z", type="stage-change", message="Stage advanced to BOM Finalized", actor=None),
            TimelineEvent(id="tl-7", at="2026-08-24T14:10:00Z", type="stakeholder-signoff", message="Manufacturing/R&D approved", actor="Priya Nandakumar"),
            TimelineEvent(id="tl-8", at="2026-08-26T09:00:00Z", type="stakeholder-signoff", message="External Partner approved", actor="Chen Wu"),
            TimelineEvent(id="tl-9", at="2026-08-29T17:20:00Z", type="stage-change", message="Stage advanced to Pricing Approval", actor=None),
            TimelineEvent(id="tl-10", at="2026-08-29T17:25:00Z", type="note", message="Discount exceeds 20% — routed to Senior Leadership for final sign-off", actor=None),
        ],
    ),
    # BOM max discount 30.5% -> exec required. Only Country Head has
    # cleared; tier-2 still in progress, leadership locked until then.
    Deal(
        id="deal-gpu-emea",
        name="Nimbus GPU Cluster — Kestrel EMEA",
        customerName="Kestrel Dynamics — EMEA Financial Services",
        region="eu-central",
        stage="technical-validation",
        createdAt="2026-08-15T08:30:00Z",
        updatedAt="2026-08-28T12:00:00Z",
        stakeholders=_stakeholders(
            ("Lukas Bergmann", "Country Head, DACH", "approved", "2026-08-20T13:00:00Z"),
            ("Priya Nandakumar", "Director, Manufacturing Ops", "reviewed", "2026-08-22T10:00:00Z"),
            ("Sofia Marchetti", "External Partner — Solace Manufacturing EU", "pending", None),
            ("Marcus Webb", "SVP, Global Sales", "pending", None),
        ),
        bom=[
            _line_item("li-3", "srv-h100-8x", 4, 24, "strategic", "2026-08-16T09:00:00Z"),
            _line_item("li-4", "srv-l40s-4x", 6, 12, "strategic", "2026-08-19T14:20:00Z"),
        ],
        timeline=[
            TimelineEvent(id="tl-11", at="2026-08-15T08:30:00Z", type="stage-change", message="Deal created — Discovery", actor=None),
            TimelineEvent(id="tl-12", at="2026-08-16T09:00:00Z", type="bom-edit", message="Added Nimbus H100 8-Way Accelerator ×4 to BOM", actor=None),
            TimelineEvent(id="tl-13", at="2026-08-19T14:20:00Z", type="bom-edit", message="Added Nimbus L40S Inference Node ×6 to BOM", actor=None),
            TimelineEvent(id="tl-14", at="2026-08-20T13:00:00Z", type="stakeholder-signoff", message="Country Head/Sales approved", actor="Lukas Bergmann"),
            TimelineEvent(id="tl-15", at="2026-08-21T10:00:00Z", type="stage-change", message="Stage advanced to Technical Validation", actor=None),
            TimelineEvent(id="tl-16", at="2026-08-22T10:00:00Z", type="stakeholder-signoff", message="Manufacturing/R&D reviewed, awaiting supply confirmation", actor="Priya Nandakumar"),
            TimelineEvent(id="tl-17", at="2026-08-28T12:00:00Z", type="note", message="Supply constrained on H100 — 45 day lead time flagged to customer", actor=None),
        ],
    ),
    # BOM max discount 18% -> no executive sign-off needed at all.
    # Leadership shows as "not required" rather than pending.
    Deal(
        id="deal-storage-apac",
        name="Vault Storage Expansion — Kestrel APAC",
        customerName="Kestrel Dynamics — APAC Public Sector",
        region="apac",
        stage="discovery",
        createdAt="2026-08-26T05:00:00Z",
        updatedAt="2026-08-27T06:40:00Z",
        stakeholders=_stakeholders(
            ("Rahul Menon", "Country Head, India/SEA", "reviewed", "2026-08-27T06:40:00Z"),
            ("Priya Nandakumar", "Director, Manufacturing Ops", "pending", None),
            ("Kenji Watanabe", "External Partner — Solace Manufacturing APAC", "pending", None),
            ("Grace Tan", "VP, APAC Sales", "pending", None),
        ),
        bom=[
            _line_item("li-5", "srv-stor-nvme", 10, 12, "public-sector", "2026-08-26T05:30:00Z"),
        ],
        timeline=[
            TimelineEvent(id="tl-18", at="2026-08-26T05:00:00Z", type="stage-change", message="Deal created — Discovery", actor=None),
            TimelineEvent(id="tl-19", at="2026-08-26T05:30:00Z", type="bom-edit", message="Added Vault NVMe Flash Array ×10 to BOM", actor=None),
            TimelineEvent(id="tl-20", at="2026-08-27T06:40:00Z", type="stakeholder-signoff", message="Country Head/Sales reviewed initial scope", actor="Rahul Menon"),
        ],
    ),
    # BOM max discount 22% -> exec required, and the full chain has
    # cleared in the correct order (this deal is already in Contract).
    Deal(
        id="deal-bm-latam",
        name="Titan Bare Metal Rollout — Kestrel LATAM",
        customerName="Kestrel Dynamics — LATAM Telco",
        region="latam",
        stage="contract",
        createdAt="2026-07-20T09:00:00Z",
        updatedAt="2026-08-25T16:15:00Z",
        stakeholders=_stakeholders(
            ("Isabela Ferreira", "Country Head, Brazil", "approved", "2026-07-28T12:00:00Z"),
            ("Priya Nandakumar", "Director, Manufacturing Ops", "approved", "2026-08-05T11:00:00Z"),
            ("Diego Alvarez", "External Partner — Solace Manufacturing LATAM", "approved", "2026-08-08T10:45:00Z"),
            ("Marcus Webb", "SVP, Global Sales", "approved", "2026-08-20T09:30:00Z"),
        ),
        bom=[
            _line_item("li-6", "srv-bm-epyc", 15, 36, "enterprise", "2026-07-22T08:00:00Z"),
            _line_item("li-7", "srv-c7i-latam", 25, 12, "enterprise", "2026-07-25T13:00:00Z"),
        ],
        timeline=[
            TimelineEvent(id="tl-21", at="2026-07-20T09:00:00Z", type="stage-change", message="Deal created — Discovery", actor=None),
            TimelineEvent(id="tl-22", at="2026-07-22T08:00:00Z", type="bom-edit", message="Added Titan EPYC Bare Metal ×15 to BOM", actor=None),
            TimelineEvent(id="tl-23", at="2026-07-25T13:00:00Z", type="bom-edit", message="Added Atlas C7i Compute Node (BR) ×25 to BOM", actor=None),
            TimelineEvent(id="tl-24", at="2026-07-28T09:00:00Z", type="stage-change", message="Stage advanced to Technical Validation", actor=None),
            TimelineEvent(id="tl-25", at="2026-07-28T12:00:00Z", type="stakeholder-signoff", message="Country Head/Sales approved", actor="Isabela Ferreira"),
            TimelineEvent(id="tl-26", at="2026-08-01T09:00:00Z", type="stage-change", message="Stage advanced to BOM Finalized", actor=None),
            TimelineEvent(id="tl-27", at="2026-08-05T11:00:00Z", type="stakeholder-signoff", message="Manufacturing/R&D approved production plan", actor="Priya Nandakumar"),
            TimelineEvent(id="tl-28", at="2026-08-08T10:45:00Z", type="stakeholder-signoff", message="External Partner approved fulfillment terms", actor="Diego Alvarez"),
            TimelineEvent(id="tl-29", at="2026-08-10T09:00:00Z", type="stage-change", message="Stage advanced to Pricing Approval", actor=None),
            TimelineEvent(id="tl-30", at="2026-08-20T09:30:00Z", type="stakeholder-signoff", message="Senior Leadership approved", actor="Marcus Webb"),
            TimelineEvent(id="tl-31", at="2026-08-25T16:15:00Z", type="stage-change", message="Stage advanced to Contract", actor=None),
        ],
    ),
    # BOM max discount 56% -> exec sign-off required, but the deal died
    # before Manufacturing/R&D and External Partner cleared, so Senior
    # Leadership was still locked out when it fell through — the margin
    # concern that killed it never even reached a formal executive review.
    Deal(
        id="deal-edge-westcoast",
        name="Edge Micro Rollout — Kestrel West Coast Retail",
        customerName="Kestrel Dynamics — US West Retail Chain",
        region="us-west",
        stage="closed-lost",
        createdAt="2026-06-10T09:00:00Z",
        updatedAt="2026-07-02T17:00:00Z",
        stakeholders=_stakeholders(
            ("Dana Ruiz", "Country Head, US Sales", "approved", "2026-06-18T14:00:00Z"),
            ("Priya Nandakumar", "Director, Manufacturing Ops", "reviewed", "2026-06-22T10:00:00Z"),
            ("Chen Wu", "External Partner — Solace Manufacturing", "pending", None),
            ("Marcus Webb", "SVP, Global Sales", "pending", None),
        ),
        bom=[
            _line_item("li-8", "srv-edge-m2", 200, 36, "strategic", "2026-06-12T09:00:00Z"),
        ],
        timeline=[
            TimelineEvent(id="tl-32", at="2026-06-10T09:00:00Z", type="stage-change", message="Deal created — Discovery", actor=None),
            TimelineEvent(id="tl-33", at="2026-06-12T09:00:00Z", type="bom-edit", message="Added Edge M2 Micro Server ×200 to BOM", actor=None),
            TimelineEvent(id="tl-34", at="2026-06-18T14:00:00Z", type="stakeholder-signoff", message="Country Head/Sales approved", actor="Dana Ruiz"),
            TimelineEvent(id="tl-35", at="2026-06-22T10:00:00Z", type="stakeholder-signoff", message="Manufacturing/R&D reviewed, margin concerns raised on 56% discount", actor="Priya Nandakumar"),
            TimelineEvent(id="tl-36", at="2026-07-02T17:00:00Z", type="stage-change", message="Deal closed — lost to competitor on price before reaching executive review", actor=None),
        ],
    ),
    # BOM max discount 10.5% -> no executive sign-off needed; Country Head
    # has approved, tier-2 in progress.
    Deal(
        id="deal-mem-nordics",
        name="Halo Memory Node Upgrade — Kestrel Nordics",
        customerName="Kestrel Dynamics — Nordics Cloud Provider",
        region="eu-central",
        stage="bom-finalized",
        createdAt="2026-08-18T07:00:00Z",
        updatedAt="2026-08-29T09:30:00Z",
        stakeholders=_stakeholders(
            ("Lukas Bergmann", "Country Head, DACH", "approved", "2026-08-25T09:00:00Z"),
            ("Priya Nandakumar", "Director, Manufacturing Ops", "reviewed", "2026-08-27T11:15:00Z"),
            ("Sofia Marchetti", "External Partner — Solace Manufacturing EU", "pending", None),
            ("Marcus Webb", "SVP, Global Sales", "pending", None),
        ),
        bom=[
            _line_item("li-9", "srv-mem-x9", 12, 36, "mid-market", "2026-08-19T10:00:00Z"),
        ],
        timeline=[
            TimelineEvent(id="tl-37", at="2026-08-18T07:00:00Z", type="stage-change", message="Deal created — Discovery", actor=None),
            TimelineEvent(id="tl-38", at="2026-08-19T10:00:00Z", type="bom-edit", message="Added Halo X9 Memory Node ×12 to BOM", actor=None),
            TimelineEvent(id="tl-39", at="2026-08-22T09:00:00Z", type="stage-change", message="Stage advanced to Technical Validation", actor=None),
            TimelineEvent(id="tl-40", at="2026-08-25T09:00:00Z", type="stakeholder-signoff", message="Country Head/Sales approved", actor="Lukas Bergmann"),
            TimelineEvent(id="tl-41", at="2026-08-27T11:15:00Z", type="stakeholder-signoff", message="Manufacturing/R&D reviewed final BOM", actor="Priya Nandakumar"),
            TimelineEvent(id="tl-42", at="2026-08-29T09:30:00Z", type="stage-change", message="Stage advanced to BOM Finalized", actor=None),
        ],
    ),
]

DEALS_BY_ID: dict[str, Deal] = {d.id: d for d in DEALS}
