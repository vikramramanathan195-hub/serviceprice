"""
Seed data for the margin-based deal validation tool.

Distinct from the hardware catalog in data.py — these are service/support
portfolio lines (not physical SKUs), each with its own Gross Margin % and
Cost of Sales % used to derive the discount-validation band.
"""

from app.models import MarginCustomer, MarginPortfolio

PORTFOLIOS: list[MarginPortfolio] = [
    MarginPortfolio(id="sentinel-uptime", name="Sentinel Uptime Plan", grossMarginPercent=62, costOfSalesPercent=9),
    MarginPortfolio(id="continuum-service", name="Continuum Service Program", grossMarginPercent=55, costOfSalesPercent=14),
    MarginPortfolio(id="horizon-renewal", name="Horizon Renewal Program", grossMarginPercent=48, costOfSalesPercent=18),
]

PORTFOLIOS_BY_ID: dict[str, MarginPortfolio] = {p.id: p for p in PORTFOLIOS}

FISCAL_PERIODS: list[str] = ["FY26-Q1", "FY26-Q2", "FY26-Q3", "FY26-Q4", "FY27-Q1"]

DEAL_MOTION_LABELS: dict[str, str] = {
    "new-business": "New Business",
    "renewal": "Renewal",
    "expansion": "Expansion",
    "displacement": "Competitive Displacement",
}

MARGIN_CUSTOMERS: list[MarginCustomer] = [
    MarginCustomer(id="cust-kestrel-am-ent", name="Kestrel Dynamics — Americas Enterprise", region="us-east"),
    MarginCustomer(id="cust-kestrel-emea-fs", name="Kestrel Dynamics — EMEA Financial Services", region="eu-central"),
    MarginCustomer(id="cust-kestrel-apac-ps", name="Kestrel Dynamics — APAC Public Sector", region="apac"),
    MarginCustomer(id="cust-kestrel-latam-tc", name="Kestrel Dynamics — LATAM Telco", region="latam"),
    MarginCustomer(id="cust-kestrel-wc-retail", name="Kestrel Dynamics — US West Retail Chain", region="us-west"),
    MarginCustomer(id="cust-kestrel-nordics", name="Kestrel Dynamics — Nordics Cloud Provider", region="eu-central"),
]

MARGIN_CUSTOMERS_BY_ID: dict[str, MarginCustomer] = {c.id: c for c in MARGIN_CUSTOMERS}

# (customerId, portfolioId) -> (historicalDiscountPercent, previousNetOrderUsd)
CUSTOMER_PORTFOLIO_HISTORY: dict[tuple[str, str], tuple[float, float]] = {
    ("cust-kestrel-am-ent", "sentinel-uptime"): (18.0, 412_000.0),
    ("cust-kestrel-am-ent", "continuum-service"): (22.5, 268_500.0),
    ("cust-kestrel-am-ent", "horizon-renewal"): (27.0, 154_000.0),
    ("cust-kestrel-emea-fs", "sentinel-uptime"): (15.5, 301_200.0),
    ("cust-kestrel-emea-fs", "continuum-service"): (24.0, 198_000.0),
    ("cust-kestrel-emea-fs", "horizon-renewal"): (30.5, 121_800.0),
    ("cust-kestrel-apac-ps", "sentinel-uptime"): (12.0, 96_400.0),
    ("cust-kestrel-apac-ps", "continuum-service"): (17.5, 71_200.0),
    ("cust-kestrel-apac-ps", "horizon-renewal"): (20.0, 43_600.0),
    ("cust-kestrel-latam-tc", "sentinel-uptime"): (20.0, 187_000.0),
    ("cust-kestrel-latam-tc", "continuum-service"): (26.5, 143_900.0),
    ("cust-kestrel-latam-tc", "horizon-renewal"): (33.0, 88_300.0),
    ("cust-kestrel-wc-retail", "sentinel-uptime"): (29.0, 512_000.0),
    ("cust-kestrel-wc-retail", "continuum-service"): (34.5, 388_000.0),
    ("cust-kestrel-wc-retail", "horizon-renewal"): (41.0, 210_500.0),
    ("cust-kestrel-nordics", "sentinel-uptime"): (10.5, 132_400.0),
    ("cust-kestrel-nordics", "continuum-service"): (14.0, 97_600.0),
    ("cust-kestrel-nordics", "horizon-renewal"): (18.5, 61_900.0),
}
