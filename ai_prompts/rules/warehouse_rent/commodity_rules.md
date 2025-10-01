Create a Frappe v15 DocType for Commodity with these specifications:

**Basic Configuration:**
- DocType Name: Commodity
- Module: Warehouse Rent
- Naming: Auto-naming with series "COMM-.YYYY.-.####"
- Track Changes: Yes
- Is Submittable: No
- Custom: Yes

**Fields (in exact order):**

1. **naming_series** (Select)
   - Hidden: Yes
   - Default: "COMM-.YYYY.-.####"

2. **Section Break:** Commodity Information

3. **commodity_name** (Data)
   - Label: Commodity Name
   - Mandatory: Yes
   - Length: 140
   - In List View: Yes

4. **description** (Small Text)
   - Label: Description
   - Mandatory: No
   - Rows: 3

5. **Column Break**

6. **hsn_code** (Data)
   - Label: HSN Code
   - Mandatory: No
   - Length: 8
   - In List View: Yes

7. **category** (Select)
   - Label: Category
   - Mandatory: No
   - Options: Grains, Pulses, Seeds, Other
   - In List View: Yes

8. **Section Break:** Bag Configurations

9. **bag_configurations** (Table)
   - Label: Bag Configurations
   - Mandatory: Yes
   - Options: Commodity Bag Configuration

10. **Section Break:** Status

11. **status** (Select)
    - Label: Status
    - Mandatory: Yes
    - Options: Active, Inactive
    - Default: Active
    - In List View: Yes

**Additional Settings:**
- Title Field: commodity_name
- Search Fields: commodity_name, hsn_code, category
- Sort Field: modified
- Sort Order: DESC

**Permissions:**
- System Manager: All rights
- Kisan Admin: Create, Read, Write
- Kisan Accountant: Read, Write
- Kisan Operator: Read

**File Location:**
apps/kisan_warehouse/kisan_warehouse/warehouse_rent/doctype/commodity/

Create:
1. commodity.json (DocType definition)
2. commodity.py (Minimal server script: class Commodity(Document): pass)
3. __init__.py (empty file)

Child DocType: Commodity Bag Configuration
Create a Frappe v15 Child DocType with these specifications:

**Basic Configuration:**
- DocType Name: Commodity Bag Configuration
- Module: Warehouse Rent
- Is Child Table: Yes
- Parent DocType: Commodity
- Custom: Yes

**Fields (in exact order):**

1. **bag_weight** (Select)
   - Label: Bag Weight (Kg)
   - Mandatory: Yes
   - Options: 5, 10, 15, 20, 25, 30, 50 (one per line)
   - In List View: Yes

2. **rate_per_bag_per_day** (Currency)
   - Label: Rate per Bag per Day (₹)
   - Mandatory: Yes
   - Precision: 2
   - In List View: Yes


**File Location:**
apps/kisan_warehouse/kisan_warehouse/warehouse_rent/doctype/commodity_bag_configuration/

Create:
1. commodity_bag_configuration.json (DocType definition)
2. commodity_bag_configuration.py (class CommodityBagConfiguration(Document): pass)
3. __init__.py (empty file)


## 📋 FIELD REFERENCE TABLE

**Parent: Commodity**

| Field Name | Label | Type | Required | Length | Options/Default |
|------------|-------|------|----------|--------|-----------------|
| commodity_name | Commodity Name | Data | Yes | 140 | - |
| description | Description | Small Text | No | - | 3 rows |
| hsn_code | HSN Code | Data | No | 8 | - |
| category | Category | Select | No | - | Grains, Pulses, Seeds, Other |
| bag_configurations | Bag Configurations | Table | Yes | - | Commodity Bag Configuration |
| status | Status | Select | Yes | - | Active, Inactive (Default: Active) |

**Child: Commodity Bag Configuration**

| Field Name | Label | Type | Required | Options |
|------------|-------|------|----------|---------|
| bag_weight | Bag Weight (Kg) | Select | Yes | 5, 10, 15, 20, 25, 30, 50 |
| rate_per_bag_per_day | Rate per Bag per Day (₹) | Currency | Yes | Precision: 2 |


⚙️ POST-CREATION COMMANDS
Run these commands after both DocTypes are created:
bash# 1. Export fixtures
bench --site kisan-new.localhost export-fixtures

# 2. Migrate database
bench --site kisan-new.localhost migrate

# 3. Reload DocTypes
bench --site kisan-new.localhost reload-doctype "Commodity"
bench --site kisan-new.localhost reload-doctype "Commodity Bag Configuration"

# 4. Clear cache
bench --site kisan-new.localhost clear-cache

# 5. Build assets
bench build --app kisan_warehouse

# 6. Restart
bench restart

✅ TESTING CHECKLIST
After creation, verify:

 Commodity DocType appears in Warehouse Rent module
 Commodity Bag Configuration child table created
 Naming series generates COMM-2025-0001 format
 Can create new Commodity record
 Child table shows with "Add Row" button
 Bag weight dropdown shows all 7 options
 Rate field accepts currency with 2 decimals
 Status defaults to "Active"
 Can save commodity with bag configurations
 Search by name/HSN works


# Commodity DocType Scripts

## **IMPLEMENTATION PROMPT TEMPLATE**

```
I need to implement client and server scripts for the Commodity DocType in our Kisan Warehouse Frappe app.

**CRITICAL REQUIREMENTS:**
1. Use ONLY Client Script DocType (created via bench console) 
2. Server script should be minimal: `class Commodity(Document): pass`
3. All calculations must be client-side only
4. No server-side validation that could cause database locks
5. Follow Frappe v15 standards

**Business Logic:**
[See calculations below]

**Implementation Steps:**
1. First implement basic bag configuration validation
2. Test thoroughly before adding validations
3. Export fixtures after each working change
4. Use bench console for Client Script creation
5. Keep server script minimal to avoid timeout issues

**Reference:** Use the working Product master implementations as template.
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
bench --site kisan-new.localhost reload-doctype "Commodity"

# 4. Clear cache
bench --site kisan-new.localhost clear-cache

# 5. Build assets (if you added/modified JS/CSS)
bench build --app kisan_warehouse

# 6. Restart bench (if needed)
bench restart
```

## **LESSONS LEARNED - WHAT NOT TO DO**

### **Common Mistakes to Avoid:**
- Don't add complex server-side validation
- Don't skip export-fixtures after changes
- Don't ignore database lock errors
- Don't allow duplicate bag weights in configurations
- Don't allow zero or negative rates

### **What ALWAYS Works:**
- Use Client Script DocType via bench console
- Keep server scripts minimal: `class Commodity(Document): pass`
- Export fixtures after every change
- Test thoroughly before adding complexity
- Use system restart if you get lock timeouts
- Validate bag configurations for uniqueness and positive rates

## **BUSINESS LOGIC REQUIREMENTS**

### **Objective**
Manage agricultural commodity master with multiple bag weight configurations and daily storage rates for warehouse rental pricing.

### **Fields Involved**

#### **Parent DocType Fields:**
- **Input Fields:** commodity_name, description, hsn_code, category, status
- **Child Tables:** bag_configurations (Commodity Bag Configuration)

#### **Child Table Fields (Commodity Bag Configuration):**
- **Input Fields:** bag_weight, rate_per_bag_per_day
- **Validation Fields:** Uniqueness check for bag_weight per commodity

### **Validation Logic to Implement**

#### **1. Bag Configuration Validation**
1. **At Least One Configuration:** Commodity must have at least one bag configuration
2. **Unique Bag Weights:** No duplicate bag_weight values in bag_configurations child table
3. **Positive Rates:** rate_per_bag_per_day must be > 0
4. **Valid Bag Weights:** Only predefined values allowed (5, 10, 15, 20, 25, 30, 50 Kg)

#### **2. Commodity-Level Validation**
5. **Unique Commodity Name:** Prevent duplicate commodity names
6. **Status Management:** Default to 'Active'
7. **Category Assignment:** Optional but recommended for organization

### **Requirements**
- **Client-side:** Real-time validation of bag configurations
- **Server-side:** Minimal validation only (required fields, positive values)
- **Validation:** Prevent duplicate bag weights per commodity
- **Validation:** Ensure at least one bag configuration exists
- **Validation:** All rates must be positive values
- **User Experience:** Clear error messages for configuration issues
- **Draft State:** Allow saving with partial data in draft
- **Master Data:** Support for pricing and billing calculations

### **Field Triggers Required**

#### **Parent Field Triggers:**
- **commodity_name** → Check for duplicate commodity names
- **status** → Default to 'Active' for new records
- **bag_configurations child table changes** → Validate configuration rules

#### **Child Table Triggers (Bag Configurations):**
- **bag_weight** → Check for duplicates within same commodity
- **rate_per_bag_per_day** → Validate positive value and reasonable rate
- **Any child table modification** → Ensure at least one configuration exists

### **Key Implementation Notes**
- **Pricing Master:** Core data for rental billing calculations
- **Bag Weight Options:** Predefined standard weights (5, 10, 15, 20, 25, 30, 50 Kg)
- **Daily Rate Model:** Rate per bag per day for duration-based billing
- **Multi-Rate Support:** Different rates for different bag sizes
- **Configuration Flexibility:** Support multiple bag weights per commodity
- **Validation Focus:** Ensure data quality for accurate billing

## **SUCCESS METRICS**

### **Working Implementation Should:**
- Validate at least one bag configuration exists
- Prevent duplicate bag weights in configurations
- Validate all rates are positive values
- Restrict bag_weight to predefined options
- Check commodity name uniqueness
- Handle bag configuration additions/deletions
- Calculate effective rates for billing queries
- Submit forms without hanging/timeout
- Work on both new and edit forms
- Export properly to fixtures
- Support quick commodity search by name

## **SPECIFIC COMMODITY CONSIDERATIONS**

### **Agricultural Product Types:**
- **Grains:** Wheat, Rice, Corn, Barley
- **Pulses:** Lentils, Chickpeas, Beans
- **Seeds:** Various crop seeds
- **Category Flexibility:** Support custom categories

### **Bag Weight Standards:**
- **Standard Sizes:** 5, 10, 15, 20, 25, 30, 50 Kg
- **Industry Practice:** Common agricultural packaging standards
- **Storage Optimization:** Different sizes for different products
- **Rate Variation:** Typically smaller bags = higher per-kg rate

### **Pricing Strategy:**
- **Per Bag Per Day:** Standard billing model
- **Weight-Based Rates:** Different rates for different bag sizes
- **Seasonal Pricing:** May vary rates by season (optional)
- **Bulk Discounts:** Consider volume-based pricing (future enhancement)

### **HSN Code:**
- **Tax Classification:** For GST compliance
- **Optional Field:** Not mandatory for warehouse operations
- **Standard Codes:** Use government-defined HSN codes for agricultural products

## **VALIDATION RULES**

### **Must Have Validations:**
1. **Commodity Name:** Cannot be empty, should be unique
2. **Bag Configurations:** At least one configuration required
3. **Bag Weight:** Must be from predefined list (5, 10, 15, 20, 25, 30, 50)
4. **Rate per Bag:** Must be > 0
5. **Duplicate Check:** No duplicate bag_weight in same commodity
6. **Status:** Default to 'Active'

### **Business Logic Validations:**
1. **Rate Reasonableness:** Check if rate is within reasonable range (e.g., ₹1 to ₹100 per day)
2. **Rate Progression:** Optionally warn if larger bags have same/higher per-kg rate
3. **Configuration Completeness:** Suggest common bag sizes if only few configured
4. **Category Consistency:** Validate category matches commodity type

### **Optional Business Validations:**
1. **Market Rate Check:** Compare with average market rates
2. **Historical Rates:** Track rate changes over time
3. **Competitor Pricing:** Benchmark against competitor rates
4. **Profit Margin:** Ensure rates cover costs plus margin

## **BAG CONFIGURATION MANAGEMENT**

### **Configuration Structure:**
```
Commodity: Wheat
├── Bag Configuration 1: 25 Kg @ ₹2.50/day
├── Bag Configuration 2: 50 Kg @ ₹4.50/day
└── Bag Configuration 3: 100 Kg @ ₹8.00/day
```

### **Rate Calculation Logic:**
- **Per Bag Per Day:** Base unit for all calculations
- **Total Rent:** Bags × Rate × Days
- **Example:** 100 bags × ₹2.50/day × 30 days = ₹7,500

### **Configuration Best Practices:**
1. **Cover Common Sizes:** Include most frequently used bag weights
2. **Competitive Rates:** Price based on market and capacity
3. **Clear Differentiation:** Distinct rates for different weights
4. **Regular Review:** Update rates based on costs and demand

## **NAMING CONVENTION**

### **Auto-Naming:**
- **Series:** COMM-.YYYY.-.####
- **Example:** COMM-2025-0001
- **Uniqueness:** Ensured by naming series
- **Sequential:** Auto-incremented per year

## **USER INTERFACE CONSIDERATIONS**

### **Field Organization:**
- **Section 1:** Commodity Information (name, description, HSN, category)
- **Section 2:** Bag Configurations (child table)
- **Section 3:** Status

### **Child Table Display:**
- **Columns:** Bag Weight (Kg) | Rate per Bag per Day (₹)
- **Sorting:** Order by bag weight ascending
- **Quick Add:** Easy to add multiple configurations
- **Visual Validation:** Highlight duplicates or invalid rates

### **Field Behavior:**
- **Bag Weight:** Dropdown with predefined options
- **Rate Input:** Currency field with 2 decimal places
- **Real-time Validation:** Immediate duplicate detection
- **Smart Defaults:** Suggest standard rates based on commodity type

## **PERMISSIONS & SECURITY**

### **Role-Based Access:**
- **System Manager:** Full access (CRUD)
- **Kisan Admin:** Create, Read, Update (no delete)
- **Kisan Accountant:** Read, Update rates only
- **Kisan Operator:** Read only (use for transactions)

### **Rate Management:**
- **Rate Changes:** Track historical rate changes
- **Approval Workflow:** Optional approval for rate updates
- **Audit Trail:** Log who changed rates and when
- **Effective Dating:** Support future-dated rate changes

## **PRICING STRATEGY GUIDELINES**

### **Rate Setting Factors:**
1. **Storage Costs:** Rent, utilities, maintenance
2. **Operational Costs:** Staff, security, insurance
3. **Market Rates:** Competitor pricing
4. **Demand:** Seasonal variations
5. **Commodity Value:** Higher value = higher rates
6. **Bag Size:** Smaller bags = higher per-kg rate

### **Rate Formula Example:**
```
Base Rate = Fixed Cost per sqft ÷ Bags per sqft
Size Adjustment = Base Rate × Size Factor
Final Rate = Size Adjustment × Market Factor
```

### **Typical Rate Ranges (Sample):**
- **Small Bags (5-15 Kg):** ₹1.50 - ₹3.00 per day
- **Medium Bags (20-30 Kg):** ₹2.50 - ₹5.00 per day
- **Large Bags (50+ Kg):** ₹4.00 - ₹8.00 per day

## **DATA QUALITY CHECKS**

### **Pre-Save Validation:**
1. Check for duplicate commodity names
2. Verify at least one bag configuration
3. Validate no duplicate bag weights
4. Ensure all rates are positive
5. Verify bag weights are from allowed list

### **Warning Messages:**
1. "This commodity already exists"
2. "Add at least one bag configuration"
3. "Duplicate bag weight detected"
4. "Rate must be greater than zero"
5. "Select bag weight from dropdown"