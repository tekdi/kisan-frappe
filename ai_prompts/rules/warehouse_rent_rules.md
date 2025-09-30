Warehouse Rent Module Scripts
IMPLEMENTATION PROMPT TEMPLATE
I need to implement client and server scripts for the Warehouse Rent Module DocTypes in our Kisan Warehouse Frappe app.

**CRITICAL REQUIREMENTS:**
1. Use ONLY Client Script DocType (created via bench console) - DO NOT create .js files
2. Server script should be minimal: `class [DocTypeName](Document): pass`
3. All calculations must be client-side only
4. No server-side validation that could cause database locks
5. Follow Frappe v15 standards

**Business Logic:**
[See calculations below for each DocType]

**Implementation Steps:**
1. First implement basic calculations
2. Test thoroughly before adding validations
3. Export fixtures after each working change
4. Use bench console for Client Script creation
5. Keep server script minimal to avoid timeout issues

**Reference:** Use the working Sauda, Inward, and Outward implementations as template.
Project Reference
Use project context from ai_prompts/kisan_warehouse_project_overview.md
COMPLETE COMMAND CHECKLIST
After ANY Changes (Drag-Drop OR Code):
# 1. Export all fixtures (ALWAYS do this first)
bench --site kisan.local export-fixtures

# 2. Migrate changes to database
bench --site kisan.local migrate

# 3. Reload specific DocType (if you modified it)
bench --site kisan.local reload-doctype "Inward Aawak"
bench --site kisan.local reload-doctype "Outward Jawak"
bench --site kisan.local reload-doctype "Storage Customer"
bench --site kisan.local reload-doctype "Commodity"
bench --site kisan.local reload-doctype "Godown"

# 4. Clear cache
bench --site kisan.local clear-cache

# 5. Build assets (if you added/modified JS/CSS)
bench build --app kisan_warehouse

# 6. Restart bench (if needed)
bench restart
LESSONS LEARNED - WHAT NOT TO DO
Common Mistakes to Avoid:
Don't create separate .js files initially
Don't add complex server-side validation
Don't skip export-fixtures after changes
Don't ignore database lock errors
Don't add client-side validate() functions that throw errors
Don't use complex server-side calculations in validate() method
Don't allocate more bags than chamber capacity
Don't allow release of more bags than stored
What ALWAYS Works:
Use Client Script DocType via bench console
Keep server scripts minimal: class [DocTypeName](Document): pass
Export fixtures after every change
Test thoroughly before adding complexity
Use system restart if you get lock timeouts
Handle zero values in calculations (use >= 0 instead of > 0)
Validate chamber capacity and bag allocations
BUSINESS LOGIC REQUIREMENTS
:package: INWARD AAWAK BUSINESS LOGIC
Objective
Manage incoming agricultural goods with multi-chamber allocation and capacity tracking.
Fields Involved
Input Fields: aawak_date, vehicle_number, total_bags, bag_weight, notes
Auto-populated Fields: bag_type details from selected commodity
Calculated Fields: total_weight
Child Tables: chamber_allocations
Calculations to Implement
total_weight = total_bags * bag_weight
Chamber Allocation Validation: SUM(bags_allocated) = total_bags
Chamber Capacity Check: bags_allocated ≤ chamber.max_capacity
Auto-population Logic
When commodity and bag_type selected → Auto-fill bag_weight from commodity configuration
When godown selected → Show available floors and chambers for allocation
Field Triggers Required
total_bags, bag_weight → Calculate total_weight
chamber_allocations child table → Validate total allocation = total_bags
commodity, bag_type → Auto-populate bag_weight
godown → Filter available floors and chambers

:outbox_tray: OUTWARD JAWAK BUSINESS LOGIC
Objective
Calculate storage rent based on duration and process goods release with automated billing.
Fields Involved
Input Fields: jawak_date, vehicle_number, additional_charges, discount, payment_method, payment_reference, notes
Auto-populated Fields: storage_customer, commodity, godown, floor, chamber (from Aawak)
Calculated Fields: total_bags, released_bags, total_weight, released_bag_weight, total_amount, net_amount
Child Tables: bag_details
Calculations to Implement
Child Table Calculations (Bag Details):
total_days = (jawak_date - aawak_date) in days (auto-calculated)
total_amount = release_bags × rate × total_days (per row)
Parent Summary Calculations:
total_bags = SUM(total_bags) from bag_details child table
released_bags = SUM(release_bags) from bag_details child table
total_weight = SUM(total_bags × bag_weight) from bag_details
released_bag_weight = SUM(release_bags × bag_weight) from bag_details
total_amount = SUM(total_amount) from bag_details child table
net_amount = total_amount + additional_charges - discount
Auto-population from Aawak
When aawak_reference selected → Auto-fill all customer, commodity, godown details
Auto-populate bag_details child table with:
bag_type (from Aawak commodity config)
total_bags (from Aawak)
rate (from commodity bag configuration)
release_bags = total_bags (default full release, editable)
Field Triggers Required
Parent Field Triggers:
aawak_reference → Auto-populate all fields and bag_details child table
jawak_date → Recalculate total_days for all child rows
bag_details child table changes → Recalculate all parent totals
total_amount, additional_charges, discount → Calculate net_amount
Child Table Triggers (Bag Details):
release_bags → Recalculate total_amount for that row
jawak_date change → Recalculate total_days and total_amount
Any child table modification → Recalculate parent totals

:ear_of_rice: COMMODITY BUSINESS LOGIC
Objective
Manage agricultural commodity master with bag weight configurations and daily rates.
Fields Involved
Input Fields: commodity_name, description, hsn_code, category, status
Child Tables: bag_configurations
Child Table (Bag Configurations):
bag_weight: Select from predefined options (5,10,15,20,25,30,50 Kg)
rate_per_bag_per_day: Daily storage rate for each bag weight
Validation Rules:
Each commodity should have at least one bag configuration
Bag weight and rate must be > 0
No duplicate bag weights for same commodity

:office: GODOWN BUSINESS LOGIC
Objective
Manage hierarchical godown structure with floors and chambers capacity tracking.
Fields Involved
Input Fields: godown_name, godown_code, address details, total_area, contact details, status
Child Tables: warehouse_floors
Child Table Hierarchy:
Warehouse Floor → Contains multiple Floor Chambers
Floor Chamber → Individual storage units with capacity
Capacity Management:
Track chamber occupancy based on Aawak allocations
Update chamber status (Available/Occupied/Reserved/Maintenance)
Calculate total godown utilization

:bust_in_silhouette: STORAGE CUSTOMER BUSINESS LOGIC
Objective
Simple customer master for rental customers with basic contact information.
Fields Involved
Input Fields: customer_type, name fields, address details, contact details, status
Naming Logic:
Auto-generate full_name from first_name + middle_name + last_name
Use nick_name for display if available

ROUNDING REQUIREMENTS
Financial Fields:
ALL currency fields rounded to 2 decimal places using Math.round(value * 100) / 100
Applied to: rate_per_bag_per_day, total_amount, additional_charges, discount, net_amount
Days calculation: Round to nearest whole day for billing
Weight calculations: Round to 2 decimal places
VALIDATION RULES
Inward Aawak Validations:
Chamber Allocation: SUM(bags_allocated) must equal total_bags
Chamber Capacity: bags_allocated ≤ max_capacity for each chamber
Positive Values: total_bags, bag_weight must be > 0
Date Logic: aawak_date cannot be in future
Outward Jawak Validations:
Release Quantity: release_bags ≤ total_bags for each bag type
Date Logic: jawak_date ≥ aawak_date (cannot release before storage)
Payment Required: payment_method required when status = 'Paid'
Chamber Availability: Update chamber status when bags released
Commodity Validations:
Bag Configuration: At least one bag configuration required
Unique Bag Weights: No duplicate bag weights per commodity
Positive Rates: rate_per_bag_per_day must be > 0
Godown Validations:
Unique Codes: godown_code must be unique
Chamber Names: chamber_name + chamber_code must be unique per floor
Capacity Logic: max_capacity must be > 0 if specified
SUCCESS METRICS
Working Implementation Should:
Inward Aawak:
Calculate total_weight when bags/weight changes
Validate chamber allocation totals
Check chamber capacity limits
Auto-populate bag details from commodity
Support multi-chamber storage allocation
Update chamber occupancy status
Outward Jawak:
Auto-populate all fields when Aawak selected
Calculate storage days automatically
Calculate rent per bag type in real-time
Sum all totals when child table changes
Calculate net amount with charges/discounts
Validate release quantities against stored quantities
Update chamber availability when goods released
Round all financial calculations to 2 decimal places
Master DocTypes:
Support hierarchical godown structure
Manage commodity bag configurations
Track customer information properly
Export properly to fixtures
Work on both new and edit forms
SPECIFIC WAREHOUSE RENT CONSIDERATIONS
Duration-Based Billing:
Storage Days: Calculate exact days between Aawak and Jawak dates
Rate Application: Different rates for different bag weights
Partial Release: Support releasing only some bags while keeping others in storage
Multi-bag Types: Single Aawak can have multiple bag weight types
Chamber Management:
Multi-chamber Storage: Single Aawak can span multiple chambers
Capacity Tracking: Real-time chamber occupancy updates
Availability Status: Automatic status updates when chambers allocated/released
Floor Organization: Support multiple floors per godown
Operator Workflow:
Simple Entry: Minimize data entry with smart auto-population
Aawak Reference: Single field entry triggers complete form population
Editable Defaults: Pre-fill but allow operator modifications
Payment Processing: Support multiple payment methods with references
Business Intelligence:
Storage Utilization: Track godown, floor, chamber occupancy
Revenue Calculation: Automated rent calculations based on duration
Customer Analytics: Storage patterns and payment history
Commodity Insights: Popular bag sizes and storage duration trends
INTEGRATION POINTS
With Main Warehouse System:
Customer Sync: Storage customers may link to main customer master
Commodity Mapping: Agricultural commodities may link to main product catalog
Payment Integration: Payment records may sync with main accounting
Reporting Requirements:
Storage Reports: Chamber occupancy, utilization rates
Financial Reports: Rent collection, pending payments
Customer Reports: Storage history, payment patterns
Commodity Reports: Storage trends by product type
DATA FLOW SUMMARY
Storage Cycle:
Customer Registration → Storage Customer master
Commodity Setup → Commodity with bag configurations
Godown Preparation → Godown with floors and chambers
Goods Receipt → Inward Aawak with chamber allocation
Storage Period → Duration tracking
Goods Release → Outward Jawak with rent calculation
Payment Settlement → Payment processing and receipt
Key Relationships:
# Warehouse Rent Module Scripts

## **IMPLEMENTATION PROMPT TEMPLATE**

```
I need to implement client and server scripts for the Warehouse Rent Module DocTypes in our Kisan Warehouse Frappe app.

**CRITICAL REQUIREMENTS:**
1. Use ONLY Client Script DocType (created via bench console) - DO NOT create .js files
2. Server script should be minimal: `class [DocTypeName](Document): pass`
3. All calculations must be client-side only
4. No server-side validation that could cause database locks
5. Follow Frappe v15 standards

**Business Logic:**
[See calculations below for each DocType]

**Implementation Steps:**
1. First implement basic calculations
2. Test thoroughly before adding validations
3. Export fixtures after each working change
4. Use bench console for Client Script creation
5. Keep server script minimal to avoid timeout issues

**Reference:** Use the working Sauda, Inward, and Outward implementations as template.
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
bench --site kisan.local reload-doctype "Inward Aawak"
bench --site kisan.local reload-doctype "Outward Jawak"
bench --site kisan.local reload-doctype "Storage Customer"
bench --site kisan.local reload-doctype "Commodity"
bench --site kisan.local reload-doctype "Godown"

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
- Don't allocate more bags than chamber capacity
- Don't allow release of more bags than stored

### **What ALWAYS Works:**
- Use Client Script DocType via bench console
- Keep server scripts minimal: `class [DocTypeName](Document): pass`
- Export fixtures after every change
- Test thoroughly before adding complexity
- Use system restart if you get lock timeouts
- Handle zero values in calculations (use >= 0 instead of > 0)
- Validate chamber capacity and bag allocations

## **BUSINESS LOGIC REQUIREMENTS**

### **:package: INWARD AAWAK BUSINESS LOGIC**

#### **Objective**
Manage incoming agricultural goods with multi-chamber allocation and capacity tracking.

#### **Fields Involved**
- **Input Fields:** aawak_date, vehicle_number, total_bags, bag_weight, notes
- **Auto-populated Fields:** bag_type details from selected commodity
- **Calculated Fields:** total_weight
- **Child Tables:** chamber_allocations

#### **Calculations to Implement**
1. **total_weight = total_bags * bag_weight**
2. **Chamber Allocation Validation:** SUM(bags_allocated) = total_bags
3. **Chamber Capacity Check:** bags_allocated ≤ chamber.max_capacity

#### **Auto-population Logic**
- When commodity and bag_type selected → Auto-fill bag_weight from commodity configuration
- When godown selected → Show available floors and chambers for allocation

#### **Field Triggers Required**
- **total_bags, bag_weight** → Calculate total_weight
- **chamber_allocations child table** → Validate total allocation = total_bags
- **commodity, bag_type** → Auto-populate bag_weight
- **godown** → Filter available floors and chambers

---

### **:outbox_tray: OUTWARD JAWAK BUSINESS LOGIC**

#### **Objective**
Calculate storage rent based on duration and process goods release with automated billing.

#### **Fields Involved**
- **Input Fields:** jawak_date, vehicle_number, additional_charges, discount, payment_method, payment_reference, notes
- **Auto-populated Fields:** storage_customer, commodity, godown, floor, chamber (from Aawak)
- **Calculated Fields:** total_bags, released_bags, total_weight, released_bag_weight, total_amount, net_amount
- **Child Tables:** bag_details

#### **Calculations to Implement**

##### **Child Table Calculations (Bag Details):**
1. **total_days = (jawak_date - aawak_date) in days** (auto-calculated)
2. **total_amount = release_bags × rate × total_days** (per row)

##### **Parent Summary Calculations:**
3. **total_bags = SUM(total_bags)** from bag_details child table
4. **released_bags = SUM(release_bags)** from bag_details child table  
5. **total_weight = SUM(total_bags × bag_weight)** from bag_details
6. **released_bag_weight = SUM(release_bags × bag_weight)** from bag_details
7. **total_amount = SUM(total_amount)** from bag_details child table
8. **net_amount = total_amount + additional_charges - discount**

#### **Auto-population from Aawak**
- When aawak_reference selected → Auto-fill all customer, commodity, godown details
- Auto-populate bag_details child table with:
  - bag_type (from Aawak commodity config)
  - total_bags (from Aawak)
  - rate (from commodity bag configuration)
  - release_bags = total_bags (default full release, editable)

#### **Field Triggers Required**

##### **Parent Field Triggers:**
- **aawak_reference** → Auto-populate all fields and bag_details child table
- **jawak_date** → Recalculate total_days for all child rows
- **bag_details child table changes** → Recalculate all parent totals
- **total_amount, additional_charges, discount** → Calculate net_amount

##### **Child Table Triggers (Bag Details):**
- **release_bags** → Recalculate total_amount for that row
- **jawak_date change** → Recalculate total_days and total_amount
- **Any child table modification** → Recalculate parent totals

---

### **:ear_of_rice: COMMODITY BUSINESS LOGIC**

#### **Objective**
Manage agricultural commodity master with bag weight configurations and daily rates.

#### **Fields Involved**
- **Input Fields:** commodity_name, description, hsn_code, category, status
- **Child Tables:** bag_configurations

#### **Child Table (Bag Configurations):**
- **bag_weight:** Select from predefined options (5,10,15,20,25,30,50 Kg)
- **rate_per_bag_per_day:** Daily storage rate for each bag weight

#### **Validation Rules:**
- Each commodity should have at least one bag configuration
- Bag weight and rate must be > 0
- No duplicate bag weights for same commodity

---

### **:office: GODOWN BUSINESS LOGIC**

#### **Objective**
Manage hierarchical godown structure with floors and chambers capacity tracking.

#### **Fields Involved**
- **Input Fields:** godown_name, godown_code, address details, total_area, contact details, status
- **Child Tables:** warehouse_floors

#### **Child Table Hierarchy:**
- **Warehouse Floor** → Contains multiple Floor Chambers
- **Floor Chamber** → Individual storage units with capacity

#### **Capacity Management:**
- Track chamber occupancy based on Aawak allocations
- Update chamber status (Available/Occupied/Reserved/Maintenance)
- Calculate total godown utilization

---

### **:bust_in_silhouette: STORAGE CUSTOMER BUSINESS LOGIC**

#### **Objective**
Simple customer master for rental customers with basic contact information.

#### **Fields Involved**
- **Input Fields:** customer_type, name fields, address details, contact details, status

#### **Naming Logic:**
- Auto-generate full_name from first_name + middle_name + last_name
- Use nick_name for display if available

---

## **ROUNDING REQUIREMENTS**

### **Financial Fields:**
- **ALL currency fields** rounded to 2 decimal places using Math.round(value * 100) / 100
- **Applied to:** rate_per_bag_per_day, total_amount, additional_charges, discount, net_amount
- **Days calculation:** Round to nearest whole day for billing
- **Weight calculations:** Round to 2 decimal places

## **VALIDATION RULES**

### **Inward Aawak Validations:**
1. **Chamber Allocation:** SUM(bags_allocated) must equal total_bags
2. **Chamber Capacity:** bags_allocated ≤ max_capacity for each chamber
3. **Positive Values:** total_bags, bag_weight must be > 0
4. **Date Logic:** aawak_date cannot be in future

### **Outward Jawak Validations:**
1. **Release Quantity:** release_bags ≤ total_bags for each bag type
2. **Date Logic:** jawak_date ≥ aawak_date (cannot release before storage)
3. **Payment Required:** payment_method required when status = 'Paid'
4. **Chamber Availability:** Update chamber status when bags released

### **Commodity Validations:**
1. **Bag Configuration:** At least one bag configuration required
2. **Unique Bag Weights:** No duplicate bag weights per commodity
3. **Positive Rates:** rate_per_bag_per_day must be > 0

### **Godown Validations:**
1. **Unique Codes:** godown_code must be unique
2. **Chamber Names:** chamber_name + chamber_code must be unique per floor
3. **Capacity Logic:** max_capacity must be > 0 if specified

## **SUCCESS METRICS**

### **Working Implementation Should:**

#### **Inward Aawak:**
- Calculate total_weight when bags/weight changes
- Validate chamber allocation totals
- Check chamber capacity limits
- Auto-populate bag details from commodity
- Support multi-chamber storage allocation
- Update chamber occupancy status

#### **Outward Jawak:**
- Auto-populate all fields when Aawak selected
- Calculate storage days automatically
- Calculate rent per bag type in real-time
- Sum all totals when child table changes
- Calculate net amount with charges/discounts
- Validate release quantities against stored quantities
- Update chamber availability when goods released
- Round all financial calculations to 2 decimal places

#### **Master DocTypes:**
- Support hierarchical godown structure
- Manage commodity bag configurations
- Track customer information properly
- Export properly to fixtures
- Work on both new and edit forms

## **SPECIFIC WAREHOUSE RENT CONSIDERATIONS**

### **Duration-Based Billing:**
- **Storage Days:** Calculate exact days between Aawak and Jawak dates
- **Rate Application:** Different rates for different bag weights
- **Partial Release:** Support releasing only some bags while keeping others in storage
- **Multi-bag Types:** Single Aawak can have multiple bag weight types

### **Chamber Management:**
- **Multi-chamber Storage:** Single Aawak can span multiple chambers
- **Capacity Tracking:** Real-time chamber occupancy updates
- **Availability Status:** Automatic status updates when chambers allocated/released
- **Floor Organization:** Support multiple floors per godown

### **Operator Workflow:**
- **Simple Entry:** Minimize data entry with smart auto-population
- **Aawak Reference:** Single field entry triggers complete form population
- **Editable Defaults:** Pre-fill but allow operator modifications
- **Payment Processing:** Support multiple payment methods with references

### **Business Intelligence:**
- **Storage Utilization:** Track godown, floor, chamber occupancy
- **Revenue Calculation:** Automated rent calculations based on duration
- **Customer Analytics:** Storage patterns and payment history
- **Commodity Insights:** Popular bag sizes and storage duration trends

## **INTEGRATION POINTS**

### **With Main Warehouse System:**
- **Customer Sync:** Storage customers may link to main customer master
- **Commodity Mapping:** Agricultural commodities may link to main product catalog
- **Payment Integration:** Payment records may sync with main accounting

### **Reporting Requirements:**
- **Storage Reports:** Chamber occupancy, utilization rates
- **Financial Reports:** Rent collection, pending payments
- **Customer Reports:** Storage history, payment patterns
- **Commodity Reports:** Storage trends by product type

## **DATA FLOW SUMMARY**

### **Storage Cycle:**
1. **Customer Registration** → Storage Customer master
2. **Commodity Setup** → Commodity with bag configurations
3. **Godown Preparation** → Godown with floors and chambers
4. **Goods Receipt** → Inward Aawak with chamber allocation
5. **Storage Period** → Duration tracking
6. **Goods Release** → Outward Jawak with rent calculation
7. **Payment Settlement** → Payment processing and receipt

### **Key Relationships:**
- **Storage Customer** ← **Inward Aawak** ← **Outward Jawak**
- **Commodity** ← **Inward Aawak** ← **Outward Jawak**  
- **Godown** → **Floors** → **Chambers** ← **Inward Aawak**
- **Inward Aawak** → **Outward Jawak** (Rent Calculation)Storage Customer ← Inward Aawak ← Outward Jawak
Commodity ← Inward Aawak ← Outward Jawak
Godown → Floors → Chambers ← Inward Aawak
Inward Aawak → Outward Jawak (Rent Calculation)