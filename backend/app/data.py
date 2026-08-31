"""
Seed catalog + pricing rules.

Mirrors src/lib/serverprice/data.ts in the frontend so the two stay in sync
until the catalog moves to a real database.
"""

from app.models import ServerProduct

SEGMENT_RULES: dict[str, dict] = {
    "startup": {"base": 4, "sampleSize": 412, "note": "Self-serve motion, thin approval chain"},
    "mid-market": {"base": 9, "sampleSize": 286, "note": "Standard rate card with regional uplift"},
    "enterprise": {"base": 15, "sampleSize": 174, "note": "Negotiated MSA, procurement-led cycle"},
    "strategic": {"base": 22, "sampleSize": 38, "note": "Top-20 logo, exec-sponsored pricing"},
    "public-sector": {"base": 12, "sampleSize": 61, "note": "GSA schedule ceiling applies"},
}

REGION_SHORT: dict[str, str] = {
    "us-east": "US-East",
    "us-west": "US-West",
    "eu-central": "EU-Central",
    "apac": "APAC",
    "latam": "LATAM",
}

REGION_ADJUST: dict[str, dict] = {
    "us-east": {"delta": 0, "reason": "Primary region — rate card baseline"},
    "us-west": {"delta": -1, "reason": "Capacity constrained region, less headroom"},
    "eu-central": {"delta": 1.5, "reason": "Competitive pressure from local providers"},
    "apac": {"delta": 2, "reason": "Market-entry pricing program active"},
    "latam": {"delta": 3, "reason": "FX exposure offset + growth incentive"},
}

PRODUCTS: list[ServerProduct] = [
    ServerProduct(
        id="srv-c7i-metal", name="Atlas C7i Compute Node", sku="ATL-C7I-48",
        category="compute", region="us-east", basePrice=1840, listPriceDelta=2.4,
        vcpu=48, memoryGb=192, storageTb=2, networkGbps=25,
        availability="in-stock", leadTimeDays=3, marginFloorPercent=22,
        discountTiers=[
            {"label": "12mo commit", "percent": 8, "minUnits": 5},
            {"label": "24mo commit", "percent": 14, "minUnits": 10},
            {"label": "36mo commit", "percent": 19, "minUnits": 25},
        ],
        updatedAt="2026-08-27T09:12:00Z",
    ),
    ServerProduct(
        id="srv-h100-8x", name="Nimbus H100 8-Way Accelerator", sku="NMB-H100-8X",
        category="gpu", region="us-west", basePrice=28400, listPriceDelta=9.1,
        vcpu=128, memoryGb=2048, storageTb=30, networkGbps=400,
        availability="constrained", leadTimeDays=45, marginFloorPercent=34,
        discountTiers=[{"label": "24mo commit", "percent": 5, "minUnits": 4}],
        updatedAt="2026-08-29T16:40:00Z",
    ),
    ServerProduct(
        id="srv-l40s-4x", name="Nimbus L40S Inference Node", sku="NMB-L40S-4X",
        category="gpu", region="eu-central", basePrice=9750, listPriceDelta=-3.2,
        vcpu=64, memoryGb=512, storageTb=8, networkGbps=100,
        availability="in-stock", leadTimeDays=12, marginFloorPercent=28,
        discountTiers=[
            {"label": "12mo commit", "percent": 7, "minUnits": 2},
            {"label": "36mo commit", "percent": 16, "minUnits": 8},
        ],
        updatedAt="2026-08-28T11:05:00Z",
    ),
    ServerProduct(
        id="srv-stor-d3", name="Vault D3 Storage Chassis", sku="VLT-D3-360",
        category="storage", region="us-east", basePrice=3260, listPriceDelta=-1.1,
        vcpu=16, memoryGb=128, storageTb=360, networkGbps=25,
        availability="in-stock", leadTimeDays=7, marginFloorPercent=18,
        discountTiers=[
            {"label": "12mo commit", "percent": 10, "minUnits": 3},
            {"label": "24mo commit", "percent": 17, "minUnits": 8},
            {"label": "36mo commit", "percent": 24, "minUnits": 20},
        ],
        updatedAt="2026-08-25T14:22:00Z",
    ),
    ServerProduct(
        id="srv-stor-nvme", name="Vault NVMe Flash Array", sku="VLT-NVME-96",
        category="storage", region="apac", basePrice=6120, listPriceDelta=4.7,
        vcpu=24, memoryGb=256, storageTb=96, networkGbps=100,
        availability="constrained", leadTimeDays=21, marginFloorPercent=26,
        discountTiers=[
            {"label": "12mo commit", "percent": 6, "minUnits": 2},
            {"label": "24mo commit", "percent": 11, "minUnits": 6},
        ],
        updatedAt="2026-08-30T07:48:00Z",
    ),
    ServerProduct(
        id="srv-mem-x9", name="Halo X9 Memory Node", sku="HAL-X9-1536",
        category="memory-optimized", region="eu-central", basePrice=5480, listPriceDelta=0.6,
        vcpu=96, memoryGb=1536, storageTb=4, networkGbps=50,
        availability="in-stock", leadTimeDays=9, marginFloorPercent=24,
        discountTiers=[
            {"label": "12mo commit", "percent": 9, "minUnits": 4},
            {"label": "36mo commit", "percent": 21, "minUnits": 15},
        ],
        updatedAt="2026-08-26T18:30:00Z",
    ),
    ServerProduct(
        id="srv-mem-x9-apac", name="Halo X9 Memory Node", sku="HAL-X9-1536-AP",
        category="memory-optimized", region="apac", basePrice=6240, listPriceDelta=5.9,
        vcpu=96, memoryGb=1536, storageTb=4, networkGbps=50,
        availability="backorder", leadTimeDays=60, marginFloorPercent=27,
        discountTiers=[{"label": "24mo commit", "percent": 8, "minUnits": 6}],
        updatedAt="2026-08-30T05:15:00Z",
    ),
    ServerProduct(
        id="srv-edge-m2", name="Edge M2 Micro Server", sku="EDG-M2-08",
        category="compute", region="latam", basePrice=410, listPriceDelta=-6.4,
        vcpu=8, memoryGb=32, storageTb=1, networkGbps=10,
        availability="in-stock", leadTimeDays=2, marginFloorPercent=14,
        discountTiers=[
            {"label": "12mo commit", "percent": 12, "minUnits": 20},
            {"label": "24mo commit", "percent": 20, "minUnits": 60},
            {"label": "36mo commit", "percent": 28, "minUnits": 150},
        ],
        updatedAt="2026-08-24T10:02:00Z",
    ),
    ServerProduct(
        id="srv-net-fab400", name="Meridian Fabric 400G Switch", sku="MRD-FB-400",
        category="networking", region="us-west", basePrice=2180, listPriceDelta=1.8,
        vcpu=0, memoryGb=16, storageTb=0, networkGbps=400,
        availability="in-stock", leadTimeDays=14, marginFloorPercent=31,
        discountTiers=[
            {"label": "12mo commit", "percent": 5, "minUnits": 4},
            {"label": "24mo commit", "percent": 9, "minUnits": 12},
        ],
        updatedAt="2026-08-29T13:55:00Z",
    ),
    ServerProduct(
        id="srv-net-lb", name="Meridian Load Balancer Appliance", sku="MRD-LB-100",
        category="networking", region="us-east", basePrice=980, listPriceDelta=-0.4,
        vcpu=8, memoryGb=32, storageTb=0, networkGbps=100,
        availability="in-stock", leadTimeDays=5, marginFloorPercent=29,
        discountTiers=[
            {"label": "12mo commit", "percent": 7, "minUnits": 6},
            {"label": "36mo commit", "percent": 15, "minUnits": 25},
        ],
        updatedAt="2026-08-22T08:41:00Z",
    ),
    ServerProduct(
        id="srv-bm-epyc", name="Titan EPYC Bare Metal", sku="TTN-BM-EP192",
        category="bare-metal", region="eu-central", basePrice=4290, listPriceDelta=3.3,
        vcpu=192, memoryGb=768, storageTb=12, networkGbps=100,
        availability="in-stock", leadTimeDays=11, marginFloorPercent=20,
        discountTiers=[
            {"label": "12mo commit", "percent": 11, "minUnits": 3},
            {"label": "24mo commit", "percent": 18, "minUnits": 10},
            {"label": "36mo commit", "percent": 25, "minUnits": 30},
        ],
        updatedAt="2026-08-28T20:10:00Z",
    ),
    ServerProduct(
        id="srv-bm-xeon", name="Titan Xeon Bare Metal", sku="TTN-BM-XE112",
        category="bare-metal", region="us-east", basePrice=3870, listPriceDelta=0.9,
        vcpu=112, memoryGb=512, storageTb=8, networkGbps=50,
        availability="in-stock", leadTimeDays=8, marginFloorPercent=21,
        discountTiers=[
            {"label": "12mo commit", "percent": 10, "minUnits": 3},
            {"label": "24mo commit", "percent": 16, "minUnits": 12},
        ],
        updatedAt="2026-08-27T15:36:00Z",
    ),
    ServerProduct(
        id="srv-c7i-latam", name="Atlas C7i Compute Node", sku="ATL-C7I-48-BR",
        category="compute", region="latam", basePrice=2110, listPriceDelta=7.8,
        vcpu=48, memoryGb=192, storageTb=2, networkGbps=25,
        availability="constrained", leadTimeDays=28, marginFloorPercent=19,
        discountTiers=[{"label": "12mo commit", "percent": 6, "minUnits": 8}],
        updatedAt="2026-08-29T21:04:00Z",
    ),
    ServerProduct(
        id="srv-c7a-apac", name="Atlas C7a Burst Node", sku="ATL-C7A-32-AP",
        category="compute", region="apac", basePrice=1290, listPriceDelta=-2.7,
        vcpu=32, memoryGb=128, storageTb=1, networkGbps=25,
        availability="in-stock", leadTimeDays=6, marginFloorPercent=17,
        discountTiers=[
            {"label": "12mo commit", "percent": 9, "minUnits": 10},
            {"label": "24mo commit", "percent": 15, "minUnits": 30},
            {"label": "36mo commit", "percent": 22, "minUnits": 75},
        ],
        updatedAt="2026-08-30T02:26:00Z",
    ),
    ServerProduct(
        id="srv-a30-eu", name="Nimbus A30 Render Node", sku="NMB-A30-2X",
        category="gpu", region="us-east", basePrice=4640, listPriceDelta=-8.5,
        vcpu=32, memoryGb=256, storageTb=4, networkGbps=50,
        availability="in-stock", leadTimeDays=4, marginFloorPercent=23,
        discountTiers=[
            {"label": "12mo commit", "percent": 13, "minUnits": 4},
            {"label": "24mo commit", "percent": 21, "minUnits": 12},
        ],
        updatedAt="2026-08-23T12:18:00Z",
    ),
]

PRODUCTS_BY_ID: dict[str, ServerProduct] = {p.id: p for p in PRODUCTS}
