"""
Manufacturing BOM seed data — the physical components behind each SKU.

Distinct from a Deal's Bill of Materials (SKUs + customer pricing): this is
what it costs the company to build one unit of a product. One component per
product is supplied by "Solace Manufacturing" — the same external partner
that signs off on deals — so the External Partner role has something real
of theirs to see.
"""

from app.models import BomComponent

COMPONENTS_BY_PRODUCT: dict[str, list[BomComponent]] = {
    "srv-c7i-metal": [
        BomComponent(id="c-1", name="48-core Xeon-class CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=612, quantity=1, leadTimeDays=21),
        BomComponent(id="c-2", name="192GB DDR5 memory kit", category="Memory", supplier="Novacore Memory", unitCost=340, quantity=1, leadTimeDays=14),
        BomComponent(id="c-3", name="2U chassis + PSU assembly", category="Chassis", supplier="Solace Manufacturing", unitCost=280, quantity=1, leadTimeDays=9),
        BomComponent(id="c-4", name="25G NIC + cabling", category="Networking", supplier="Corvus Interconnect", unitCost=95, quantity=1, leadTimeDays=6),
    ],
    "srv-h100-8x": [
        BomComponent(id="c-1", name="H100 80GB GPU module", category="Accelerator", supplier="Ironclad Semiconductor", unitCost=1650, quantity=8, leadTimeDays=45),
        BomComponent(id="c-2", name="Dual EPYC host CPUs", category="Compute", supplier="Ironclad Semiconductor", unitCost=1450, quantity=2, leadTimeDays=21),
        BomComponent(id="c-3", name="2048GB DDR5 memory kit", category="Memory", supplier="Novacore Memory", unitCost=900, quantity=1, leadTimeDays=18),
        BomComponent(id="c-4", name="8U liquid-cooled chassis", category="Chassis", supplier="Solace Manufacturing", unitCost=900, quantity=1, leadTimeDays=30),
        BomComponent(id="c-5", name="400G NVLink fabric", category="Networking", supplier="Corvus Interconnect", unitCost=300, quantity=1, leadTimeDays=25),
    ],
    "srv-l40s-4x": [
        BomComponent(id="c-1", name="L40S 48GB GPU module", category="Accelerator", supplier="Ironclad Semiconductor", unitCost=1150, quantity=4, leadTimeDays=28),
        BomComponent(id="c-2", name="64-core host CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=700, quantity=1, leadTimeDays=21),
        BomComponent(id="c-3", name="512GB DDR5 memory kit", category="Memory", supplier="Novacore Memory", unitCost=500, quantity=1, leadTimeDays=14),
        BomComponent(id="c-4", name="4U chassis + PSU assembly", category="Chassis", supplier="Solace Manufacturing", unitCost=450, quantity=1, leadTimeDays=12),
        BomComponent(id="c-5", name="100G NIC + cabling", category="Networking", supplier="Corvus Interconnect", unitCost=180, quantity=1, leadTimeDays=8),
    ],
    "srv-stor-d3": [
        BomComponent(id="c-1", name="18TB enterprise HDD", category="Storage", supplier="Fathom Storage Systems", unitCost=85, quantity=20, leadTimeDays=16),
        BomComponent(id="c-2", name="RAID controller", category="Storage", supplier="Fathom Storage Systems", unitCost=220, quantity=1, leadTimeDays=10),
        BomComponent(id="c-3", name="16-core CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=180, quantity=1, leadTimeDays=14),
        BomComponent(id="c-4", name="4U dense chassis + PSU", category="Chassis", supplier="Solace Manufacturing", unitCost=260, quantity=1, leadTimeDays=11),
    ],
    "srv-stor-nvme": [
        BomComponent(id="c-1", name="3.84TB NVMe SSD", category="Storage", supplier="Fathom Storage Systems", unitCost=140, quantity=25, leadTimeDays=13),
        BomComponent(id="c-2", name="NVMe switch fabric board", category="Storage", supplier="Fathom Storage Systems", unitCost=400, quantity=1, leadTimeDays=17),
        BomComponent(id="c-3", name="24-core CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=250, quantity=1, leadTimeDays=14),
        BomComponent(id="c-4", name="2U chassis + PSU assembly", category="Chassis", supplier="Solace Manufacturing", unitCost=230, quantity=1, leadTimeDays=9),
    ],
    "srv-mem-x9": [
        BomComponent(id="c-1", name="96-core CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=1620, quantity=1, leadTimeDays=22),
        BomComponent(id="c-2", name="1536GB DDR5 memory kit", category="Memory", supplier="Novacore Memory", unitCost=2180, quantity=1, leadTimeDays=20),
        BomComponent(id="c-3", name="4U chassis + PSU assembly", category="Chassis", supplier="Solace Manufacturing", unitCost=470, quantity=1, leadTimeDays=11),
        BomComponent(id="c-4", name="50G NIC + cabling", category="Networking", supplier="Corvus Interconnect", unitCost=140, quantity=1, leadTimeDays=7),
    ],
    "srv-mem-x9-apac": [
        BomComponent(id="c-1", name="96-core CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=1620, quantity=1, leadTimeDays=26),
        BomComponent(id="c-2", name="1536GB DDR5 memory kit", category="Memory", supplier="Novacore Memory", unitCost=2180, quantity=1, leadTimeDays=24),
        BomComponent(id="c-3", name="4U chassis + PSU assembly", category="Chassis", supplier="Solace Manufacturing", unitCost=470, quantity=1, leadTimeDays=15),
        BomComponent(id="c-4", name="50G NIC + cabling", category="Networking", supplier="Corvus Interconnect", unitCost=140, quantity=1, leadTimeDays=10),
    ],
    "srv-edge-m2": [
        BomComponent(id="c-1", name="8-core low-power CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=95, quantity=1, leadTimeDays=9),
        BomComponent(id="c-2", name="32GB memory module", category="Memory", supplier="Novacore Memory", unitCost=48, quantity=1, leadTimeDays=7),
        BomComponent(id="c-3", name="Micro chassis + PSU", category="Chassis", supplier="Solace Manufacturing", unitCost=62, quantity=1, leadTimeDays=5),
        BomComponent(id="c-4", name="10G NIC", category="Networking", supplier="Corvus Interconnect", unitCost=22, quantity=1, leadTimeDays=4),
    ],
    "srv-net-fab400": [
        BomComponent(id="c-1", name="400G switch ASIC", category="Networking", supplier="Corvus Interconnect", unitCost=920, quantity=1, leadTimeDays=19),
        BomComponent(id="c-2", name="Switch control-plane CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=180, quantity=1, leadTimeDays=12),
        BomComponent(id="c-3", name="1U switch chassis + PSU", category="Chassis", supplier="Solace Manufacturing", unitCost=210, quantity=1, leadTimeDays=8),
    ],
    "srv-net-lb": [
        BomComponent(id="c-1", name="100G load balancer ASIC", category="Networking", supplier="Corvus Interconnect", unitCost=390, quantity=1, leadTimeDays=15),
        BomComponent(id="c-2", name="8-core CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=210, quantity=1, leadTimeDays=11),
        BomComponent(id="c-3", name="1U chassis + PSU assembly", category="Chassis", supplier="Solace Manufacturing", unitCost=150, quantity=1, leadTimeDays=6),
    ],
    "srv-bm-epyc": [
        BomComponent(id="c-1", name="192-core EPYC CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=1550, quantity=1, leadTimeDays=24),
        BomComponent(id="c-2", name="768GB DDR5 memory kit", category="Memory", supplier="Novacore Memory", unitCost=750, quantity=1, leadTimeDays=18),
        BomComponent(id="c-3", name="12TB NVMe storage array", category="Storage", supplier="Fathom Storage Systems", unitCost=600, quantity=1, leadTimeDays=15),
        BomComponent(id="c-4", name="2U chassis + PSU assembly", category="Chassis", supplier="Solace Manufacturing", unitCost=300, quantity=1, leadTimeDays=10),
    ],
    "srv-bm-xeon": [
        BomComponent(id="c-1", name="112-core Xeon-class CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=1640, quantity=1, leadTimeDays=20),
        BomComponent(id="c-2", name="512GB DDR5 memory kit", category="Memory", supplier="Novacore Memory", unitCost=720, quantity=1, leadTimeDays=16),
        BomComponent(id="c-3", name="8TB NVMe storage array", category="Storage", supplier="Fathom Storage Systems", unitCost=610, quantity=1, leadTimeDays=13),
        BomComponent(id="c-4", name="2U chassis + PSU assembly", category="Chassis", supplier="Solace Manufacturing", unitCost=380, quantity=1, leadTimeDays=9),
    ],
    "srv-c7i-latam": [
        BomComponent(id="c-1", name="48-core Xeon-class CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=612, quantity=1, leadTimeDays=32),
        BomComponent(id="c-2", name="192GB DDR5 memory kit", category="Memory", supplier="Novacore Memory", unitCost=340, quantity=1, leadTimeDays=27),
        BomComponent(id="c-3", name="2U chassis + PSU assembly", category="Chassis", supplier="Solace Manufacturing", unitCost=280, quantity=1, leadTimeDays=22),
        BomComponent(id="c-4", name="25G NIC + cabling", category="Networking", supplier="Corvus Interconnect", unitCost=95, quantity=1, leadTimeDays=18),
    ],
    "srv-c7a-apac": [
        BomComponent(id="c-1", name="32-core burst CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=430, quantity=1, leadTimeDays=15),
        BomComponent(id="c-2", name="128GB DDR5 memory kit", category="Memory", supplier="Novacore Memory", unitCost=220, quantity=1, leadTimeDays=12),
        BomComponent(id="c-3", name="1U chassis + PSU assembly", category="Chassis", supplier="Solace Manufacturing", unitCost=190, quantity=1, leadTimeDays=9),
        BomComponent(id="c-4", name="25G NIC + cabling", category="Networking", supplier="Corvus Interconnect", unitCost=80, quantity=1, leadTimeDays=7),
    ],
    "srv-a30-eu": [
        BomComponent(id="c-1", name="A30 24GB GPU module", category="Accelerator", supplier="Ironclad Semiconductor", unitCost=1250, quantity=2, leadTimeDays=19),
        BomComponent(id="c-2", name="32-core host CPU", category="Compute", supplier="Ironclad Semiconductor", unitCost=420, quantity=1, leadTimeDays=15),
        BomComponent(id="c-3", name="256GB DDR5 memory kit", category="Memory", supplier="Novacore Memory", unitCost=280, quantity=1, leadTimeDays=13),
        BomComponent(id="c-4", name="2U chassis + PSU assembly", category="Chassis", supplier="Solace Manufacturing", unitCost=300, quantity=1, leadTimeDays=9),
    ],
}
