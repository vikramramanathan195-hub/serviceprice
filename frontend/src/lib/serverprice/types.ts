export type Region = "us-east" | "us-west" | "eu-central" | "apac" | "latam";

export type Category =
  "compute" | "gpu" | "storage" | "memory-optimized" | "networking" | "bare-metal";

export type CustomerSegment =
  "startup" | "mid-market" | "enterprise" | "strategic" | "public-sector";

export interface DiscountTier {
  /** e.g. "12mo commit" */
  label: string;
  /** percentage, 0-100 */
  percent: number;
  /** minimum unit volume required */
  minUnits: number;
}

export interface ServerProduct {
  id: string;
  name: string;
  sku: string;
  category: Category;
  region: Region;
  basePrice: number; // monthly USD per unit
  listPriceDelta: number; // % change vs last quarter
  vcpu: number;
  memoryGb: number;
  storageTb: number;
  networkGbps: number;
  availability: "in-stock" | "constrained" | "backorder";
  leadTimeDays: number;
  marginFloorPercent: number;
  discountTiers: DiscountTier[];
  updatedAt: string;
}

export interface ConfidenceFactor {
  label: string;
  detail: string;
  direction: "up" | "down";
}

export interface DiscountQuote {
  productId: string;
  segment: CustomerSegment;
  units: number;
  termMonths: number;
  basePrice: number;
  listTotal: number;
  discountPercent: number;
  netUnitPrice: number;
  netTotal: number;
  savings: number;
  confidence: "high" | "medium" | "low";
  confidenceScore: number;
  marginPercent: number;
  requiresApproval: boolean;
  rules: { label: string; delta: number; detail: string }[];
  confidenceFactors: ConfidenceFactor[];
}

/* ------------------------------------------------------------------ */
/* Deal / BOM management                                               */
/* ------------------------------------------------------------------ */

export type DealStage =
  | "discovery"
  | "technical-validation"
  | "bom-finalized"
  | "pricing-approval"
  | "contract"
  | "closed-won"
  | "closed-lost";

export type StakeholderRole =
  "senior-leadership" | "country-head-sales" | "manufacturing-rd" | "external-partner";

export type StakeholderStatus = "pending" | "reviewed" | "approved";

export type TimelineEventType = "stage-change" | "stakeholder-signoff" | "bom-edit" | "note";

export interface Stakeholder {
  role: StakeholderRole;
  name: string;
  title: string;
  status: StakeholderStatus;
  signedAt: string | null;
  /** Computed server-side on every response — never stored, always fresh. */
  locked: boolean;
  lockReason: string | null;
  required: boolean;
}

export interface BomLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  termMonths: 12 | 24 | 36;
  segment: CustomerSegment;
  unitListPrice: number;
  discountPercent: number;
  netUnitPrice: number;
  lineTotal: number;
  addedAt: string;
}

export interface TimelineEvent {
  id: string;
  at: string;
  type: TimelineEventType;
  message: string;
  actor: string | null;
}

// Manufacturing BOM — physical components behind a SKU, distinct from a
// Deal's Bill of Materials (customer-facing SKUs + pricing).
export interface BomComponent {
  id: string;
  name: string;
  category: string;
  supplier: string;
  unitCost: number;
  quantity: number;
  leadTimeDays: number;
}

export interface ProductBom {
  productId: string;
  productName: string;
  sku: string;
  basePrice: number;
  components: BomComponent[];
  totalBomCost: number;
  marginUsd: number;
  marginPercent: number;
}

export interface DealSummary {
  id: string;
  name: string;
  customerName: string;
  region: Region;
  stage: DealStage;
  bomTotal: number;
  lineItemCount: number;
  stakeholdersApproved: number;
  stakeholdersTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  name: string;
  customerName: string;
  region: Region;
  stage: DealStage;
  createdAt: string;
  updatedAt: string;
  stakeholders: Stakeholder[];
  bom: BomLineItem[];
  timeline: TimelineEvent[];
  /** Set whenever the stage changes; cleared after one revert. Single-level undo only. */
  previousStage: DealStage | null;
  /** Computed server-side — true once the stage reaches BOM Finalized or later. */
  bomLocked: boolean;
  bomLockReason: string | null;
}

/* ------------------------------------------------------------------ */
/* Margin-based deal validation                                        */
/* ------------------------------------------------------------------ */

export type Channel = "direct" | "indirect";

export type DealMotion = "new-business" | "renewal" | "expansion" | "displacement";

export type RiskRating = "Good" | "Fair" | "Weak" | "Poor";

export interface MarginPortfolio {
  id: string;
  name: string;
  grossMarginPercent: number;
  costOfSalesPercent: number;
}

export interface MarginCustomer {
  id: string;
  name: string;
  region: Region;
}

export interface BandTier {
  tier: string;
  maxDiscountPercent: number;
}

export interface MarginLineInput {
  portfolioId: string;
  channel: Channel;
  grossOrderValueUsd: number;
  requestedDiscountPercent: number;
}

export interface MarginLineResult {
  portfolioId: string;
  portfolioName: string;
  channel: Channel;
  grossOrderValueUsd: number;
  requestedDiscountPercent: number;
  netOrderValueUsd: number;
  band: BandTier[];
  rating: RiskRating;
  historicalDiscountPercent: number | null;
  previousNetOrderUsd: number | null;
}

export interface MarginTotalRow {
  grossOrderValueUsd: number;
  netOrderValueUsd: number;
  blendedDiscountPercent: number;
  rating: RiskRating;
}

export interface MarginChannelGroup {
  channel: Channel;
  lines: MarginLineResult[];
  total: MarginTotalRow;
}

export interface MarginConfidence {
  score: number;
  level: "high" | "medium" | "low";
  factors: ConfidenceFactor[];
}

export interface DealMarginCalcRequest {
  customerId: string;
  region: Region;
  dealMotion: DealMotion[];
  fiscalPeriod: string;
  lines: MarginLineInput[];
}

export interface DealMarginCalcResponse {
  customerId: string;
  customerName: string;
  region: Region;
  fiscalPeriod: string;
  dealMotion: DealMotion[];
  channelGroups: MarginChannelGroup[];
  grandTotal: MarginTotalRow;
  confidence: MarginConfidence;
}

export interface MarginMeta {
  fiscalPeriods: string[];
  dealMotions: Record<DealMotion, string>;
}

export interface HealthSnapshot {
  concurrentUsers: number;
  avgResponseMs: number;
  p95ResponseMs: number;
  errorRatePercent: number;
  requestsPerMinute: number;
  uptimePercent: number;
  deltas: {
    concurrentUsers: number;
    avgResponseMs: number;
    errorRatePercent: number;
    requestsPerMinute: number;
  };
  series: { t: string; requests: number; errors: number; latencyMs: number }[];
  services: {
    name: string;
    status: "operational" | "degraded" | "down";
    latencyMs: number;
    errorRatePercent: number;
  }[];
  incidents: { id: string; at: string; level: "info" | "warn" | "error"; message: string }[];
}
