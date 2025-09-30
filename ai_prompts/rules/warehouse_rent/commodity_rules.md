# Commodity DocType Scripts

## **IMPLEMENTATION PROMPT TEMPLATE**

```
I need to implement client and server scripts for the Commodity DocType in our Kisan Warehouse Frappe app.

**CRITICAL REQUIREMENTS:**
1. Use ONLY Client Script DocType (created via bench console) - DO NOT create .js files
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
- Don't create separate .js files initially
- Don't add complex server-side validation
- Don't skip export-fixtures after changes
- Don't ignore database lock errors
- Don't add client-side validate() functions that throw errors
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

## **INTEGRATION POINTS**

### **With Inward Aawak:**
- **Bag Type Selection:** Operator selects from configured bag weights
- **Weight Auto-fill:** Auto-populate bag_weight from selection
- **Rate Reference:** Store rate for future Jawak billing

### **With Outward Jawak:**
- **Rate Retrieval:** Pull rate_per_bag_per_day for rent calculation
- **Billing Accuracy:** Ensure correct rate applied per bag type
- **Duration Calculation:** Rate × Days = rent per bag

### **With Reporting:**
- **Popular Commodities:** Track most stored products
- **Revenue by Commodity:** Calculate earnings per product type
- **Rate Analysis:** Compare rates across commodities
- **Storage Trends:** Monitor commodity storage patterns

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
- **Administrator:** Create, Read, Update (no delete)
- **Accountant:** Read, Update rates only
- **Operator:** Read only (use for transactions)

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