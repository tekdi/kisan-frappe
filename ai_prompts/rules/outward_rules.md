# Updated Outward DocType Implementation Prompt

## **IMPLEMENTATION PROMPT FOR CURSOR**

```markdown
I need to implement a complete Outward DocType for the Kisan Warehouse Frappe v15 app with client and server scripts.

**CRITICAL REQUIREMENTS:**
2. Server script should be minimal: `class Outward(Document): pass`
3. All calculations must be client-side only
4. No server-side validation that could cause database locks
5. Follow Frappe v15 standards
6. Reference the working Inward and Sauda implementations

**PROJECT CONTEXT:**
- App: kisan_warehouse
- Module: Outwards (Create if not exist)
- Site: kisan-new.localhost (adjust as needed)

**BUSINESS LOGIC:**
[See detailed calculations below]

**IMPLEMENTATION STEPS:**
1. Create Outward and Outward Item Detail DocTypes via UI
2. Configure fields as per specifications below
4. Keep server script minimal to avoid timeouts
5. Test thoroughly after each change
6. Export fixtures after working changes
7. Follow the command checklist religiously

**REFERENCE IMPLEMENTATIONS:**
- Use Inward DocType structure as primary template
- Use Commodity validation patterns for child table handling
- Use Sauda auto-population patterns for field linking
```

---

## **DOCTYPE SPECIFICATIONS**

### **Parent DocType: Outward**

**Basic Configuration:**
- **DocType Name:** Outward
- **Module:** Outwards
- **Naming Series:** OUT-.YYYY.-.####
- **Is Submittable:** Yes
- **Track Changes:** Yes
- **Custom:** Yes

**Fields (in order):**

1. **naming_series** (Select)
   - Hidden: Yes
   - Default: "OUT-.YYYY.-.####"

2. **Section Break:** Outward Information

3. **outward_date** (Date)
   - Label: Outward Date
   - Mandatory: Yes
   - Default: Today
   - In List View: Yes

4. **outward_status** (Select)
   - Label: Status
   - Mandatory: Yes
   - Options: pending, dispatched, delivered, completed
   - Default: pending
   - In List View: Yes

5. **Column Break**

6. **sauda** (Link)
   - Label: Sauda
   - Mandatory: Yes
   - Options: Sauda
   - In List View: Yes

7. **customer** (Link)
   - Label: Customer
   - Mandatory: Yes
   - Options: Customer
   - Read Only: Yes (auto-filled from Sauda)

8. **Section Break:** Product & Warehouse Details

9. **product** (Link)
   - Label: Product
   - Mandatory: Yes
   - Options: Product
   - Read Only: Yes (auto-filled from Sauda)

10. **warehouse** (Link)
    - Label: Warehouse
    - Mandatory: Yes
    - Options: Warehouse
    - Read Only: Yes (auto-filled from Sauda)

11. **Column Break**

12. **broker** (Link)
    - Label: Broker
    - Mandatory: No
    - Options: Broker
    - Read Only: Yes (auto-filled from Sauda)

13. **vehicle** (Link)
    - Label: Vehicle
    - Mandatory: Yes
    - Options: Vehicle

14. **Section Break:** Outward Items

15. **outward_items** (Table)
    - Label: Outward Item Details
    - Mandatory: Yes
    - Options: Outward Item Detail

16. **Section Break:** Financial Summary

17. **net_total** (Currency)
    - Label: Net Total
    - Mandatory: No
    - Read Only: Yes
    - Precision: 2

18. **Column Break**

19. **broker_commission_percent** (Percent)
    - Label: Broker Commission (%)
    - Mandatory: No

20. **broker_commission_amount** (Currency)
    - Label: Broker Commission Amount
    - Mandatory: No
    - Read Only: Yes
    - Precision: 2

21. **Section Break:** Additional Information

22. **notes** (Small Text)
    - Label: Notes
    - Mandatory: No
    - Rows: 3

**Additional Settings:**
- Title Field: name (auto-generated)
- Search Fields: outward_date, customer, sauda
- Sort Field: outward_date
- Sort Order: DESC

**Permissions:**
- System Manager: All rights
- Kisan Admin: Create, Read, Write, Submit, Cancel, Delete
- Kisan Operator: Create, Read, Write, Submit, Cancel
- Operator: Create, Read, Write, Submit

---

### **Child DocType: Outward Item Detail**

**Basic Configuration:**
- **DocType Name:** Outward Item Detail
- **Module:** Outwards
- **Is Child Table:** Yes
- **Parent DocType:** Outward
- **Custom:** Yes

**Fields (in order):**

1. **item_gross_weight** (Float)
   - Label: Gross Weight (Kg)
   - Mandatory: Yes
   - Precision: 2
   - In List View: Yes
   - **Note:** Prefilled from Sauda's expected quantity, but EDITABLE

2. **item_bags** (Int)
   - Label: No. of Bags
   - Mandatory: Yes
   - In List View: Yes

3. **item_rate** (Currency)
   - Label: Rate (per Quintal)
   - Mandatory: Yes
   - Precision: 2
   - In List View: Yes
   - **Note:** Prefilled from Sauda rate, but EDITABLE

4. **item_amount** (Currency)
   - Label: Total Amount
   - Mandatory: No
   - Read Only: Yes
   - Precision: 2
   - In List View: Yes

**File Location:**
apps/kisan_warehouse/kisan_warehouse/outwards/doctype/outward_item_detail/

Create:
1. outward_item_detail.json (DocType definition)
2. outward_item_detail.py (class OutwardItemDetail(Document): pass)
3. __init__.py (empty file)

---

## **BUSINESS LOGIC REQUIREMENTS**

### **Objective**
Manage outward/dispatch transactions of agricultural produce with multi-item support, linking to Sauda bookings and tracking inventory movement. **Weight information is now simplified to only Gross Weight (expected quantity from Sauda).**

### **Fields Involved**

#### **Parent DocType Fields:**
- **Input Fields:** outward_date, outward_status, sauda, vehicle, broker_commission_percent, notes
- **Auto-populated Fields:** customer, warehouse, product, broker (from selected Sauda)
- **Calculated Fields:** net_total, broker_commission_amount
- **Child Tables:** outward_items (Outward Item Detail)

#### **Child Table Fields (Outward Item Detail):**
- **Input Fields:** item_gross_weight (prefilled but editable), item_bags, item_rate (prefilled but editable)
- **Calculated Fields:** item_amount

---

## **CALCULATIONS TO IMPLEMENT**

### **1. Child Table Calculations (Outward Item Detail)**
1. **item_amount = (item_gross_weight / 100) × item_rate** (KG to Quintal conversion)
   - Trigger: When item_gross_weight or item_rate changes
   - Round to 2 decimal places
   - **Formula:** Weight in KG divided by 100 to convert to Quintals, then multiply by rate per Quintal

### **2. Parent Total Calculations**
2. **net_total = SUM(item_amount)** from all outward_items child rows
   - Trigger: When any child row is added, modified, or deleted
   - Round to 2 decimal places

### **3. Broker Commission Calculations**
3. **broker_commission_amount = net_total × broker_commission_percent / 100**
   - Trigger: When net_total or broker_commission_percent changes
   - Round to 2 decimal places
   - Note: For records only, NOT deducted from net_total

4. **Auto-populate Broker Commission Percent**
   - broker_commission_percent should auto-populate from selected Broker DocType
   - Trigger: When broker field is populated (from Sauda selection)
   - Fetch: broker.commission_percent (or broker.default_commission_percent)
   - User can override if needed
   - Default to 0 if broker not selected or commission not set

### **5. Auto-population from Sauda**
When sauda is selected, auto-fill:
- **Parent Fields:**
  - customer (from sauda.customer)
  - warehouse (from sauda.warehouse)
  - product (from sauda.product)
  - broker (from sauda.broker)
  
- **Child Table Pre-population (Outward Item Detail):**
  - item_gross_weight (from sauda.expected_quantity or sauda.pending_quantity)
  - item_rate (from sauda.sauda_rate)
  - item_bags (leave empty or prefill if available from Sauda)
  - **Note:** All prefilled values remain EDITABLE by the user

### **6. Sauda Pending Quantity Update (Server-side only if needed)**
- On Submit: Update sauda.pending_quantity by subtracting total gross weight
- On Cancel: Restore sauda.pending_quantity by adding back gross weight
- Keep this logic minimal in server script if absolutely necessary

---

## **VALIDATION RULES**

### **Must Have Validations:**
1. **Sauda Selection:** Cannot be empty
2. **Outward Items:** At least one item required
3. **Gross Weight:** Must be > 0 for each item
4. **Rate Validation:** item_rate must be > 0
5. **Status Progression:** Validate status workflow (pending → dispatched → delivered → completed)
6. **Vehicle Required:** Must select vehicle for dispatch
7. **Broker Commission:** Must be >= 0 if provided

### **Business Logic Validations:**
1. **Sauda Availability:** Check if sauda has sufficient pending_quantity
2. **Warehouse Match:** Verify warehouse consistency with Sauda
3. **Date Validation:** outward_date should not be before sauda.booking_date
4. **Rate Consistency:** Optionally warn if item_rate differs significantly from sauda.sauda_rate
5. **Weight Check:** Validate total outward weight doesn't exceed sauda pending quantity
6. **Duplicate Prevention:** Consider preventing multiple outwards for same sauda (optional)

### **Rounding Requirements:**
- **ALL financial fields** rounded to 2 decimal places
- **Applied to:** item_amount, net_total, broker_commission_amount
- **Weight Precision:** 2 decimal places for all weight fields
- **Compliance:** Required for GST/TDS/TCS legal compliance

---

## **FIELD TRIGGERS REQUIRED**

### **Child Table Triggers (Outward Item Detail):**
- **item_gross_weight, item_rate** → Calculate item_amount
- **Any child table modification** → Recalculate net_total

### **Parent Field Triggers:**
- **outward_items child table changes** → Calculate net_total
- **net_total, broker_commission_percent** → Calculate broker_commission_amount
- **sauda** → Auto-populate customer, warehouse, product, broker, AND pre-fill child table
- **broker** → Auto-populate broker_commission_percent from Broker DocType
- **broker_commission_percent (manual change)** → Recalculate broker_commission_amount

---

## **KEY IMPLEMENTATION NOTES**

### **Simplified Weight Tracking:**
- **REMOVED:** item_dispatch_weight field
- **SIMPLIFIED TO:** Only item_gross_weight (expected quantity from Sauda)
- **Benefit:** Reduces complexity, user enters actual dispatched weight directly
- **User Experience:** Gross weight prefills from Sauda but remains editable for actual dispatch

### **KG/Quintal Conversion:**
- **Formula:** item_amount = (item_gross_weight / 100) × item_rate
- **Why:** Weights are in KG, rates are per Quintal (100 KG)
- **Same as Inward:** Follow exact same pattern as Inward DocType

### **Multi-Item Support:**
- Each row in outward_items has individual calculations
- Parent totals are SUM of respective child table fields
- Support adding/removing items dynamically
- Follow Inward DocType pattern for child table handling

### **Sauda Integration with Pre-fill:**
- Auto-populate parent fields when Sauda is selected
- **NEW:** Pre-fill child table with expected weight and rate from Sauda
- Values are editable - user can adjust before saving
- Use same pattern as Inward for Sauda field population
- Link outward transactions to original booking

### **Status Management:**
- **pending:** Default status, not yet dispatched
- **dispatched:** Vehicle loaded and left warehouse
- **delivered:** Reached customer location
- **completed:** Transaction closed, payment received

### **Financial Precision:**
- All monetary calculations rounded to 2 decimal places
- Ensures consistency with GST/TDS requirements
- Payment-ready amounts
- Follow exact same rounding logic as Inward

### **Broker Commission:**
- For records and tracking only
- NOT deducted from net_total
- Just informational field
- Auto-populated from Broker master but can be overridden

---

## **COMPLETE COMMAND CHECKLIST**

### **After ANY Changes (Drag-Drop OR Code):**
```bash
# 1. Export all fixtures (ALWAYS do this first)
bench --site kisan-new.localhost export-fixtures

# 2. Migrate changes to database
bench --site kisan-new.localhost migrate

# 3. Reload specific DocTypes (if modified)
bench --site kisan-new.localhost reload-doctype "Outward"
bench --site kisan-new.localhost reload-doctype "Outward Item Detail"

# 4. Clear cache
bench --site kisan-new.localhost clear-cache

# 5. Build assets (if you added/modified JS/CSS)
bench build --app kisan_warehouse

# 6. Restart bench (if needed)
bench restart
```

---

## **LESSONS LEARNED - WHAT NOT TO DO**

### **Common Mistakes to Avoid:**
- Don't add complex server-side validation
- Don't skip export-fixtures after changes
- Don't ignore database lock errors
- Don't allow negative weights or rates
- Don't skip Sauda quantity updates
- Don't allow outward without sufficient inventory
- Don't use complex server-side calculations in validate() method

### **What ALWAYS Works:**
- Keep server scripts minimal: `class Outward(Document): pass`
- Export fixtures after every change
- Test thoroughly before adding complexity
- Use system restart if you get lock timeouts
- Handle zero values gracefully (use >= 0 instead of > 0)
- Validate child table data completeness
- Follow exact patterns from working Inward implementation
- Pre-fill child tables from linked documents (Sauda)

---

## **SUCCESS METRICS**

### **Working Implementation Should:**
- Calculate item_amount in real-time for each child row
- Auto-sum net_total when child table is modified
- Calculate broker_commission_amount when percentage changes
- Round all financial calculations to 2 decimal places
- Auto-populate customer, warehouse, product, broker from Sauda
- **NEW:** Pre-fill child table with expected weight and rate from Sauda (editable)
- Validate gross weight against Sauda pending quantity
- Handle multiple items in single outward transaction
- Update Sauda pending quantities on submit (if implemented)
- Restore Sauda quantities on cancel (if implemented)
- Submit forms without hanging/timeout
- Work on both new and edit forms
- Export properly to fixtures
- Maintain proper status workflow
- Handle zero values without errors

---

## **TESTING CHECKLIST**

### **After Creation, Verify:**
- [ ] Outward DocType appears in module
- [ ] Outward Item Detail child table created with correct fields
- [ ] Naming series generates OUT-2025-0001 format
- [ ] Can create new Outward record
- [ ] Sauda selection auto-populates customer, warehouse, product, broker
- [ ] **NEW:** Child table pre-fills with item_gross_weight and item_rate from Sauda
- [ ] **NEW:** Pre-filled values in child table are editable
- [ ] Child table shows with "Add Row" button
- [ ] item_amount calculates correctly (gross_weight/100 × rate)
- [ ] net_total sums all item_amounts
- [ ] broker_commission_amount calculates from net_total
- [ ] broker_commission_percent auto-fills from Broker master
- [ ] All financial fields round to 2 decimals
- [ ] Can add/remove multiple items
- [ ] Status dropdown shows all options (pending, dispatched, delivered, completed)
- [ ] Can save and submit without errors
- [ ] Sauda pending_quantity updates on submit (if implemented)
- [ ] Search by date/customer/sauda works
- [ ] List view shows key fields properly

---

## **FILE STRUCTURE**

```
apps/kisan_warehouse/kisan_warehouse/outwards/doctype/
├── outward/
│   ├── __init__.py (empty file)
│   ├── outward.json (DocType definition)
│   └── outward.py (Minimal: class Outward(Document): pass)

├── outward_item_detail/
│   ├── __init__.py (empty file)
│   ├── outward_item_detail.json (DocType definition)
│   └── outward_item_detail.py (Minimal: class OutwardItemDetail(Document): pass)
```

---

## **REFERENCE TABLE - FIELD MAPPING**

**Parent: Outward**

| Field Name | Label | Type | Required | Default | Options/Link |
|------------|-------|------|----------|---------|--------------|
| outward_date | Outward Date | Date | Yes | Today | - |
| outward_status | Status | Select | Yes | pending | pending, dispatched, delivered, completed |
| sauda | Sauda | Link | Yes | - | Sauda |
| customer | Customer | Link | Yes (Read Only) | - | Customer |
| warehouse | Warehouse | Link | Yes (Read Only) | - | Warehouse |
| product | Product | Link | Yes (Read Only) | - | Product |
| broker | Broker | Link | No (Read Only) | - | Broker |
| vehicle | Vehicle | Link | Yes | - | Vehicle |
| outward_items | Outward Item Details | Table | Yes | - | Outward Item Detail |
| net_total | Net Total | Currency | No (Read Only) | - | Precision: 2 |
| broker_commission_percent | Broker Commission (%) | Percent | No | - | Auto-filled from Broker |
| broker_commission_amount | Broker Commission Amount | Currency | No (Read Only) | - | Precision: 2 |
| notes | Notes | Small Text | No | - | 3 rows |

**Child: Outward Item Detail**

| Field Name | Label | Type | Required | Precision | Read Only | Notes |
|------------|-------|------|----------|-----------|-----------|-------|
| item_gross_weight | Gross Weight (Kg) | Float | Yes | 2 | No | Prefilled from Sauda, Editable |
| item_bags | No. of Bags | Int | Yes | - | No | User enters |
| item_rate | Rate (per Quintal) | Currency | Yes | 2 | No | Prefilled from Sauda, Editable |
| item_amount | Total Amount | Currency | No | 2 | Yes | Calculated field |

---

## **ADDITIONAL CONSIDERATIONS**

### **Inventory Management:**
- Simplified weight tracking with single gross weight field
- Track expected vs. actual dispatch weights through editable gross weight
- Maintain audit trail of all outward movements
- Link to Sauda for fulfillment tracking
- Consider adding warehouse inventory checks before dispatch

### **Reporting Requirements:**
- Daily dispatch report by warehouse
- Customer-wise dispatch summary
- Sauda fulfillment tracking report
- Broker commission summary report
- Pending deliveries report
- Weight variance report (expected vs actual)

### **Future Enhancements:**
- E-way bill generation integration
- Vehicle tracking integration
- SMS/Email notifications to customer on dispatch
- Automatic invoicing upon completion
- Warehouse stock level alerts
- GPS-based delivery confirmation
- Customer signature capture for deliveries
- Photo upload for dispatch verification

### **Status Workflow:**
- **pending:** Initial state after creation
- **dispatched:** Update when vehicle leaves warehouse
- **delivered:** Update when reaches customer
- **completed:** Final state after all formalities

---

## **CRITICAL REMINDERS**

1. **NO Code in Prompt:** Implementation details provided, but actual code must be written by developer
3. **Minimal Server Script:** Keep outward.py minimal - just class definition
4. **Export Fixtures:** ALWAYS run export-fixtures after any change
5. **Test Thoroughly:** Test each calculation before adding more complexity
6. **Follow Patterns:** Use Inward and Sauda as reference implementations
7. **Rounding:** All financial calculations must round to 2 decimal places
8. **Child Table:** Handle add/remove/modify events properly
9. **Auto-population:** Sauda selection should trigger field AND child table pre-population
10. **Validation:** Keep validations simple, avoid complex server-side logic
11. **NEW:** Ensure Sauda data fetching includes expected_quantity and sauda_rate fields
12. **NEW:** Child table pre-fill values must remain editable for user adjustments
