from typing import Literal

from pydantic import BaseModel, Field, field_validator

Region = Literal["us-east", "us-west", "eu-central", "apac", "latam"]
Category = Literal["compute", "gpu", "storage", "memory-optimized", "networking", "bare-metal"]
CustomerSegment = Literal["startup", "mid-market", "enterprise", "strategic", "public-sector"]
Availability = Literal["in-stock", "constrained", "backorder"]
TermMonths = Literal[12, 24, 36]


class DiscountTier(BaseModel):
    label: str
    percent: float = Field(ge=0, le=100)
    minUnits: int = Field(ge=0)


class ServerProduct(BaseModel):
    id: str
    name: str
    sku: str
    category: Category
    region: Region
    basePrice: float = Field(gt=0)
    listPriceDelta: float
    vcpu: int = Field(ge=0)
    memoryGb: int = Field(ge=0)
    storageTb: float = Field(ge=0)
    networkGbps: int = Field(ge=0)
    availability: Availability
    leadTimeDays: int = Field(ge=0)
    marginFloorPercent: float = Field(ge=0, le=100)
    discountTiers: list[DiscountTier]
    updatedAt: str


class QuoteRule(BaseModel):
    label: str
    delta: float
    detail: str


class ConfidenceFactor(BaseModel):
    """One real signal that moved the confidence score, with the reason."""

    label: str
    detail: str
    direction: Literal["up", "down"]


# --------------------------------------------------------------------------
# Manufacturing BOM — physical components that build one unit of a product.
# Distinct from a Deal's "Bill of materials" (which is SKUs + pricing sold
# to a customer): this is what it costs the company to build the SKU.
# --------------------------------------------------------------------------


class BomComponent(BaseModel):
    id: str
    name: str
    category: str
    supplier: str
    unitCost: float
    quantity: int
    leadTimeDays: int


class ProductBom(BaseModel):
    productId: str
    productName: str
    sku: str
    basePrice: float
    components: list[BomComponent]
    totalBomCost: float
    marginUsd: float
    marginPercent: float


class DiscountQuote(BaseModel):
    productId: str
    segment: CustomerSegment
    units: int
    termMonths: TermMonths
    basePrice: float
    listTotal: float
    discountPercent: float
    netUnitPrice: float
    netTotal: float
    savings: float
    confidence: Literal["high", "medium", "low"]
    confidenceScore: int
    marginPercent: float
    requiresApproval: bool
    rules: list[QuoteRule]
    confidenceFactors: list[ConfidenceFactor] = []


class QuoteRequest(BaseModel):
    productId: str = Field(min_length=1, description="Must reference an existing product SKU id")
    segment: CustomerSegment
    units: int = Field(gt=0, le=100_000, description="Unit volume must be a positive integer")
    termMonths: TermMonths

    @field_validator("productId")
    @classmethod
    def strip_product_id(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("productId must not be blank")
        return v


# --------------------------------------------------------------------------
# Deal / BOM management
# --------------------------------------------------------------------------

DealStage = Literal[
    "discovery",
    "technical-validation",
    "bom-finalized",
    "pricing-approval",
    "contract",
    "closed-won",
    "closed-lost",
]

StakeholderRole = Literal[
    "senior-leadership",
    "country-head-sales",
    "manufacturing-rd",
    "external-partner",
]

StakeholderStatus = Literal["pending", "reviewed", "approved"]

TimelineEventType = Literal["stage-change", "stakeholder-signoff", "bom-edit", "note"]

DEAL_STAGE_ORDER: list[DealStage] = [
    "discovery",
    "technical-validation",
    "bom-finalized",
    "pricing-approval",
    "contract",
    "closed-won",
]


class Stakeholder(BaseModel):
    role: StakeholderRole
    name: str
    title: str
    status: StakeholderStatus
    signedAt: str | None = None
    # Computed fresh on every response by _with_gates() in main.py — never
    # trust a stored value for these, they depend on the other stakeholders'
    # current status and the live BOM.
    locked: bool = False
    lockReason: str | None = None
    required: bool = True


class BomLineItem(BaseModel):
    id: str
    productId: str
    productName: str
    sku: str
    quantity: int = Field(gt=0)
    termMonths: TermMonths
    segment: CustomerSegment
    unitListPrice: float
    discountPercent: float
    netUnitPrice: float
    lineTotal: float
    addedAt: str


class TimelineEvent(BaseModel):
    id: str
    at: str
    type: TimelineEventType
    message: str
    actor: str | None = None


class DealSummary(BaseModel):
    id: str
    name: str
    customerName: str
    region: Region
    stage: DealStage
    bomTotal: float
    lineItemCount: int
    stakeholdersApproved: int
    stakeholdersTotal: int
    createdAt: str
    updatedAt: str


class Deal(BaseModel):
    id: str
    name: str
    customerName: str
    region: Region
    stage: DealStage
    createdAt: str
    updatedAt: str
    stakeholders: list[Stakeholder]
    bom: list[BomLineItem]
    timeline: list[TimelineEvent]
    # Single-level undo: set to the prior stage whenever the stage changes,
    # cleared after one revert. Not a full history — just enough to fix a
    # misclick without letting the audit trail become editable.
    previousStage: DealStage | None = None
    # Computed fresh on every response by _with_gates() in main.py — the BOM
    # is editable through Technical Validation, then locked once the stage
    # says "BOM Finalized" or later, so that stage name means something.
    bomLocked: bool = False
    bomLockReason: str | None = None


class AddBomItemRequest(BaseModel):
    productId: str = Field(min_length=1)
    quantity: int = Field(gt=0, le=100_000, description="Quantity must be a positive integer")
    termMonths: TermMonths
    segment: CustomerSegment


class StakeholderSignoffRequest(BaseModel):
    status: StakeholderStatus
    actor: str | None = Field(default=None, description="Name of the person recording this update")


class StageChangeRequest(BaseModel):
    stage: DealStage
