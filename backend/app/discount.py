"""
Discount calculation — ported 1:1 from src/lib/serverprice/discount.ts so the
backend and the frontend's offline fallback always agree.
"""

from app.data import REGION_ADJUST, REGION_SHORT, SEGMENT_RULES
from app.models import (
    ConfidenceFactor,
    DiscountQuote,
    QuoteRequest,
    QuoteRule,
    ServerProduct,
)


def calculate_discount(product: ServerProduct, req: QuoteRequest) -> DiscountQuote:
    rules: list[QuoteRule] = []

    segment_rule = SEGMENT_RULES[req.segment]
    rules.append(
        QuoteRule(
            label=f"Segment baseline — {req.segment.replace('-', ' ')}",
            delta=segment_rule["base"],
            detail=segment_rule["note"],
        )
    )

    matching_tiers = [
        t
        for t in product.discountTiers
        if req.units >= t.minUnits and t.label.startswith(str(req.termMonths))
    ]
    tier = max(matching_tiers, key=lambda t: t.percent) if matching_tiers else None

    if tier:
        rules.append(
            QuoteRule(
                label=f"Commit tier — {tier.label}",
                delta=tier.percent,
                detail=f"Published tier for {tier.minUnits}+ units on this SKU",
            )
        )
    else:
        nearest = min(product.discountTiers, key=lambda t: t.minUnits, default=None)
        rules.append(
            QuoteRule(
                label="Commit tier — not reached",
                delta=0,
                detail=(
                    f"Needs {nearest.minUnits} units on a {nearest.label} to unlock {nearest.percent}%"
                    if nearest
                    else "No published commit tiers for this SKU"
                ),
            )
        )

    region = REGION_ADJUST[product.region]
    rules.append(
        QuoteRule(
            label=f"Region adjustment — {REGION_SHORT[product.region]}",
            delta=region["delta"],
            detail=region["reason"],
        )
    )

    if product.availability in ("constrained", "backorder"):
        penalty = -4 if product.availability == "backorder" else -2
        rules.append(
            QuoteRule(
                label="Supply constraint hold-back",
                delta=penalty,
                detail=f"{product.leadTimeDays}-day lead time — pricing desk restricts concessions",
            )
        )

    if req.units >= 50:
        rules.append(
            QuoteRule(
                label="Volume override",
                delta=3,
                detail=f"{req.units} units clears the 50-unit strategic volume gate",
            )
        )

    raw = sum(r.delta for r in rules)
    max_allowed = 100 - product.marginFloorPercent
    discount_percent = max(0, min(raw, max_allowed))

    if raw > max_allowed:
        rules.append(
            QuoteRule(
                label="Margin floor cap",
                delta=round(max_allowed - raw, 1),
                detail=f"Capped at {max_allowed}% to protect the {product.marginFloorPercent}% margin floor",
            )
        )

    list_total = product.basePrice * req.units * req.termMonths
    net_unit_price = product.basePrice * (1 - discount_percent / 100)
    net_total = net_unit_price * req.units * req.termMonths

    # Confidence is scored from real signals, and each signal that moves the
    # score records the reason it moved — the UI renders these verbatim rather
    # than guessing a canned explanation from the final band.
    score = 55
    factors: list[ConfidenceFactor] = []

    sample_size = segment_rule["sampleSize"]
    if sample_size > 200:
        score += 20
        factors.append(
            ConfidenceFactor(
                label="Deep deal history",
                detail=f"{sample_size} closed {req.segment.replace('-', ' ')} deals back this rate",
                direction="up",
            )
        )
    elif sample_size > 100:
        score += 12
        factors.append(
            ConfidenceFactor(
                label="Moderate deal history",
                detail=f"{sample_size} comparable {req.segment.replace('-', ' ')} deals on record",
                direction="up",
            )
        )
    else:
        score += 4
        factors.append(
            ConfidenceFactor(
                label="Thin deal history",
                detail=f"Only {sample_size} comparable {req.segment.replace('-', ' ')} deals to reference",
                direction="down",
            )
        )

    if tier:
        score += 14
        factors.append(
            ConfidenceFactor(
                label="Exact rate card match",
                detail=f"Hits the published {tier.label} tier at {tier.minUnits}+ units",
                direction="up",
            )
        )
    else:
        factors.append(
            ConfidenceFactor(
                label="No commit tier matched",
                detail="Priced off segment and region rules alone — no published tier applies",
                direction="down",
            )
        )

    if product.availability == "in-stock":
        score += 10
        factors.append(
            ConfidenceFactor(
                label="Supply confirmed",
                detail=f"In stock, {product.leadTimeDays}-day lead time",
                direction="up",
            )
        )
    elif product.availability == "backorder":
        score -= 12
        factors.append(
            ConfidenceFactor(
                label="On backorder",
                detail=f"{product.leadTimeDays}-day lead time puts the quote date at risk",
                direction="down",
            )
        )
    else:
        factors.append(
            ConfidenceFactor(
                label="Supply constrained",
                detail=f"{product.leadTimeDays}-day lead time — allocation not guaranteed",
                direction="down",
            )
        )

    margin_percent = 100 - product.marginFloorPercent - discount_percent
    if margin_percent < 5:
        score -= 18
        factors.append(
            ConfidenceFactor(
                label="Close to margin floor",
                detail=f"Only {round(margin_percent, 1)}% headroom above the {product.marginFloorPercent}% floor",
                direction="down",
            )
        )

    score = max(12, min(97, score))
    confidence = "high" if score >= 78 else "medium" if score >= 55 else "low"

    return DiscountQuote(
        productId=product.id,
        segment=req.segment,
        units=req.units,
        termMonths=req.termMonths,
        basePrice=product.basePrice,
        listTotal=list_total,
        discountPercent=round(discount_percent, 1),
        netUnitPrice=round(net_unit_price, 2),
        netTotal=round(net_total, 2),
        savings=round(list_total - net_total, 2),
        confidence=confidence,
        confidenceScore=score,
        marginPercent=round(margin_percent, 1),
        requiresApproval=discount_percent > 20 or margin_percent < 6,
        rules=rules,
        confidenceFactors=factors,
    )
