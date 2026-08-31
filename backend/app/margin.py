"""
Margin-based deal validation.

For each portfolio line, derives a 5-tier discount-validation band from
GM% and COS%:

    Base Max Discount % = (1 - GM% - COS%) / (1 - GM%) x 100

...then spreads that base across 5 graduated tiers (Optimal through Review
Needed) by scaling it with fixed multipliers, giving an increasing ceiling
per tier. The Requested Discount % is checked against those ceilings to
assign a 4-level rating (Good / Fair / Weak / Poor).
"""

from app.margin_data import (
    CUSTOMER_PORTFOLIO_HISTORY,
    MARGIN_CUSTOMERS_BY_ID,
    PORTFOLIOS_BY_ID,
)
from app.models import (
    BandTier,
    Channel,
    ConfidenceFactor,
    DealMarginCalcRequest,
    DealMarginCalcResponse,
    MarginChannelGroup,
    MarginConfidence,
    MarginLineRequest,
    MarginLineResult,
    MarginPortfolio,
    MarginTotalRow,
    RiskRating,
)

TIER_NAMES = ["Optimal", "Solid", "Acceptable", "Caution", "Review Needed"]
TIER_MULTIPLIERS = [0.2, 0.35, 0.5, 0.7, 1.0]

_RATING_ORDER: list[RiskRating] = ["Good", "Fair", "Weak", "Poor"]


def compute_band(portfolio: MarginPortfolio) -> list[BandTier]:
    gm = portfolio.grossMarginPercent / 100
    cos = portfolio.costOfSalesPercent / 100
    base_max_discount = (1 - gm - cos) / (1 - gm) * 100

    tiers: list[BandTier] = []
    for name, mult in zip(TIER_NAMES, TIER_MULTIPLIERS):
        threshold = max(0.0, min(95.0, round(base_max_discount * mult, 1)))
        tiers.append(BandTier(tier=name, maxDiscountPercent=threshold))
    return tiers


def _rate(requested_discount: float, band: list[BandTier]) -> RiskRating:
    solid, acceptable, caution = band[1].maxDiscountPercent, band[2].maxDiscountPercent, band[3].maxDiscountPercent
    if requested_discount <= solid:
        return "Good"
    if requested_discount <= acceptable:
        return "Fair"
    if requested_discount <= caution:
        return "Weak"
    return "Poor"


def _worst_rating(ratings: list[RiskRating]) -> RiskRating:
    return max(ratings, key=_RATING_ORDER.index)


def _total_row(lines: list[MarginLineResult]) -> MarginTotalRow:
    gross = sum(l.grossOrderValueUsd for l in lines)
    net = sum(l.netOrderValueUsd for l in lines)
    blended_discount = round((1 - net / gross) * 100, 1) if gross else 0.0
    return MarginTotalRow(
        grossOrderValueUsd=round(gross, 2),
        netOrderValueUsd=round(net, 2),
        blendedDiscountPercent=blended_discount,
        rating=_worst_rating([l.rating for l in lines]),
    )


def _calc_line(customer_id: str, line: MarginLineRequest) -> MarginLineResult:
    portfolio = PORTFOLIOS_BY_ID[line.portfolioId]
    band = compute_band(portfolio)
    net = round(line.grossOrderValueUsd * (1 - line.requestedDiscountPercent / 100), 2)
    rating = _rate(line.requestedDiscountPercent, band)
    history = CUSTOMER_PORTFOLIO_HISTORY.get((customer_id, line.portfolioId))

    return MarginLineResult(
        portfolioId=portfolio.id,
        portfolioName=portfolio.name,
        channel=line.channel,
        grossOrderValueUsd=line.grossOrderValueUsd,
        requestedDiscountPercent=line.requestedDiscountPercent,
        netOrderValueUsd=net,
        band=band,
        rating=rating,
        historicalDiscountPercent=history[0] if history else None,
        previousNetOrderUsd=history[1] if history else None,
    )


def _confidence(req: DealMarginCalcRequest, all_lines: list[MarginLineResult]) -> MarginConfidence:
    score = 60
    factors: list[ConfidenceFactor] = []

    poor_lines = [l for l in all_lines if l.rating == "Poor"]
    if poor_lines:
        score -= 22
        factors.append(
            ConfidenceFactor(
                label="Band exceeded",
                detail=f"{len(poor_lines)} line(s) land in the Review Needed band — margin erosion risk is real",
                direction="down",
            )
        )
    elif all(l.rating == "Good" for l in all_lines):
        score += 15
        factors.append(
            ConfidenceFactor(
                label="Clean band fit",
                detail="Every line sits within the Optimal/Solid tiers of its portfolio's band",
                direction="up",
            )
        )
    else:
        factors.append(
            ConfidenceFactor(
                label="Mixed band fit",
                detail="Lines land across multiple tiers — no single risk signal dominates",
                direction="up",
            )
        )

    aligned = [
        l
        for l in all_lines
        if l.historicalDiscountPercent is not None
        and abs(l.requestedDiscountPercent - l.historicalDiscountPercent) <= 3
    ]
    if aligned:
        score += 12
        factors.append(
            ConfidenceFactor(
                label="Matches customer history",
                detail=f"{len(aligned)} line(s) track within 3pts of this customer's past discount rate",
                direction="up",
            )
        )
    else:
        score -= 6
        factors.append(
            ConfidenceFactor(
                label="Departs from customer history",
                detail="Requested discounts diverge from this customer's historical pattern",
                direction="down",
            )
        )

    channels = {l.channel for l in all_lines}
    if len(channels) > 1:
        score -= 5
        factors.append(
            ConfidenceFactor(
                label="Multi-channel deal",
                detail="Spans Direct and Indirect — pricing coordination across channels adds risk",
                direction="down",
            )
        )

    score = max(10, min(95, score))
    level = "high" if score >= 75 else "medium" if score >= 50 else "low"
    return MarginConfidence(score=score, level=level, factors=factors)


def calculate_deal_margin(req: DealMarginCalcRequest) -> DealMarginCalcResponse:
    customer = MARGIN_CUSTOMERS_BY_ID[req.customerId]

    all_lines = [_calc_line(req.customerId, line) for line in req.lines]

    channels: list[Channel] = []
    for line in all_lines:
        if line.channel not in channels:
            channels.append(line.channel)

    groups = [
        MarginChannelGroup(
            channel=channel,
            lines=[l for l in all_lines if l.channel == channel],
            total=_total_row([l for l in all_lines if l.channel == channel]),
        )
        for channel in channels
    ]

    return DealMarginCalcResponse(
        customerId=customer.id,
        customerName=customer.name,
        region=req.region,
        fiscalPeriod=req.fiscalPeriod,
        dealMotion=req.dealMotion,
        channelGroups=groups,
        grandTotal=_total_row(all_lines),
        confidence=_confidence(req, all_lines),
    )
