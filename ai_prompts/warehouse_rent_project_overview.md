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

### Parent DocTypes:
- Storage Customer: `SCUST-YYYY-NNNN`
- Commodity: `COMM-YYYY-NNNN`
- Godown: `GD-YYYY-NNNN`
- Inward Aawak: `AAWAK-YYYY-NNNN`
- Outward Jawak: `JAWAK-YYYY-NNNN`

### Child DocTypes:
- Child tables use auto-generated names (no custom naming series)

---

## DocTypes & Modules

### Master Data (Module: warehouse_rent)

#### Storage Customer (Parent)
- Rental customers (farmers/traders) who store goods in godowns
- Individual or Company types
- Contact and address information
- Links to Aawak and Jawak transactions

#### Commodity (Parent)
- Agricultural products stored in facilities
- Multiple bag weight configurations (5, 10, 15, 20, 25, 30, 50 Kg)
- Rate per bag per day for each bag weight
- HSN codes and category classification

**Child Table: Commodity Bag Configuration**
- Links to parent Commodity
- Bag weight options (Select: 5, 10, 15, 20, 25, 30, 50 Kg)
- Rate per bag per day (Currency)
- No duplicate bag weights allowed per commodity

#### Godown (Parent)
- Warehouse facilities with hierarchical structure
- Contains multiple Warehouse Floors (child table)
- Each floor contains Floor Chambers (nested child table)
- Three-level hierarchy: Godown → Floors → Chambers
- Capacity tracking at all levels

**Child Table: Warehouse Floor**
- Links to parent Godown
- Individual floors within godowns
- Floor types: Ground, Upper, Basement
- Contains Floor Chambers (nested child table)
- Aggregates capacity from chambers
- Status: Active, Maintenance, Inactive

**Nested Child Table: Floor Chamber**
- Links to parent Warehouse Floor
- Individual storage units within floors
- Maximum capacity (bags)
- Real-time occupancy tracking
- Status: Available, Occupied, Reserved, Maintenance

### Transactions (Module: warehouse_rent)

#### Inward Aawak (Parent)
- Incoming storage transaction (goods receipt)
- Links to Storage Customer and Commodity
- Multi-chamber allocation support (child table: Chamber Allocation)
- Weight calculations (total_bags × bag_weight)
- Initiates storage duration tracking
- Is Submittable: Yes

**Child Table: Chamber Allocation**
- Links to parent Inward Aawak
- Floor and Chamber selection (Link fields)
- Bags allocated per chamber (Int)
- Allocation date (Date)
- Sum of bags_allocated must equal parent total_bags

#### Outward Jawak (Parent)
- Goods release transaction with rent billing
- Auto-populates from Aawak reference
- Duration-based rent calculation
- Multi-bag type support (child table: Bag Details)
- Financial settlement with charges and discounts
- Payment processing
- Is Submittable: Yes

**Child Table: Bag Details**
- Links to parent Outward Jawak
- Auto-populated from Aawak reference
- Bag type (Link to Commodity Bag Configuration)
- Total bags (from Aawak, read-only)
- Release bags (editable, cannot exceed total_bags)
- Rate per bag per day (from Commodity, read-only)
- Total days (auto-calculated: jawak_date - aawak_date)
- Total amount (auto-calculated: release_bags × rate × total_days)

---

## DocType Relationships

### Parent-Child Relationships:

**Commodity → Commodity Bag Configuration**
- One-to-Many relationship
- Each commodity can have multiple bag weight configurations
- Child inherits permissions from parent

**Godown → Warehouse Floor → Floor Chamber**
- Three-level nested hierarchy
- Godown contains multiple floors
- Each floor contains multiple chambers
- Nested child tables

**Inward Aawak → Chamber Allocation**
- One-to-Many relationship
- Single Aawak can allocate to multiple chambers
- Sum validation required

**Outward Jawak → Bag Details**
- One-to-Many relationship
- Single Jawak can release multiple bag types
- Auto-populated from linked Aawak

---

## File & Folder Structure

kisan_warehouse/
└── kisan_warehouse/
└── warehouse_rent/
├── doctype/
│   ├── storage_customer/
│   ├── commodity/
│   ├── commodity_bag_configuration/          # Child of Commodity
│   ├── godown/
│   ├── warehouse_floor/                       # Child of Godown
│   ├── floor_chamber/                         # Nested child of Warehouse Floor
│   ├── inward_aawak/
│   ├── chamber_allocation/                    # Child of Inward Aawak
│   ├── outward_jawak/
│   └── bag_details/                           # Child of Outward Jawak
├── reports/
└── public/


**For detailed business logic:** Refer to specific rule documents:
- `ai_prompts/rules/warehouse_rent/storage_customer_rules.md` (Parent only)
- `ai_prompts/rules/warehouse_rent/commodity_rules.md` (Parent + Child)
- `ai_prompts/rules/warehouse_rent/godown_rules.md` (Parent + 2 nested children)
- `ai_prompts/rules/warehouse_rent/warehouse_floor_rules.md` (Child with nested child)
- `ai_prompts/rules/warehouse_rent/floor_chamber_rules.md` (Nested child)
- `ai_prompts/rules/warehouse_rent/inward_aawak_rules.md` (Parent + Child)
- `ai_prompts/rules/warehouse_rent/outward_jawak_rules.md` (Parent + Child)
