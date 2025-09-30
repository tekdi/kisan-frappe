# Project Overview: Kisan Warehouse - Warehouse Rent Module

Warehouse Rent is a custom module within the Kisan Warehouse Frappe application designed to manage agricultural storage rental operations. The system handles godown facilities with hierarchical floor/chamber structures, duration-based billing, and comprehensive storage tracking from receipt to release.

---

## Tech Stack

- Frappe Framework v15
- Python 3.10+
- MariaDB
- Ubuntu 20.04.1 (Local Development)

---

## App Info

- **App Name:** `kisan_warehouse`
- **Module Name:** `warehouse_rent`
- **Folder Path:** `apps/kisan_warehouse/kisan_warehouse/warehouse_rent/`
- **Type:** Custom module in Frappe app

---

## Naming Conventions

- Storage Customer: `SCUST-YYYY-NNNN`
- Commodity: `COMM-YYYY-NNNN`
- Godown: `GD-YYYY-NNNN`
- Inward Aawak: `AAWAK-YYYY-NNNN`
- Outward Jawak: `JAWAK-YYYY-NNNN`

---

## DocTypes & Modules

### Master Data (Module: warehouse_rent)

#### Storage Customer
- Rental customers (farmers/traders) who store goods in godowns
- Individual or Company types
- Contact and address information
- Links to Aawak and Jawak transactions

#### Commodity
- Agricultural products stored in facilities
- Multiple bag weight configurations (5, 10, 15, 20, 25, 30, 50 Kg)
- Rate per bag per day for each bag weight
- HSN codes and category classification

#### Godown
- Warehouse facilities with hierarchical structure
- Contains multiple Warehouse Floors (child table)
- Each floor contains Floor Chambers (nested child table)
- Three-level hierarchy: Godown → Floors → Chambers
- Capacity tracking at all levels

#### Warehouse Floor (Child of Godown)
- Individual floors within godowns
- Floor types: Ground, Upper, Basement
- Contains Floor Chambers (nested child table)
- Aggregates capacity from chambers

#### Floor Chamber (Nested Child of Warehouse Floor)
- Individual storage units within floors
- Maximum capacity (bags)
- Real-time occupancy tracking
- Status: Available, Occupied, Reserved, Maintenance

### Transactions (Module: warehouse_rent)

#### Inward Aawak
- Incoming storage transaction (goods receipt)
- Links to Storage Customer and Commodity
- Multi-chamber allocation support (child table: Chamber Allocation)
- Weight calculations (total_bags × bag_weight)
- Initiates storage duration tracking

#### Outward Jawak
- Goods release transaction with rent billing
- Auto-populates from Aawak reference
- Duration-based rent calculation
- Multi-bag type support (child table: Bag Details)
- Financial settlement with charges and discounts
- Payment processing

---

## File & Folder Structure

```
kisan_warehouse/
└── kisan_warehouse/
    └── warehouse_rent/
        ├── doctype/
        │   ├── storage_customer/
        │   ├── commodity/
        │   ├── commodity_bag_configuration/
        │   ├── godown/
        │   ├── warehouse_floor/
        │   ├── floor_chamber/
        │   ├── inward_aawak/
        │   ├── chamber_allocation/
        │   ├── outward_jawak/
        │   └── bag_details/
        ├── reports/
        └── public/
```

## AI Prompt Usage

**For project context:** Use this document.

**For detailed business logic:** Refer to specific rule documents:
- `ai_prompts/rules/warehouse_rent/storage_customer_rules.md`
- `ai_prompts/rules/warehouse_rent/commodity_rules.md`
- `ai_prompts/rules/warehouse_rent/godown_rules.md`
- `ai_prompts/rules/warehouse_rent/warehouse_floor_rules.md`
- `ai_prompts/rules/warehouse_rent/floor_chamber_rules.md`
- `ai_prompts/rules/warehouse_rent/inward_aawak_rules.md`
- `ai_prompts/rules/warehouse_rent/outward_jawak_rules.md`
