import type { Category, CustomerSegment, HealthSnapshot, Region, ServerProduct } from "./types";

export const REGION_LABELS: Record<Region, string> = {
  "us-east": "US East (Ashburn)",
  "us-west": "US West (Hillsboro)",
  "eu-central": "EU Central (Frankfurt)",
  apac: "APAC (Singapore)",
  latam: "LATAM (São Paulo)",
};

export const REGION_SHORT: Record<Region, string> = {
  "us-east": "US-East",
  "us-west": "US-West",
  "eu-central": "EU-Central",
  apac: "APAC",
  latam: "LATAM",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  compute: "General Compute",
  gpu: "GPU / Accelerated",
  storage: "Storage Dense",
  "memory-optimized": "Memory Optimized",
  networking: "Networking",
  "bare-metal": "Bare Metal",
};

export const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  startup: "Startup (<50 seats)",
  "mid-market": "Mid-Market",
  enterprise: "Enterprise",
  strategic: "Strategic Account",
  "public-sector": "Public Sector / EDU",
};

/** Segment baseline discount + how reliable historical win data is. */
export const SEGMENT_RULES: Record<
  CustomerSegment,
  { base: number; sampleSize: number; note: string }
> = {
  startup: { base: 4, sampleSize: 412, note: "Self-serve motion, thin approval chain" },
  "mid-market": { base: 9, sampleSize: 286, note: "Standard rate card with regional uplift" },
  enterprise: { base: 15, sampleSize: 174, note: "Negotiated MSA, procurement-led cycle" },
  strategic: { base: 22, sampleSize: 38, note: "Top-20 logo, exec-sponsored pricing" },
  "public-sector": { base: 12, sampleSize: 61, note: "GSA schedule ceiling applies" },
};

export const PRODUCTS: ServerProduct[] = [
  {
    id: "srv-c7i-metal",
    name: "Atlas C7i Compute Node",
    sku: "ATL-C7I-48",
    category: "compute",
    region: "us-east",
    basePrice: 1840,
    listPriceDelta: 2.4,
    vcpu: 48,
    memoryGb: 192,
    storageTb: 2,
    networkGbps: 25,
    availability: "in-stock",
    leadTimeDays: 3,
    marginFloorPercent: 22,
    discountTiers: [
      { label: "12mo commit", percent: 8, minUnits: 5 },
      { label: "24mo commit", percent: 14, minUnits: 10 },
      { label: "36mo commit", percent: 19, minUnits: 25 },
    ],
    updatedAt: "2026-08-27T09:12:00Z",
  },
  {
    id: "srv-h100-8x",
    name: "Nimbus H100 8-Way Accelerator",
    sku: "NMB-H100-8X",
    category: "gpu",
    region: "us-west",
    basePrice: 28400,
    listPriceDelta: 9.1,
    vcpu: 128,
    memoryGb: 2048,
    storageTb: 30,
    networkGbps: 400,
    availability: "constrained",
    leadTimeDays: 45,
    marginFloorPercent: 34,
    discountTiers: [{ label: "24mo commit", percent: 5, minUnits: 4 }],
    updatedAt: "2026-08-29T16:40:00Z",
  },
  {
    id: "srv-l40s-4x",
    name: "Nimbus L40S Inference Node",
    sku: "NMB-L40S-4X",
    category: "gpu",
    region: "eu-central",
    basePrice: 9750,
    listPriceDelta: -3.2,
    vcpu: 64,
    memoryGb: 512,
    storageTb: 8,
    networkGbps: 100,
    availability: "in-stock",
    leadTimeDays: 12,
    marginFloorPercent: 28,
    discountTiers: [
      { label: "12mo commit", percent: 7, minUnits: 2 },
      { label: "36mo commit", percent: 16, minUnits: 8 },
    ],
    updatedAt: "2026-08-28T11:05:00Z",
  },
  {
    id: "srv-stor-d3",
    name: "Vault D3 Storage Chassis",
    sku: "VLT-D3-360",
    category: "storage",
    region: "us-east",
    basePrice: 3260,
    listPriceDelta: -1.1,
    vcpu: 16,
    memoryGb: 128,
    storageTb: 360,
    networkGbps: 25,
    availability: "in-stock",
    leadTimeDays: 7,
    marginFloorPercent: 18,
    discountTiers: [
      { label: "12mo commit", percent: 10, minUnits: 3 },
      { label: "24mo commit", percent: 17, minUnits: 8 },
      { label: "36mo commit", percent: 24, minUnits: 20 },
    ],
    updatedAt: "2026-08-25T14:22:00Z",
  },
  {
    id: "srv-stor-nvme",
    name: "Vault NVMe Flash Array",
    sku: "VLT-NVME-96",
    category: "storage",
    region: "apac",
    basePrice: 6120,
    listPriceDelta: 4.7,
    vcpu: 24,
    memoryGb: 256,
    storageTb: 96,
    networkGbps: 100,
    availability: "constrained",
    leadTimeDays: 21,
    marginFloorPercent: 26,
    discountTiers: [
      { label: "12mo commit", percent: 6, minUnits: 2 },
      { label: "24mo commit", percent: 11, minUnits: 6 },
    ],
    updatedAt: "2026-08-30T07:48:00Z",
  },
  {
    id: "srv-mem-x9",
    name: "Halo X9 Memory Node",
    sku: "HAL-X9-1536",
    category: "memory-optimized",
    region: "eu-central",
    basePrice: 5480,
    listPriceDelta: 0.6,
    vcpu: 96,
    memoryGb: 1536,
    storageTb: 4,
    networkGbps: 50,
    availability: "in-stock",
    leadTimeDays: 9,
    marginFloorPercent: 24,
    discountTiers: [
      { label: "12mo commit", percent: 9, minUnits: 4 },
      { label: "36mo commit", percent: 21, minUnits: 15 },
    ],
    updatedAt: "2026-08-26T18:30:00Z",
  },
  {
    id: "srv-mem-x9-apac",
    name: "Halo X9 Memory Node",
    sku: "HAL-X9-1536-AP",
    category: "memory-optimized",
    region: "apac",
    basePrice: 6240,
    listPriceDelta: 5.9,
    vcpu: 96,
    memoryGb: 1536,
    storageTb: 4,
    networkGbps: 50,
    availability: "backorder",
    leadTimeDays: 60,
    marginFloorPercent: 27,
    discountTiers: [{ label: "24mo commit", percent: 8, minUnits: 6 }],
    updatedAt: "2026-08-30T05:15:00Z",
  },
  {
    id: "srv-edge-m2",
    name: "Edge M2 Micro Server",
    sku: "EDG-M2-08",
    category: "compute",
    region: "latam",
    basePrice: 410,
    listPriceDelta: -6.4,
    vcpu: 8,
    memoryGb: 32,
    storageTb: 1,
    networkGbps: 10,
    availability: "in-stock",
    leadTimeDays: 2,
    marginFloorPercent: 14,
    discountTiers: [
      { label: "12mo commit", percent: 12, minUnits: 20 },
      { label: "24mo commit", percent: 20, minUnits: 60 },
      { label: "36mo commit", percent: 28, minUnits: 150 },
    ],
    updatedAt: "2026-08-24T10:02:00Z",
  },
  {
    id: "srv-net-fab400",
    name: "Meridian Fabric 400G Switch",
    sku: "MRD-FB-400",
    category: "networking",
    region: "us-west",
    basePrice: 2180,
    listPriceDelta: 1.8,
    vcpu: 0,
    memoryGb: 16,
    storageTb: 0,
    networkGbps: 400,
    availability: "in-stock",
    leadTimeDays: 14,
    marginFloorPercent: 31,
    discountTiers: [
      { label: "12mo commit", percent: 5, minUnits: 4 },
      { label: "24mo commit", percent: 9, minUnits: 12 },
    ],
    updatedAt: "2026-08-29T13:55:00Z",
  },
  {
    id: "srv-net-lb",
    name: "Meridian Load Balancer Appliance",
    sku: "MRD-LB-100",
    category: "networking",
    region: "us-east",
    basePrice: 980,
    listPriceDelta: -0.4,
    vcpu: 8,
    memoryGb: 32,
    storageTb: 0,
    networkGbps: 100,
    availability: "in-stock",
    leadTimeDays: 5,
    marginFloorPercent: 29,
    discountTiers: [
      { label: "12mo commit", percent: 7, minUnits: 6 },
      { label: "36mo commit", percent: 15, minUnits: 25 },
    ],
    updatedAt: "2026-08-22T08:41:00Z",
  },
  {
    id: "srv-bm-epyc",
    name: "Titan EPYC Bare Metal",
    sku: "TTN-BM-EP192",
    category: "bare-metal",
    region: "eu-central",
    basePrice: 4290,
    listPriceDelta: 3.3,
    vcpu: 192,
    memoryGb: 768,
    storageTb: 12,
    networkGbps: 100,
    availability: "in-stock",
    leadTimeDays: 11,
    marginFloorPercent: 20,
    discountTiers: [
      { label: "12mo commit", percent: 11, minUnits: 3 },
      { label: "24mo commit", percent: 18, minUnits: 10 },
      { label: "36mo commit", percent: 25, minUnits: 30 },
    ],
    updatedAt: "2026-08-28T20:10:00Z",
  },
  {
    id: "srv-bm-xeon",
    name: "Titan Xeon Bare Metal",
    sku: "TTN-BM-XE112",
    category: "bare-metal",
    region: "us-east",
    basePrice: 3870,
    listPriceDelta: 0.9,
    vcpu: 112,
    memoryGb: 512,
    storageTb: 8,
    networkGbps: 50,
    availability: "in-stock",
    leadTimeDays: 8,
    marginFloorPercent: 21,
    discountTiers: [
      { label: "12mo commit", percent: 10, minUnits: 3 },
      { label: "24mo commit", percent: 16, minUnits: 12 },
    ],
    updatedAt: "2026-08-27T15:36:00Z",
  },
  {
    id: "srv-c7i-latam",
    name: "Atlas C7i Compute Node",
    sku: "ATL-C7I-48-BR",
    category: "compute",
    region: "latam",
    basePrice: 2110,
    listPriceDelta: 7.8,
    vcpu: 48,
    memoryGb: 192,
    storageTb: 2,
    networkGbps: 25,
    availability: "constrained",
    leadTimeDays: 28,
    marginFloorPercent: 19,
    discountTiers: [{ label: "12mo commit", percent: 6, minUnits: 8 }],
    updatedAt: "2026-08-29T21:04:00Z",
  },
  {
    id: "srv-c7a-apac",
    name: "Atlas C7a Burst Node",
    sku: "ATL-C7A-32-AP",
    category: "compute",
    region: "apac",
    basePrice: 1290,
    listPriceDelta: -2.7,
    vcpu: 32,
    memoryGb: 128,
    storageTb: 1,
    networkGbps: 25,
    availability: "in-stock",
    leadTimeDays: 6,
    marginFloorPercent: 17,
    discountTiers: [
      { label: "12mo commit", percent: 9, minUnits: 10 },
      { label: "24mo commit", percent: 15, minUnits: 30 },
      { label: "36mo commit", percent: 22, minUnits: 75 },
    ],
    updatedAt: "2026-08-30T02:26:00Z",
  },
  {
    id: "srv-a30-eu",
    name: "Nimbus A30 Render Node",
    sku: "NMB-A30-2X",
    category: "gpu",
    region: "us-east",
    basePrice: 4640,
    listPriceDelta: -8.5,
    vcpu: 32,
    memoryGb: 256,
    storageTb: 4,
    networkGbps: 50,
    availability: "in-stock",
    leadTimeDays: 4,
    marginFloorPercent: 23,
    discountTiers: [
      { label: "12mo commit", percent: 13, minUnits: 4 },
      { label: "24mo commit", percent: 21, minUnits: 12 },
    ],
    updatedAt: "2026-08-23T12:18:00Z",
  },
];

/* ------------------------------------------------------------------ */
/* Health telemetry (deterministic-ish generator for placeholder data) */
/* ------------------------------------------------------------------ */

export function buildHealthSnapshot(seed = Date.now()): HealthSnapshot {
  const rand = mulberry32(Math.floor(seed / 15000));
  const series = Array.from({ length: 60 }, (_, i) => {
    const minutesAgo = 59 - i;
    const at = new Date(seed - minutesAgo * 60_000);
    const wave = Math.sin((i / 60) * Math.PI * 2) * 260;
    const requests = Math.round(1480 + wave + rand() * 220 + (i > 46 ? 180 : 0));
    return {
      t: at.toISOString(),
      requests,
      errors: Math.max(0, Math.round(requests * (0.004 + rand() * 0.006))),
      latencyMs: Math.round(118 + Math.sin(i / 7) * 22 + rand() * 26),
    };
  });

  const last = series[series.length - 1]!;
  const errorRate = +((last.errors / last.requests) * 100).toFixed(2);

  return {
    concurrentUsers: 214 + Math.round(rand() * 60),
    avgResponseMs: Math.round(series.slice(-10).reduce((a, s) => a + s.latencyMs, 0) / 10),
    p95ResponseMs: 342,
    errorRatePercent: errorRate,
    requestsPerMinute: last.requests,
    uptimePercent: 99.982,
    deltas: {
      concurrentUsers: 6.2,
      avgResponseMs: -4.1,
      errorRatePercent: 0.08,
      requestsPerMinute: 3.4,
    },
    series,
    services: [
      { name: "pricing-api", status: "operational", latencyMs: 96, errorRatePercent: 0.21 },
      { name: "discount-engine", status: "operational", latencyMs: 142, errorRatePercent: 0.44 },
      { name: "quote-export", status: "degraded", latencyMs: 604, errorRatePercent: 2.86 },
      { name: "catalog-sync", status: "operational", latencyMs: 71, errorRatePercent: 0.05 },
      { name: "auth-gateway", status: "operational", latencyMs: 38, errorRatePercent: 0.02 },
    ],
    incidents: [
      {
        id: "evt-4821",
        at: new Date(seed - 8 * 60_000).toISOString(),
        level: "warn",
        message: "quote-export p95 above 500ms threshold for 6 consecutive minutes",
      },
      {
        id: "evt-4817",
        at: new Date(seed - 34 * 60_000).toISOString(),
        level: "info",
        message: "catalog-sync completed full reindex (15 SKUs, 1.9s)",
      },
      {
        id: "evt-4809",
        at: new Date(seed - 71 * 60_000).toISOString(),
        level: "error",
        message: "discount-engine returned 502 for 14 requests — upstream margin service timeout",
      },
    ],
  };
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
