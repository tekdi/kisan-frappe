# Inward DocType Scripts

## **IMPLEMENTATION PROMPT TEMPLATE**

```
I need to implement client and server scripts for the Inward DocType in our Kisan Warehouse Frappe app.

**CRITICAL REQUIREMENTS:**
1. Use ONLY Client Script DocType (created via bench console) - DO NOT create .js files
2. Server script should be minimal: `class Inward(Document): pass`
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

**Reference:** Use the working Sauda implementation as template.
```
## **Project Reference**
Use project context from `ai_prompts/kisan_warehouse_project_overview.md`

## **COMPLETE COMMAND CHECKLIST**

### **After ANY Changes (Drag-Drop OR Code):**
```bash
# 1. Export all fixtures (ALWAYS do this first)
bench --site kisan.local export-fixtures

# 2. Migrate changes to database
bench --site kisan.local migrate

# 3. Reload specific DocType (if you modified it)
bench --site kisan.local reload-doctype Inward

# 4. Clear cache
bench --site kisan.local clear-cache

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

### **What ALWAYS Works:**
- Use Client Script DocType via bench console
- Keep server scripts minimal: `class Inward(Document): pass`
- Export fixtures after every change
- Test thoroughly before adding complexity
- Use system restart if you get lock timeouts
- Handle zero values in calculations (use >= 0 instead of > 0)

## **BUSINESS LOGIC REQUIREMENTS**

### **Objective**
Perform automatic calculations and real-time field updates for multi-item inward receipt of agricultural produce with KG/Quintal units and comprehensive payment tracking.

### **Fields Involved**

#### **Parent DocType Fields:**
- **Input Fields:** vehicle_weight, cgst_percent, sgst_percent, igst_percent, tcs_percent, tds_percent, broker_commission_percent
- **Auto-populated Fields:** customer, warehouse, product, company, broker (from selected Sauda)
- **Calculated Fields:** total_gross_weight, total_bags, total_arrival_weight, total_amount, total_deductions, sub_total, total_gst_amount, tcs_amount, tds_amount, broker_commission_amount, net_total
- **Payment Summary Fields:** total_amount_paid, total_amount_pending, inward_payment_status, last_payment_date
- **Child Tables:** inward_items (Inward Item Detail), deductions (Inward Deduction), inward_payments (Inward Payment)

#### **Child Table Fields (Inward Item Detail):**
- **Input Fields:** item_gross_weight, bags, item_arrival_weight, item_rate
- **Calculated Fields:** item_amount

#### **Child Table Fields (Inward Payment):**
- **Input Fields:** payment_date, payment_amount, payment_method, payment_status, payment_reference, payment_note
- **Auto Fields:** due_date, received_by

### **Calculations to Implement**

#### **1. Child Table Calculations (Inward Item Detail)**
1. **item_amount = (item_arrival_weight / 100) * item_rate** (KG to Quintal conversion)

#### **2. Parent Total Calculations (Auto-sum from Child Table)**
2. **total_gross_weight = SUM(item_gross_weight)** from all child rows
3. **total_bags = SUM(bags)** from all child rows
4. **total_arrival_weight = SUM(item_arrival_weight)** from all child rows
5. **total_amount = SUM(item_amount)** from all child rows

#### **3. Deduction Calculations**
6. **total_deductions = SUM(deduction_amount)** from deductions child table

#### **4. Financial Calculations**
7. **sub_total = total_amount - total_deductions**

#### **5. Tax Calculations**
8. **total_gst_amount = sub_total * (cgst_percent + sgst_percent + igst_percent) / 100**
9. **tcs_amount = sub_total * tcs_percent / 100**
10. **tds_amount = sub_total * tds_percent / 100**
11. **broker_commission_amount = sub_total * broker_commission_percent / 100**

#### **6. Final Calculation**
12. **net_total = sub_total + total_gst_amount + tcs_amount - tds_amount**

#### **7. Payment Calculations (NEW)**
13. **total_amount_paid = SUM(payment_amount)** where payment_status = 'success'
14. **total_amount_pending = net_total - total_amount_paid**
15. **inward_payment_status** = Auto-determined: 'pending', 'processing', 'success'
16. **last_payment_date = MAX(payment_date)** where payment_status = 'success'

#### **8. Auto-population from Sauda**
- When sauda is selected, auto-fill: customer, warehouse, product, company, broker
- Auto-populate payment_due_date from sauda.payment_end_date
- Optionally pre-populate inward_items child table with expected data from Sauda

### **Rounding Requirements (NEW)**
- **ALL financial fields** rounded to 2 decimal places using Math.round(value * 100) / 100
- **Applied to:** All amounts, totals, taxes, deductions, and payment fields
- **Compliance:** Required for GST/TDS/TCS legal compliance and payment gateway integration
- **Professional Output:** Clean invoices and payment-ready amounts

### **Payment Status Options (Updated)**
- **pending** - Default when no payment yet (gateway-ready)
- **processing** - Partial payment received (gateway-ready)
- **success** - Full payment completed (gateway-ready)
- **failed** - Payment failed or invalid (gateway-ready)

### **Requirements**
- **Client-side:** Real-time updates when input fields change
- **Server-side:** Minimal validation only (positive values)
- **Validation:** All weights, rates, and percentages must be >= 0
- **Zero Handling:** Calculations should work with zero values
- **Child Table Support:** Auto-calculate when child tables are modified
- **Multi-Item Support:** Handle multiple items in inward_items child table
- **Payment Tracking:** Support multiple payments per inward transaction
- **Sauda Integration:** Auto-populate fields when Sauda is selected
- **Draft State:** All calculated values should update in draft mode
- **Rounding:** All financial calculations rounded to 2 decimal places

### **Field Triggers Required**

#### **Child Table Triggers (Inward Item Detail):**
- **item_arrival_weight, item_rate** → Calculate item_amount
- **Any child table modification** → Recalculate all parent totals

#### **Child Table Triggers (Inward Payment):**
- **payment_amount, payment_status** → Recalculate payment totals
- **Any payment table modification** → Update parent payment summary

#### **Parent Field Triggers:**
- **inward_items child table changes** → Calculate total_gross_weight, total_bags, total_arrival_weight, total_amount
- **deductions child table changes** → Calculate total_deductions
- **inward_payments child table changes** → Calculate total_amount_paid, total_amount_pending, inward_payment_status, last_payment_date
- **total_amount, total_deductions** → Calculate sub_total
- **sub_total, cgst_percent, sgst_percent, igst_percent** → Calculate total_gst_amount
- **sub_total, tcs_percent** → Calculate tcs_amount
- **sub_total, tds_percent** → Calculate tds_amount
- **sub_total, broker_commission_percent** → Calculate broker_commission_amount
- **sub_total, total_gst_amount, tcs_amount, tds_amount** → Calculate net_total
- **net_total, total_amount_paid** → Calculate total_amount_pending and inward_payment_status
- **sauda** → Auto-populate customer, warehouse, product, company, broker, payment_due_date

### **Key Implementation Notes**
- **KG/Quintal Conversion:** item_amount = (item_arrival_weight / 100) * item_rate
- **Multi-Item Support:** Each row in inward_items has individual calculations
- **Multi-Payment Support:** Each row in inward_payments tracks individual payment transactions
- **Parent Totals:** All parent totals are SUM of respective child table fields
- **Payment Summary:** Parent payment fields summarize child payment data
- **Validation:** item_arrival_weight should be ≤ item_gross_weight for each item
- **Auto-calculation:** All parent totals update when child tables are modified
- **Gateway Ready:** Payment status names compatible with payment gateway APIs
- **Financial Precision:** All monetary calculations rounded to 2 decimal places

## **SUCCESS METRICS**

### **Working Implementation Should:**
- Calculate item_amount in real-time for each child row
- Auto-sum all totals when child tables are modified
- Calculate sub_total when amounts or deductions change
- Calculate all tax amounts when percentages change
- Calculate net_total incorporating all components
- Calculate payment totals in real-time when payments added/modified
- Auto-determine payment status based on amount paid vs net total
- Round all financial calculations to 2 decimal places
- Support payment gateway-ready status names (pending/processing/success/failed)
- Track last payment date from completed payments
- Handle multiple payment entries per inward transaction
- Auto-populate fields when Sauda is selected
- Handle zero values without errors
- Support multiple items in single inward transaction
- Validate item weights (arrival ≤ gross for each item)
- Submit forms without hanging/timeout
- Work on both new and edit forms
- Export properly to fixtures
- Update pending quantities in linked Sauda record
- Maintain payment audit trail with proper status tracking