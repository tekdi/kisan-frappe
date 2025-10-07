# Outward Jawak - AI DocType Creation Guide

## **Parent DocType: Outward Jawak**

```
Create a Frappe v15 DocType for Outward Jawak with these specifications:

**Basic Configuration:**
- DocType Name: Outward Jawak
- Module: Warehouse Rent
- Naming: Auto-naming with series "JAWAK-.YYYY.-.####"
- Track Changes: Yes
- Is Submittable: Yes
- Custom: Yes

**Fields (in exact order):**

1. **naming_series** (Select)
   - Hidden: Yes
   - Default: "JAWAK-.YYYY.-.####"

2. **Section Break:** Basic Information

3. **jawak_date** (Datetime)
   - Label: Jawak Date
   - Mandatory: Yes
   - Default: Now
   - In List View: Yes

4. **Column Break**

5. **vehicle_number** (Data)
   - Label: Vehicle Number
   - Mandatory: No
   - Length: 20

6. **Section Break:** Inward Reference

7. **aawak_reference** (Link)
   - Label: Aawak Reference
   - Mandatory: Yes
   - Options: Inward Aawak
   - In List View: Yes

8. **Section Break:** Pre-filled Inward Details

9. **storage_customer** (Link)
   - Label: Storage Customer
   - Mandatory: Yes
   - Options: Storage Customer
   - Read Only: Yes
   - In List View: Yes

10. **commodity** (Link)
    - Label: Commodity
    - Mandatory: Yes
    - Options: Commodity
    - Read Only: Yes

11. **Column Break**

12. **godown** (Link)
    - Label: Godown
    - Mandatory: Yes
    - Options: Godown
    - Read Only: Yes

13. **floor** (Link)
    - Label: Floor
    - Mandatory: Yes
    - Options: Warehouse Floor
    - Read Only: Yes

14. **Column Break**

15. **chamber** (Link)
    - Label: Chamber
    - Mandatory: Yes
    - Options: Floor Chamber
    - Read Only: Yes

16. **Section Break:** Bag Release Details

17. **jawak_bag_details** (Table)
    - Label: Bag Release Details
    - Mandatory: Yes
    - Options: Jawak Bag Detail

18. **Section Break:** Summary Totals

19. **total_bags** (Int)
    - Label: Total Bags
    - Mandatory: Yes
    - Read Only: Yes

20. **released_bags** (Int)
    - Label: Released Bags
    - Mandatory: Yes
    - Read Only: Yes
    - In List View: Yes

21. **Column Break**

22. **total_weight** (Float)
    - Label: Total Weight (Kg)
    - Mandatory: Yes
    - Read Only: Yes
    - Precision: 2

23. **released_bag_weight** (Float)
    - Label: Released Bag Weight (Kg)
    - Mandatory: Yes
    - Read Only: Yes
    - Precision: 2

24. **Section Break:** Financial Settlement

25. **total_amount** (Currency)
    - Label: Total Amount
    - Mandatory: Yes
    - Read Only: Yes
    - Precision: 2

26. **additional_charges** (Currency)
    - Label: Additional Charges
    - Mandatory: No
    - Default: 0
    - Precision: 2

27. **Column Break**

28. **discount** (Currency)
    - Label: Discount
    - Mandatory: No
    - Default: 0
    - Precision: 2

29. **net_amount** (Currency)
    - Label: Net Amount
    - Mandatory: Yes
    - Read Only: Yes
    - Precision: 2
    - In List View: Yes

30. **Section Break:** Payment Details

31. **payment_method** (Select)
    - Label: Payment Method
    - Mandatory: Yes
    - Options: Cash, UPI, Bank Transfer, Cheque
    - In List View: Yes

32. **Column Break**

33. **payment_reference** (Data)
    - Label: Payment Reference
    - Mandatory: No
    - Length: 140

34. **Section Break:** Additional

35. **notes** (Small Text)
    - Label: Notes
    - Mandatory: No
    - Rows: 3

36. **Column Break**

37. **status** (Select)
    - Label: Status
    - Mandatory: Yes
    - Options: Draft, Paid, Released
    - Default: Draft
    - In List View: Yes

**Additional Settings:**
- Title Field: naming_series
- Search Fields: aawak_reference, storage_customer, vehicle_number
- Sort Field: jawak_date
- Sort Order: DESC

**Permissions:**
- System Manager: All rights
- Administrator (Kisan Admin): Create, Read, Write, Submit
- Accountant (Kisan Accountant): Create, Read, Write, Submit
- Operator (Kisan Operator): Create, Read, Write, Submit

**File Location:**
apps/kisan_warehouse/kisan_warehouse/warehouse_rent/doctype/outward_jawak/

Create:
1. outward_jawak.json (DocType definition)
2. outward_jawak.py (Minimal server script: class OutwardJawak(Document): pass)
3. __init__.py (empty file)
```

---

## **Child DocType: Jawak Bag Detail**

```
Create a Frappe v15 Child DocType with these specifications:

**Basic Configuration:**
- DocType Name: Jawak Bag Detail
- Module: Warehouse Rent
- Is Child Table: Yes
- Parent DocType: Outward Jawak
- Custom: Yes

**Fields (in exact order):**

1. **bag_type** (Link)
   - Label: Bag Type
   - Mandatory: Yes
   - Options: Commodity Bag Configuration
   - Read Only: Yes
   - In List View: Yes

2. **total_bags** (Int)
   - Label: Total Bags
   - Mandatory: Yes
   - Read Only: Yes
   - In List View: Yes
   - Description: From Aawak

3. **release_bags** (Int)
   - Label: Release Bags
   - Mandatory: Yes
   - In List View: Yes
   - Description: Editable, cannot exceed total_bags

4. **rate** (Currency)
   - Label: Rate per Bag per Day
   - Mandatory: Yes
   - Read Only: Yes
   - Precision: 2
   - In List View: Yes

5. **total_days** (Int)
   - Label: Total Days
   - Mandatory: Yes
   - Read Only: Yes
   - In List View: Yes
   - Description: Auto-calculated storage duration

6. **total_amount** (Currency)
   - Label: Total Amount
   - Mandatory: Yes
   - Read Only: Yes
   - Precision: 2
   - In List View: Yes
   - Description: release_bags × rate × total_days

**File Location:**
apps/kisan_warehouse/kisan_warehouse/warehouse_rent/doctype/jawak_bag_detail/

Create:
1. jawak_bag_detail.json (DocType definition)
2. jawak_bag_detail.py (class JawakBagDetail(Document): pass)
3. __init__.py (empty file)
```

---

## 📋 FIELD REFERENCE TABLE

**Parent: Outward Jawak**

| Field Name | Label | Type | Required | Read Only | Default | Options |
|------------|-------|------|----------|-----------|---------|---------|
| jawak_date | Jawak Date | Datetime | Yes | No | Now | - |
| vehicle_number | Vehicle Number | Data | No | No | - | - |
| aawak_reference | Aawak Reference | Link | Yes | No | - | Inward Aawak |
| storage_customer | Storage Customer | Link | Yes | Yes | - | Storage Customer |
| commodity | Commodity | Link | Yes | Yes | - | Commodity |
| godown | Godown | Link | Yes | Yes | - | Godown |
| floor | Floor | Link | Yes | Yes | - | Warehouse Floor |
| chamber | Chamber | Link | Yes | Yes | - | Floor Chamber |
| jawak_bag_details | Bag Release Details | Table | Yes | No | - | Jawak Bag Detail |
| total_bags | Total Bags | Int | Yes | Yes | - | - |
| released_bags | Released Bags | Int | Yes | Yes | - | - |
| total_weight | Total Weight (Kg) | Float | Yes | Yes | - | Precision: 2 |
| released_bag_weight | Released Bag Weight (Kg) | Float | Yes | Yes | - | Precision: 2 |
| total_amount | Total Amount | Currency | Yes | Yes | - | Precision: 2 |
| additional_charges | Additional Charges | Currency | No | No | 0 | Precision: 2 |
| discount | Discount | Currency | No | No | 0 | Precision: 2 |
| net_amount | Net Amount | Currency | Yes | Yes | - | Precision: 2 |
| payment_method | Payment Method | Select | Yes | No | - | Cash, UPI, Bank Transfer, Cheque |
| payment_reference | Payment Reference | Data | No | No | - | - |
| notes | Notes | Small Text | No | No | - | - |
| status | Status | Select | Yes | No | Draft | Draft, Paid, Released |

**Child: Jawak Bag Detail**

| Field Name | Label | Type | Required | Read Only | Description |
|------------|-------|------|----------|-----------|-------------|
| bag_type | Bag Type | Link | Yes | Yes | Commodity Bag Configuration |
| total_bags | Total Bags | Int | Yes | Yes | From Aawak |
| release_bags | Release Bags | Int | Yes | No | Editable |
| rate | Rate per Bag per Day | Currency | Yes | Yes | From Commodity |
| total_days | Total Days | Int | Yes | Yes | Auto-calculated |
| total_amount | Total Amount | Currency | Yes | Yes | Calculated |

---

## ⚙️ POST-CREATION COMMANDS

```bash
bench --site kisan-new.localhost export-fixtures
bench --site kisan-new.localhost migrate
bench --site kisan-new.localhost reload-doctype "Outward Jawak"
bench --site kisan-new.localhost reload-doctype "Jawak Bag Detail"
bench --site kisan-new.localhost clear-cache
bench build --app kisan_warehouse
bench restart
```

---

## ✅ TESTING CHECKLIST

- [ ] Outward Jawak DocType created
- [ ] Jawak Bag Detail child table created
- [ ] Naming series JAWAK-2025-0001 works
- [ ] Is Submittable enabled
- [ ] jawak_date defaults to now
- [ ] Read-only fields marked correctly
- [ ] Child table name is unique (not conflicting with Inward Aawak's child)

---

# Outward Jawak DocType Scripts

## **IMPLEMENTATION PROMPT TEMPLATE**

```
I need to implement client and server scripts for the Outward Jawak DocType in our Kisan Warehouse Frappe app.

**CRITICAL REQUIREMENTS:**
1. Use ONLY Client Script DocType (created via bench console) - DO NOT create .js files
2. Server script should be minimal: `class OutwardJawak(Document): pass`
3. All calculations must be client-side only
4. No server-side validation that could cause database locks
5. Follow Frappe v15 standards

**Business Logic:**
[See calculations below]

**Implementation Steps:**
1. First implement basic calculations
2. Test thoroughly before adding validations
3. Export fixtures after each working change
4. Use bench console for Client Script creation
5. Keep server script minimal to avoid timeout issues

**Reference:** Use the working Sauda, Inward, and Inward Aawak implementations as template.
```

## **Project Reference**
Use project context from `ai_prompts/warehouse_rent_project_overview.md`

## **COMPLETE COMMAND CHECKLIST**

### **After ANY Changes (Drag-Drop OR Code):**
```bash
# 1. Export all fixtures (ALWAYS do this first)
bench --site kisan-new.localhost export-fixtures

# 2. Migrate changes to database
bench --site kisan-new.localhost migrate

# 3. Reload specific DocType (if you modified it)
bench --site kisan-new.localhost reload-doctype "Outward Jawak"

# 4. Clear cache
bench --site kisan-new.localhost clear-cache

# 5. Build assets (if you added/modified JS/CSS)
bench build --app kisan_warehouse

# 6. Restart bench (if needed)
bench restart
```

## **LESSONS LEARNED - WHAT NOT TO DO**

### **Common Mistakes to Avoid:**
- Don't create separate .js files initially
- Don't add complex server-side validation
- Don't skip export-fixtures after changes
- Don't ignore database lock errors
- Don't add client-side validate() functions that throw errors
- Don't use complex server-side calculations in validate() method
- Don't allow release of more bags than stored
- Don't forget to update chamber availability after release

### **What ALWAYS Works:**
- Use Client Script DocType via bench console
- Keep server scripts minimal: `class OutwardJawak(Document): pass`
- Export fixtures after every change
- Test thoroughly before adding complexity
- Use system restart if you get lock timeouts
- Handle zero values in calculations (use >= 0 instead of > 0)
- Auto-populate from Aawak reference for operator convenience

## **BUSINESS LOGIC REQUIREMENTS**

### **Objective**
Calculate storage rent based on actual duration, process goods release with automated billing, and update chamber availability for warehouse rental operations.

### **Fields Involved**

#### **Parent DocType Fields:**
- **Input Fields:** jawak_date, vehicle_number, additional_charges, discount, payment_method, payment_reference, notes, status
- **Auto-populated Fields:** storage_customer, commodity, godown, floor, chamber (from Aawak reference)
- **Calculated Fields:** total_bags, released_bags, total_weight, released_bag_weight, total_amount, net_amount
- **Child Tables:** bag_details (Bag Details)

#### **Child Table Fields (Bag Details):**
- **Auto-populated Fields:** bag_type, total_bags, rate (from Aawak and commodity)
- **Input Fields:** release_bags (editable, default = total_bags)
- **Calculated Fields:** total_days, total_amount

### **Calculations to Implement**

#### **1. Child Table Calculations (Bag Details)**
1. **total_days = Math.ceil((jawak_date - aawak_date) / (1000 * 60 * 60 * 24))** (Days between dates)
2. **total_amount = release_bags × rate × total_days** (Rent calculation per bag type)

#### **2. Parent Summary Calculations**
3. **total_bags = SUM(total_bags)** from all bag_details rows
4. **released_bags = SUM(release_bags)** from all bag_details rows
5. **total_weight = SUM(total_bags × bag_weight)** from all bag_details rows
6. **released_bag_weight = SUM(release_bags × bag_weight)** from all bag_details rows
7. **total_amount = SUM(total_amount)** from all bag_details rows
8. **net_amount = total_amount + additional_charges - discount**

#### **3. Auto-population from Aawak**
9. **Complete Form Population:** When aawak_reference selected → Auto-fill all customer, commodity, godown details
10. **Bag Details Population:** Auto-populate bag_details child table with:
    - bag_type (from Aawak commodity configuration)
    - total_bags (from Aawak total_bags)
    - rate (from commodity bag configuration rate_per_bag_per_day)
    - release_bags = total_bags (default full release, editable by operator)

### **Rounding Requirements**
- **Days calculation:** Round UP to nearest whole day using Math.ceil() for billing fairness
- **Financial fields:** Round to 2 decimal places using Math.round(value * 100) / 100
- **Applied to:** total_amount, net_amount, additional_charges, discount
- **Weight calculations:** Round to 2 decimal places

### **Requirements**
- **Client-side:** Real-time updates when input fields change
- **Server-side:** Minimal validation only (positive values, release ≤ stored)
- **Validation:** All amounts and quantities must be >= 0
- **Validation:** release_bags ≤ total_bags for each bag type
- **Validation:** jawak_date ≥ aawak_date (cannot release before storage)
- **Zero Handling:** Calculations should work with zero values during data entry
- **Child Table Support:** Auto-calculate when bag details are modified
- **Multi-Bag Support:** Handle multiple bag weight types in single transaction
- **Aawak Integration:** Complete auto-population from Aawak reference
- **Draft State:** All calculated values should update in draft mode
- **Rounding:** All financial calculations properly rounded for billing accuracy
- **Chamber Management:** Update chamber availability when goods released

### **Field Triggers Required**

#### **Parent Field Triggers:**
- **aawak_reference** → Auto-populate ALL fields and bag_details child table
- **jawak_date** → Recalculate total_days for all child rows and update all amounts
- **bag_details child table changes** → Recalculate all parent summary totals
- **total_amount, additional_charges, discount** → Calculate net_amount

#### **Child Table Triggers (Bag Details):**
- **release_bags** → Recalculate total_amount for that row
- **jawak_date change** → Recalculate total_days and total_amount for all rows
- **Any child table modification** → Recalculate all parent summary fields

### **Auto-population from Aawak Reference**

#### **Single Field Entry Workflow:**
- Operator enters **ONLY** aawak_reference number
- System automatically populates:
  - **Customer Details:** storage_customer
  - **Product Details:** commodity, godown, floor, chamber
  - **Storage Duration:** aawak_date for days calculation
  - **Complete Bag Details Table:**
    - bag_type from Aawak commodity
    - total_bags from Aawak
    - rate from commodity configuration
    - release_bags = total_bags (full release default)

#### **Operator Modifications:**
- **Review:** Check all auto-populated details
- **Partial Release:** Modify release_bags if not releasing all bags
- **Additional Charges:** Enter extra service charges
- **Discount:** Apply any discount
- **Payment Details:** Select payment method and enter reference

### **Key Implementation Notes**
- **Duration-Based Billing:** Rent = Bags × Rate per Day × Storage Days
- **Partial Release Support:** Allow releasing only some bags while keeping others in storage
- **Multi-Bag Types:** Single Aawak can have multiple bag weight configurations
- **Real-time Calculations:** All amounts update instantly when quantities changed
- **Operator-Friendly:** Minimal data entry with smart auto-population
- **Chamber Updates:** Update chamber status to 'Available' when all bags released
- **Billing Accuracy:** Proper rounding for financial compliance
- **Payment Integration:** Support multiple payment methods with references

## **SUCCESS METRICS**

### **Working Implementation Should:**
- Auto-populate entire form when Aawak reference selected
- Calculate storage days automatically between Aawak and Jawak dates
- Calculate rent per bag type in real-time (bags × rate × days)
- Sum all parent totals when child table changes
- Calculate net amount with additional charges and discounts
- Validate release quantities against stored quantities
- Handle partial releases (some bags remain in storage)
- Support multiple bag weight types in single transaction
- Update chamber availability when goods fully released
- Round all financial calculations to 2 decimal places
- Work with zero values during data entry
- Submit forms without hanging/timeout
- Work on both new and edit forms
- Export properly to fixtures
- Maintain accurate chamber occupancy tracking

## **SPECIFIC OUTWARD JAWAK CONSIDERATIONS**

### **Duration-Based Billing Model:**
- **Daily Rate Structure:** Each bag type has rate per day
- **Storage Period:** Calculate exact days between Aawak and Jawak
- **Multiple Bag Types:** Different rates for different bag weights
- **Partial Release:** Support releasing only some bags
- **Billing Accuracy:** Round UP days, round currency to 2 decimals

### **Operator Workflow Optimization:**
- **Single Entry Point:** Only Aawak reference number required
- **Complete Auto-Population:** System fills all related fields
- **Review & Modify:** Operator can adjust release quantities
- **Additional Services:** Support extra charges and discounts
- **Payment Processing:** Capture payment method and references
- **Receipt Generation:** Ready for final billing and receipt

### **Chamber Management Integration:**
- **Occupancy Updates:** Update chamber status when bags released
- **Partial Release Impact:** Track remaining bags in chambers
- **Full Release:** Mark chamber as 'Available' when empty
- **Multi-Chamber Release:** Handle releases from multiple chambers

### **Financial Accuracy:**
- **Rent Calculation:** Precise daily rate application
- **Additional Charges:** Support extra services billing
- **Discount Application:** Handle promotional discounts
- **Net Amount:** Final amount for payment processing
- **Payment Tracking:** Record payment methods and references

## **VALIDATION RULES**

### **Must Have Validations:**
1. **Positive Values:** All quantities, rates, and amounts ≥ 0
2. **Release Logic:** release_bags ≤ total_bags for each bag type
3. **Date Logic:** jawak_date ≥ aawak_date (cannot release before storage)
4. **Payment Required:** payment_method required when status = 'Paid'
5. **Required Fields:** aawak_reference must be selected

### **Business Logic Validations:**
1. **Storage Duration:** Minimum 1 day billing (round UP incomplete days)
2. **Chamber Status:** Verify bags are actually stored in chambers
3. **Partial Release Tracking:** Update remaining quantities in chambers
4. **Payment Reference:** Required when payment_method is not 'Cash'

### **Optional Business Validations:**
1. **Customer Status:** Check if customer has outstanding dues
2. **Release Authorization:** Verify proper authorization for goods release
3. **Vehicle Capacity:** Check if release quantity fits in selected vehicle
4. **Chamber Access:** Verify chamber accessibility for goods release

## **PAYMENT PROCESSING**

### **Payment Methods:**
- **Cash:** Direct cash payment, no reference required
- **UPI:** Digital payment, requires UPI transaction ID
- **Bank Transfer:** Bank payment, requires bank reference number
- **Cheque:** Cheque payment, requires cheque number and bank details

### **Payment Status Flow:**
- **Draft:** Initial state, calculations done but no payment
- **Paid:** Payment received and verified
- **Released:** Goods physically released to customer

## **CHAMBER AVAILABILITY UPDATES**

### **Release Impact:**
- **Full Release:** Mark chamber as 'Available' when all bags released
- **Partial Release:** Update remaining bag quantities in chamber
- **Multi-Chamber:** Handle releases across multiple chambers
- **Status Updates:** Real-time chamber occupancy updates

### **Capacity Management:**
- **Released Space:** Add released capacity back to chamber availability
- **Remaining Stock:** Track what's still stored in each chamber
- **Allocation Updates:** Update for future Aawak allocations

## **INTEGRATION POINTS**

### **With Inward Aawak:**
- **Data Source:** Complete form population from Aawak reference
- **Duration Calculation:** Use Aawak date for storage period
- **Quantity Validation:** Ensure release doesn't exceed stored quantities
- **Chamber Tracking:** Link to original chamber allocations

### **With Commodity Master:**
- **Rate Information:** Pull daily rates for each bag weight
- **Bag Configurations:** Use commodity bag weight options
- **Product Details:** Link commodity specifications

### **With Chamber Management:**
- **Occupancy Updates:** Real-time chamber status changes
- **Capacity Restoration:** Return released space to available capacity
- **Multi-Chamber Coordination:** Handle complex allocation releases

### **With Payment System:**
- **Receipt Generation:** Prepare data for receipt printing
- **Payment Tracking:** Record transaction details
- **Financial Integration:** Link to accounting system for revenue recording