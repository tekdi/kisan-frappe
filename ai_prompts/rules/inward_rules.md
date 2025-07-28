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
## **Reference**
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
Perform automatic calculations and real-time field updates for inward receipt of agricultural produce.

### **Fields Involved**
- **Input Fields:** gross_weight, vehicle_weight, rate_per_ton, cgst_percent, sgst_percent, igst_percent, tcs_percent, tds_percent, broker_commission_percent
- **Calculated Fields:** net_weight, total_amount, total_deductions, net_amount, gst_amount, tcs_amount, tds_amount, broker_commission_amount, final_amount
- **Auto-populated Fields:** customer, warehouse, product, broker (from selected Sauda)
- **Child Table:** deductions (Inward Deduction records)

### **Calculations to Implement**

#### **1. Weight Calculations**
1. **net_weight = gross_weight - vehicle_weight**

#### **2. Financial Calculations**
2. **total_amount = (net_weight / 1000) × rate_per_ton** (convert kg to tons)
3. **total_deductions = sum of all amounts in deductions child table**
4. **net_amount = total_amount - total_deductions**

#### **3. Tax Calculations**
5. **gst_amount = net_amount × (cgst_percent + sgst_percent + igst_percent) / 100**
6. **tcs_amount = net_amount × tcs_percent / 100**
7. **tds_amount = net_amount × tds_percent / 100**
8. **broker_commission_amount = net_amount × broker_commission_percent / 100**

#### **4. Final Calculation**
9. **final_amount = net_amount + gst_amount + tcs_amount - tds_amount**

#### **5. Auto-population from Sauda**
- When sauda is selected, auto-fill: customer, warehouse, product, broker, rate_per_ton

### **Requirements**
- **Client-side:** Real-time updates when input fields change
- **Server-side:** Minimal validation only (positive values)
- **Validation:** All weights and percentages must be >= 0
- **Zero Handling:** Calculations should work with zero values
- **Child Table:** Auto-calculate total_deductions when deductions table changes
- **Sauda Integration:** Auto-populate fields when Sauda is selected
- **Draft State:** All calculated values should update in draft mode

### **Field Triggers Required**
- **gross_weight, vehicle_weight** → Calculate net_weight
- **net_weight, rate_per_ton** → Calculate total_amount
- **deductions child table** → Calculate total_deductions
- **total_amount, total_deductions** → Calculate net_amount
- **net_amount, cgst_percent, sgst_percent, igst_percent** → Calculate gst_amount
- **net_amount, tcs_percent** → Calculate tcs_amount
- **net_amount, tds_percent** → Calculate tds_amount
- **net_amount, broker_commission_percent** → Calculate broker_commission_amount
- **sauda** → Auto-populate customer, warehouse, product, broker, rate_per_ton

## **SUCCESS METRICS**

### **Working Implementation Should:**
- Calculate net_weight in real-time when weights change
- Calculate total_amount when weight or rate changes
- Auto-calculate total_deductions when child table is modified
- Calculate all tax amounts when percentages change
- Calculate final_amount incorporating all components
- Auto-populate fields when Sauda is selected
- Handle zero values without errors
- Submit forms without hanging/timeout
- Work on both new and edit forms
- Export properly to fixtures
- Update pending quantities in linked Sauda record