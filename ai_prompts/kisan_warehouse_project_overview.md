# Project Overview: Kisan Warehouse

Kisan Warehouse is a custom Frappe application designed to manage the inward logistics and storage of agricultural produce. The system handles customers/farmers, brokers, vehicles, products, warehouses, bookings (sauda), and inward purchases.

---

## Tech Stack

- Frappe Framework v15
- Python 3.10+
- MariaDB
- Ubuntu 20.04.1 (Local Development)

---

## App Info

- App Name: `kisan_warehouse`
- Folder Path: `apps/kisan_warehouse/kisan_warehouse/`
- Type: Custom app installed in Frappe bench

**Naming Conventions:**
- Customer: `CUST-YYYY-NNNN`
- Broker: `BR-YYYY-NNNN` 
- Product: `PROD-YYYY-NNNN`
- Warehouse: `WH-CITY-NNNN`
- Sauda: `SAUDA-YYYY-NNNN`
- Inward: `INW-YYYY-NNNN`

---

## DocTypes & Modules

### Company Management
- `Company` — Registered organizations for billing and reports

### Customer Management  
- `Customer` — Farmers/Customers with Aadhar & GST API integration and validation (Individual/Company types)
- `Broker` — Intermediary agents with Aadhar & GST API integration and validation (Individual/Company types)

### Product Management
- `Product` — Agricultural items with HSN codes and GST rates

### Warehouse Management
- `Warehouse` — Physical storage locations

### Vehicle Management
- `Vehicle` — Vehicle details with driver information and capacity

### Sauda / Booking
- `Sauda` — Deal/Agreement with expected quantity (in tons) and rate defined during booking

### Inward Process (Purchase)
- `Inward` — Purchase against Sauda/Booking with actual weight measurements
- `Inward Deduction` — Deduction entries applied during inward purchase

### System Settings
- `App Settings` — Global configurations (Single DocType)
- `Settings Deduction Type` — Master list of deduction types

---

## File & Folder Structure

```
kisan_warehouse/
└── kisan_warehouse/
    ├── company/doctype/company/
    ├── customers/doctype/customer/
    ├── products/doctype/product/
    ├── brokers/doctype/broker/
    ├── warehouses/doctype/warehouse/
    ├── vehicles/doctype/vehicle/
    ├── saudas/doctype/sauda/
    ├── inwards/doctype/inward/
    ├── inwards/doctype/inward_deduction/
    ├── settings/doctype/app_settings/
    ├── settings/doctype/settings_deduction_type/
    ├── reports/
    ├── templates/
    ├── public/
    └── hooks.py
```

---

## AI Prompt Usage

Use this document for project context when generating code. For DocType-specific business logic and calculations, refer to: `ai_prompts/rules/<doctype>_rules.md`

