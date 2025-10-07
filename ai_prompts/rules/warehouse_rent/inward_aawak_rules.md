
# Inward Aawak - AI DocType Creation Guide

## **Parent DocType: Inward Aawak**

```
Create a Frappe v15 DocType for Inward Aawak with these specifications:

**Basic Configuration:**
- DocType Name: Inward Aawak
- Module: Warehouse Rent
- Naming: Auto-naming with series "AAWAK-.YYYY.-.####"
- Track Changes: Yes
- Is Submittable: Yes
- Custom: Yes

**Fields (in exact order):**

1. **naming_series** (Select)
   - Hidden: Yes
   - Default: "AAWAK-.YYYY.-.####"

2. **Section Break:** Basic Information

3. **aawak_date** (Datetime)
   - Label: Aawak Date
   - Mandatory: Yes
   - Default: Now
   - In List View: Yes

4. **Column Break**

5. **vehicle_number** (Data)
   - Label: Vehicle Number
   - Mandatory: Yes
   - Length: 20
   - In List View: Yes

6. **Section Break:** Customer & Product

7. **storage_customer** (Link)
   - Label: Storage Customer
   - Mandatory: Yes
   - Options: Storage Customer
   - In List View: Yes

8. **commodity** (Link)
   - Label: Commodity
   - Mandatory: Yes
   - Options: Commodity

9. **Column Break**

10. **bag_type** (Link)
    - Label: Bag Type
    - Mandatory: Yes
    - Options: Commodity Bag Configuration
    - In List View: Yes
    - Description: From Commodity bag config

11. **Section Break:** Quantity Details

12. **total_bags** (Int)
    - Label: Total Bags
    - Mandatory: Yes
    - In List View: Yes

13. **bag_weight** (Float)
    - Label: Bag Weight (Kg)
    - Mandatory: Yes
    - Read Only: Yes
    - Precision: 2
    - Description: Auto-filled from Commodity

14. **Column Break**

15. **total_weight** (Float)
    - Label: Total Weight (Kg)
    - Mandatory: Yes
    - Read Only: Yes
    - Precision: 2
    - Description: Calculated: total_bags × bag_weight

16. **Section Break:** Storage Allocation

17. **godown** (Link)
    - Label: Godown
    - Mandatory: Yes
    - Options: Godown

18. **chamber_allocations** (Table)
    - Label: Chamber Allocations
    - Mandatory: Yes
    - Options: Chamber Allocation

19. **Section Break:** Additional

20. **notes** (Small Text)
    - Label: Notes
    - Mandatory: No
    - Rows: 3

21. **Column Break**

22. **status** (Select)
    - Label: Status
    - Mandatory: Yes
    - Options: Draft, Active, Completed
    - Default: Draft
    - In List View: Yes

**Additional Settings:**
- Title Field: naming_series
- Search Fields: storage_customer, commodity, vehicle_number
- Sort Field: aawak_date
- Sort Order: DESC

**Permissions:**
- System Manager: All rights
- Kisan Admin: Create, Read, Write, Submit
- Kisan Accountant: Create, Read, Write, Submit
- Kisan Operator: Create, Read, Write, Submit

**File Location:**
apps/kisan_warehouse/kisan_warehouse/warehouse_rent/doctype/inward_aawak/

Create:
1. inward_aawak.json (DocType definition)
2. inward_aawak.py (Minimal server script: class InwardAawak(Document): pass)
3. __init__.py (empty file)
```

---

## **Child DocType: Chamber Allocation**

```
Create a Frappe v15 Child DocType with these specifications:

**Basic Configuration:**
- DocType Name: Chamber Allocation
- Module: Warehouse Rent
- Is Child Table: Yes
- Parent DocType: Inward Aawak
- Custom: Yes

**Fields (in exact order):**

1. **floor** (Link)
   - Label: Floor
   - Mandatory: Yes
   - Options: Warehouse Floor
   - In List View: Yes

2. **chamber** (Link)
   - Label: Chamber
   - Mandatory: Yes
   - Options: Floor Chamber
   - In List View: Yes

3. **bags_allocated** (Int)
   - Label: Bags Allocated
   - Mandatory: Yes
   - In List View: Yes

4. **allocation_date** (Date)
   - Label: Allocation Date
   - Mandatory: Yes
   - Default: Today
   - In List View: Yes

**File Location:**
apps/kisan_warehouse/kisan_warehouse/warehouse_rent/doctype/chamber_allocation/

Create:
1. chamber_allocation.json (DocType definition)
2. chamber_allocation.py (class ChamberAllocation(Document): pass)
3. __init__.py (empty file)
```

---

## 📋 FIELD REFERENCE TABLE

**Parent: Inward Aawak**

| Field Name | Label | Type | Required | Read Only | Default | Options/Link |
|------------|-------|------|----------|-----------|---------|--------------|
| aawak_date | Aawak Date | Datetime | Yes | No | Now | - |
| vehicle_number | Vehicle Number | Data | Yes | No | - | Length: 20 |
| storage_customer | Storage Customer | Link | Yes | No | - | Storage Customer |
| commodity | Commodity | Link | Yes | No | - | Commodity |
| bag_type | Bag Type | Link | Yes | No | - | Commodity Bag Configuration |
| total_bags | Total Bags | Int | Yes | No | - | - |
| bag_weight | Bag Weight (Kg) | Float | Yes | Yes | - | Auto-filled |
| total_weight | Total Weight (Kg) | Float | Yes | Yes | - | Calculated |
| godown | Godown | Link | Yes | No | - | Godown |
| chamber_allocations | Chamber Allocations | Table | Yes | No | - | Chamber Allocation |
| notes | Notes | Small Text | No | No | - | 3 rows |
| status | Status | Select | Yes | No | Draft | Draft, Active, Completed |

**Child: Chamber Allocation**

| Field Name | Label | Type | Required | Default | Options/Link |
|------------|-------|------|----------|---------|--------------|
| floor | Floor | Link | Yes | - | Warehouse Floor |
| chamber | Chamber | Link | Yes | - | Floor Chamber |
| bags_allocated | Bags Allocated | Int | Yes | - | - |
| allocation_date | Allocation Date | Date | Yes | Today | - |

---

## ⚙️ POST-CREATION COMMANDS

Run these commands after both DocTypes are created:

```bash
# 1. Export fixtures
bench --site kisan-new.localhost export-fixtures

# 2. Migrate database
bench --site kisan-new.localhost migrate

# 3. Reload DocTypes
bench --site kisan-new.localhost reload-doctype "Inward Aawak"
bench --site kisan-new.localhost reload-doctype "Chamber Allocation"

# 4. Clear cache
bench --site kisan-new.localhost clear-cache

# 5. Build assets
bench build --app kisan_warehouse

# 6. Restart
bench restart
```

---

## ✅ TESTING CHECKLIST

After creation, verify:

- [ ] Inward Aawak DocType appears in Warehouse Rent module
- [ ] Chamber Allocation child table created
- [ ] Naming series generates AAWAK-2025-0001 format
- [ ] Can create new Inward Aawak record
- [ ] Is Submittable setting enabled (can save as Draft and Submit)
- [ ] aawak_date defaults to current datetime
- [ ] allocation_date defaults to today
- [ ] Chamber Allocations table shows with "Add Row" button
- [ ] bag_weight field is read-only
- [ ] total_weight field is read-only
- [ ] Status defaults to "Draft"
- [ ] Can link Storage Customer, Commodity, Godown
- [ ] bag_type shows Commodity Bag Configuration options
- [ ] Submit button appears after save

# Inward Aawak DocType Scripts

## **IMPLEMENTATION PROMPT TEMPLATE**

```
I need to implement client and server scripts for the Inward Aawak DocType in our Kisan Warehouse Frappe app.

**CRITICAL REQUIREMENTS:**
1. Server script should be minimal: `class InwardAawak(Document): pass`
2. All calculations must be client-side only
3. No server-side validation that could cause database locks
4. Follow Frappe v15 standards

**Business Logic:**
[See calculations below]

**Implementation Steps:**
1. First implement basic calculations
2. Test thoroughly before adding validations
3. Export fixtures after each working change
4. Use bench console for Client Script creation
5. Keep server script minimal to avoid timeout issues

**Reference:** Use the working Sauda and Inward implementations as template.
```

## **Project Reference**
Use project context from `ai_prompts/warehouse_rent_project_overview.md`

## **COMPLETE COMMAND CHECKLIST**

### **After ANY Changes (Drag-Drop OR Code):**
```bash
# 1. Export all fixtures (ALWAYS do this first)
bench --site kisan-new.localhost export-fixtures

# 2. Migrate changes to database
bench --site kisan.local migrate

# 3. Reload specific DocType (if you modified it)
bench --site kisan.local reload-doctype "Inward Aawak"

# 4. Clear cache
bench --site kisan.local clear-cache

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
- Don't add client-side validate() functions that throw errors
- Don't use complex server-side calculations in validate() method
- Don't allocate more bags than chamber capacity
- Don't allow chamber over-allocation

### **What ALWAYS Works:**
- Use Client Script DocType via bench console
- Keep server scripts minimal: `class InwardAawak(Document): pass`
- Export fixtures after every change
- Test thoroughly before adding complexity
- Use system restart if you get lock timeouts
- Handle zero values in calculations (use >= 0 instead of > 0)
- Validate chamber allocation totals match total bags

## **BUSINESS LOGIC REQUIREMENTS**

### **Objective**
Manage incoming agricultural goods receipt with multi-chamber storage allocation and capacity tracking for warehouse rental operations.

### **Fields Involved**

#### **Parent DocType Fields:**
- **Input Fields:** aawak_date, vehicle_number, total_bags, bag_weight, notes, status
- **Link Fields:** storage_customer, commodity, bag_type, godown
- **Calculated Fields:** total_weight
- **Child Tables:** chamber_allocations (Chamber Allocation)

#### **Child Table Fields (Chamber Allocation):**
- **Input Fields:** floor, chamber, bags_allocated, allocation_date
- **Auto Fields:** From chamber capacity validation

### **Calculations to Implement**

#### **1. Parent Weight Calculation**
1. **total_weight = total_bags * bag_weight**

#### **2. Child Table Validation**
2. **Total Allocation Check:** SUM(bags_allocated) from all chamber_allocations = total_bags
3. **Chamber Capacity Check:** bags_allocated ≤ chamber.max_capacity for each chamber

#### **3. Auto-population Logic**
4. **From Commodity Selection:** When commodity + bag_type selected → Auto-fill bag_weight from commodity bag configuration
5. **Chamber Filtering:** When godown selected → Show only available floors and chambers

#### **4. Chamber Status Updates**
6. **Occupancy Tracking:** Update chamber status to 'Occupied' when bags allocated
7. **Capacity Calculation:** Track remaining capacity per chamber

### **Rounding Requirements**
- **Weight calculations:** Round to 2 decimal places using Math.round(value * 100) / 100
- **Applied to:** total_weight
- **Bag quantities:** Always whole numbers (integers)

### **Requirements**
- **Client-side:** Real-time updates when input fields change
- **Server-side:** Minimal validation only (positive values, capacity limits)
- **Validation:** All bags, weights must be > 0
- **Validation:** Chamber allocation total must equal total bags
- **Validation:** Each chamber allocation must not exceed chamber capacity
- **Zero Handling:** Calculations should work with zero values during data entry
- **Child Table Support:** Auto-calculate when chamber allocations are modified
- **Multi-Chamber Support:** Single Aawak can span multiple chambers
- **Commodity Integration:** Auto-populate bag details from commodity master
- **Draft State:** All calculated values should update in draft mode
- **Chamber Management:** Update chamber occupancy status

### **Field Triggers Required**

#### **Parent Field Triggers:**
- **total_bags, bag_weight** → Calculate total_weight
- **commodity, bag_type** → Auto-populate bag_weight from commodity configuration
- **godown** → Filter available floors and chambers for allocation
- **chamber_allocations child table changes** → Validate total allocation = total_bags

#### **Child Table Triggers (Chamber Allocation):**
- **bags_allocated** → Check against chamber max_capacity
- **chamber** → Auto-populate max capacity info for validation
- **Any child table modification** → Recalculate total allocation validation
- **floor** → Filter chambers for selected floor

### **Auto-population from Masters**

#### **From Commodity Selection:**
- When commodity selected → Show available bag_type options from commodity configuration
- When bag_type selected → Auto-fill bag_weight from commodity bag configuration
- Auto-populate rate information for future Jawak calculations

#### **From Godown Selection:**
- When godown selected → Show available warehouse floors
- Filter floors by status = 'Active'
- Show chamber availability and capacity information

### **Key Implementation Notes**
- **Multi-Chamber Storage:** Single Aawak transaction can allocate bags across multiple chambers
- **Capacity Management:** Real-time validation against chamber maximum capacity
- **Allocation Validation:** Total allocated bags must equal total bags received
- **Chamber Status:** Auto-update chamber status when allocated/deallocated
- **Commodity Integration:** Leverage commodity master for bag configurations and rates
- **Draft Flexibility:** Allow partial data entry and validation during draft state
- **Operator Workflow:** Simple interface for selecting chambers and entering allocation quantities

## **SUCCESS METRICS**

### **Working Implementation Should:**
- Calculate total_weight in real-time when bags or weight changes
- Validate total chamber allocation equals total bags
- Check each chamber allocation against chamber capacity limits
- Auto-populate bag_weight when commodity and bag_type selected
- Show available chambers when godown selected
- Update chamber occupancy status when allocations made
- Handle multiple chamber allocations in single transaction
- Support draft mode with partial data entry
- Submit forms without hanging/timeout
- Work on both new and edit forms
- Export properly to fixtures
- Maintain chamber capacity tracking
- Support operator-friendly chamber selection workflow

## **SPECIFIC INWARD AAWAK CONSIDERATIONS**

### **Chamber Management:**
- **Multi-Chamber Allocation:** Single Aawak can span multiple chambers based on capacity
- **Capacity Tracking:** Real-time validation against chamber maximum capacity
- **Status Updates:** Auto-update chamber status (Available → Occupied)
- **Floor Organization:** Support hierarchical floor → chamber selection

### **Commodity Integration:**
- **Bag Configuration:** Leverage commodity master for bag weight options
- **Rate Information:** Store rate data for future Jawak rent calculations
- **Product Specifications:** Link to commodity descriptions and categories

### **Operator Workflow:**
- **Step-by-Step Entry:** Customer → Commodity → Bags → Godown → Chamber Allocation
- **Visual Capacity:** Show remaining capacity for each chamber
- **Allocation Helper:** Suggest optimal chamber allocation based on bag quantity
- **Validation Feedback:** Clear messages for capacity or allocation issues

### **Data Integrity:**
- **Allocation Balance:** Ensure all bags are allocated to chambers
- **Capacity Limits:** Prevent over-allocation beyond chamber capacity
- **Status Consistency:** Maintain accurate chamber occupancy status
- **Audit Trail:** Track when and how chambers were allocated

## **VALIDATION RULES**

### **Must Have Validations:**
1. **Positive Values:** total_bags, bag_weight must be > 0
2. **Allocation Balance:** SUM(bags_allocated) = total_bags
3. **Chamber Capacity:** bags_allocated ≤ max_capacity for each chamber
4. **Date Logic:** aawak_date cannot be in future
5. **Required Fields:** storage_customer, commodity, bag_type, godown must be selected

### **Business Logic Validations:**
1. **Chamber Availability:** Selected chambers must have status = 'Available'
2. **Floor-Chamber Relationship:** Chambers must belong to selected floors
3. **Commodity-Bag Relationship:** bag_type must exist in selected commodity configuration
4. **Unique Allocation:** Same chamber cannot be allocated twice in single Aawak

### **Optional Business Validations:**
1. **Customer Credit:** Check customer storage limits or credit status
2. **Commodity Rules:** Validate commodity-specific storage requirements
3. **Chamber Type:** Ensure chamber type suitable for commodity
4. **Seasonal Rules:** Apply seasonal storage restrictions if applicable

## **CHAMBER ALLOCATION WORKFLOW**

### **Allocation Process:**
1. **Select Godown:** Choose storage facility
2. **View Floors:** Show available floors in selected godown
3. **Select Chambers:** Choose available chambers with capacity info
4. **Allocate Bags:** Enter bag quantities per chamber
5. **Validate Total:** Ensure allocation total equals total bags
6. **Check Capacity:** Verify each chamber allocation within limits
7. **Update Status:** Mark chambers as occupied

### **Capacity Display:**
- **Current Capacity:** Show used vs total capacity per chamber
- **Available Space:** Calculate remaining capacity
- **Allocation Impact:** Show capacity after proposed allocation
- **Visual Indicators:** Color-coding for capacity levels (Green/Yellow/Red)

## **INTEGRATION POINTS**

### **With Commodity Master:**
- **Bag Configurations:** Pull available bag weights and rates
- **Product Details:** Link commodity specifications
- **Rate Information:** Store for future Jawak calculations

### **With Godown Management:**
- **Capacity Updates:** Real-time chamber occupancy tracking
- **Status Management:** Update chamber availability status
- **Hierarchy Navigation:** Floor → Chamber selection workflow

### **With Future Jawak:**
- **Storage Duration:** Start date for rent calculation
- **Allocated Quantities:** Bags available for release
- **Rate Reference:** Stored rates for billing calculations
- **Chamber Reference:** Track which chambers hold which quantities