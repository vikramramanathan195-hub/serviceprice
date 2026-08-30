export type Region = "us-east" | "us-west" | "eu-central" | "apac" | "latam";

export type Category =
  | "compute"
  | "gpu"
  | "storage"
  | "memory-optimized"
  | "networking"
  | "bare-metal";

export type CustomerSegment =
  | "startup"
  | "mid-market"
  | "enterprise"
  | "strategic"
  | "public-sector";

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
