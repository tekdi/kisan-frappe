# Godown - AI DocType Creation Guide

You are an expert Frappe/ERPNext developer.  
I am building a Warehouse Rent module in my Kisan Warehouse application.  
I want to implement the "Godown → Floor → Chamber" hierarchy using a **flattened structure** (instead of nested child tables).  

### Current Problem
- Earlier I created nested child DocTypes (Godown → Floor child → Chamber child).  
- This caused issues in UI rendering, filtering, and reporting.  
- I now want to **refactor to flattened DocTypes**.

### Required Flattened DocType Design
1. **Godown (Main DocType)**
   - Fields:
     - `godown_name` (Data, Mandatory, Unique per record)
     - `godown_code` (Data, Auto naming series optional e.g. GD-.####)
     `address` (Small Text, Required)  
    - `city` (Data, Required)  
    - `state` (Data, Required)  
    - `zip` (Data, Required)  
    - `total_area` (Float, Optional) → Total warehouse area  
    - `contact_person` (Data, Optional)  
    - `mobile` (Data, Optional)  
     - `status` (Select: Active, Inactive, Maintenance)

2. **Warehouse Floor (Main DocType)**
   - Fields:
    - `floor_name` (Data, Required) → Display name (Ground, First, etc.)  
    - `floor_number` (Int, Required) → Numeric identifier  
    - `floor_type` (Select, Optional) → Options: Ground, Upper, Basement  
    - `total_area` (Float, Optional) → Floor area  
     - `godown` (Link to Godown, Mandatory)
     - `status` (Select: Active, Inactive, Maintenance)

3. **Floor Chamber (Main DocType)**
   - Fields:
     - `chamber_name` (Data, e.g., Chamber A, Chamber 1)
     - `chamber_code` (Data or Auto naming series, e.g., CH-.####)
     - `floor` (Link to Warehouse Floor, Mandatory)
     - `area` (Float, sqm)
     - `max_capacity` (Int, no. of bags)
     - `status` (Select: Available, Occupied, Reserved, Maintenance)

### Filtering Requirements
- When selecting **Floor**, it must only show floors of the selected **Godown**.
- When selecting **Chamber**, it must only show chambers of the selected **Floor**.
- If Godown is changed → Floors reset → Chambers reset.
- If Floor is changed → Chambers reset.

### Script Requirements
- Write **Client Scripts** in Frappe for dynamic filtering:
  1. In forms where user selects Godown → Floor → Chamber:
     - Filter Floors by Godown.
     - Filter Chambers by Floor.
  2. On Godown change → reset Floor + Chamber.
  3. On Floor change → reset Chamber.
- Use `frm.set_query` for filters.
- Example:
  ```javascript
  frappe.ui.form.on("Your Transaction Doctype", {
      refresh: function(frm) {
          frm.set_query("floor", function() {
              return {
                  filters: {
                      godown: frm.doc.godown
                  }
              };
          });
          frm.set_query("chamber", function() {
              return {
                  filters: {
                      floor: frm.doc.floor
                  }
              };
          });
      },
      godown: function(frm) {
          frm.set_value("floor", "");
          frm.set_value("chamber", "");
      },
      floor: function(frm) {
          frm.set_value("chamber", "");
      }
  });



## ⚙️ POST-CREATION COMMANDS

Run these commands after all three DocTypes are created:

```bash
# 1. Export fixtures
bench --site kisan-new.localhost export-fixtures

# 2. Migrate database
bench --site kisan-new.localhost migrate

# 3. Reload DocTypes
bench --site kisan-new.localhost reload-doctype "Godown"
bench --site kisan-new.localhost reload-doctype "Warehouse Floor"
bench --site kisan-new.localhost reload-doctype "Floor Chamber"

# 4. Clear cache
bench --site kisan-new.localhost clear-cache

# 5. Build assets
bench build --app kisan_warehouse

# 6. Restart
bench restart
```

# Godown DocType Scripts
```

Add this section at the very beginning of your Godown rules document (before the IMPLEMENTATION PROMPT TEMPLATE section). This gives Cursor complete specifications to create all three hierarchical DocTypes before implementing the business logic.


# Godown DocType Scripts

## **IMPLEMENTATION PROMPT TEMPLATE**

```
I need to implement client and server scripts for the Godown DocType in our Kisan Warehouse Frappe app.

**CRITICAL REQUIREMENTS:**
1. Server script should be minimal: `class Godown(Document): pass`
2. All calculations must be client-side only
3. No server-side validation that could cause database locks
4. Follow Frappe v15 standards

**Business Logic:**
[See calculations below]

**Implementation Steps:**
1. First implement hierarchical floor/chamber structure
2. Test thoroughly before adding validations
3. Export fixtures after each working change
4. Use bench console for Client Script creation
5. Keep server script minimal to avoid timeout issues

**Reference:** Use the working Warehouse master implementations as template.
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
bench --site kisan-new.localhost reload-doctype "Godown"

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
- Don't allow duplicate godown codes
- Don't create floors without chambers
- Don't allow duplicate chamber codes within floors

### **What ALWAYS Works:**
- Use Client Script DocType via bench console
- Keep server scripts minimal: `class Godown(Document): pass`
- Export fixtures after every change
- Test thoroughly before adding complexity
- Use system restart if you get lock timeouts
- Validate hierarchical structure integrity

## **BUSINESS LOGIC REQUIREMENTS**

### **Objective**
Manage hierarchical warehouse facility structure (Godown → Floors → Chambers) with capacity tracking and occupancy management for storage allocation.

### **Fields Involved**

#### **Parent DocType Fields:**
- **Input Fields:** godown_name, godown_code, address, city, state, zip, total_area, contact_person, mobile, status
- **Child Tables:** warehouse_floors (Warehouse Floor)

#### **Nested Child Structure:**
- **Warehouse Floor** (Level 1 Child) → Contains floor details
- **Floor Chamber** (Level 2 Child) → Nested within Warehouse Floor

### **Hierarchical Structure**

```
Godown
├── Floor 1 (Ground Floor)
│   ├── Chamber A (Capacity: 1000 bags)
│   ├── Chamber B (Capacity: 1500 bags)
│   └── Chamber C (Capacity: 1200 bags)
├── Floor 2 (First Floor)
│   ├── Chamber A (Capacity: 800 bags)
│   └── Chamber B (Capacity: 1000 bags)
└── Floor 3 (Second Floor)
    └── Chamber A (Capacity: 2000 bags)
```

### **Validation Logic to Implement**

#### **1. Godown-Level Validation**
1. **Unique Godown Code:** godown_code must be unique across all godowns
2. **At Least One Floor:** Godown must have at least one warehouse floor
3. **Contact Validation:** Valid mobile number format if provided
4. **Address Completeness:** All address fields required

#### **2. Floor-Level Validation**
5. **Unique Floor Numbers:** floor_number must be unique within same godown
6. **Chamber Requirement:** If has_chambers = checked, floor must have at least one chamber
7. **Floor Status:** Default to 'Active'

#### **3. Chamber-Level Validation**
8. **Unique Chamber Codes:** chamber_code must be unique within same floor
9. **Capacity Validation:** max_capacity must be > 0 if specified
10. **Chamber Status:** Default to 'Available'

### **Capacity Calculations**

#### **Chamber Capacity Tracking:**
1. **Total Capacity:** Max bags that can be stored
2. **Occupied Capacity:** Currently allocated bags (from Inward Aawak)
3. **Available Capacity:** Total - Occupied
4. **Utilization %:** (Occupied / Total) × 100

#### **Floor Capacity (Aggregated from Chambers):**
5. **Floor Total Capacity:** SUM(chamber.max_capacity) for all chambers in floor
6. **Floor Occupied:** SUM(chamber.occupied) for all chambers in floor
7. **Floor Available:** Floor Total - Floor Occupied

#### **Godown Capacity (Aggregated from Floors):**
8. **Godown Total Capacity:** SUM(floor.total_capacity) for all floors
9. **Godown Occupied:** SUM(floor.occupied) for all floors
10. **Godown Utilization %:** (Godown Occupied / Godown Total) × 100

### **Requirements**
- **Client-side:** Real-time validation of hierarchical structure
- **Server-side:** Minimal validation only (required fields, uniqueness)
- **Validation:** Ensure structure integrity (Godown → Floors → Chambers)
- **Validation:** Prevent duplicate codes at each level
- **Capacity Tracking:** Calculate and display utilization at all levels
- **Status Management:** Track active/inactive status at all levels
- **User Experience:** Clear navigation of hierarchical structure
- **Draft State:** Allow building structure incrementally in draft

### **Field Triggers Required**

#### **Parent Field Triggers (Godown):**
- **godown_code** → Validate uniqueness across all godowns
- **warehouse_floors child table** → Validate at least one floor exists
- **All floors and chambers** → Calculate total godown capacity

#### **Child Table Triggers (Warehouse Floor):**
- **floor_number** → Validate uniqueness within same godown
- **has_chambers** → Ensure chambers exist if checked
- **floor_chambers child table** → Calculate floor total capacity
- **status** → Filter available floors for allocation

#### **Nested Child Table Triggers (Floor Chamber):**
- **chamber_code** → Validate uniqueness within same floor
- **max_capacity** → Validate positive value and reasonable limit
- **status** → Track chamber availability for allocations
- **Occupancy changes** → Update available capacity in real-time

### **Key Implementation Notes**
- **Hierarchical Master:** Three-level nested structure
- **Capacity Management:** Real-time tracking at all levels
- **Unique Identifiers:** Enforce uniqueness at appropriate scope
- **Status Tracking:** Multi-level status management
- **Occupancy Updates:** Dynamic capacity calculations from Aawak allocations
- **Validation Scope:** Godown-wide, Floor-level, and Chamber-level validations

## **SUCCESS METRICS**

### **Working Implementation Should:**
- Validate unique godown_code across all godowns
- Ensure at least one floor per godown
- Validate unique floor_number within godown
- Ensure chambers exist when has_chambers is checked
- Validate unique chamber_code within floor
- Calculate total capacity at all levels (Chamber → Floor → Godown)
- Track occupancy and availability in real-time
- Update chamber status based on allocations
- Display utilization percentages at all levels
- Support hierarchical navigation (drill-down)
- Submit forms without hanging/timeout
- Work on both new and edit forms
- Export properly to fixtures
- Maintain structure integrity during edits

## **SPECIFIC GODOWN CONSIDERATIONS**

### **Facility Types:**
- **Single-Floor Godowns:** Simple warehouses (Ground floor only)
- **Multi-Floor Godowns:** Larger facilities with multiple levels
- **Chambered Storage:** Divided spaces for segregated storage
- **Open Storage:** Entire floor as single storage area (no chambers)

### **Floor Types:**
- **Ground Floor:** Easy access, suitable for heavy goods
- **Upper Floors:** May require elevators/ramps
- **Basement:** Temperature-controlled storage

### **Chamber Organization:**
- **Chamber Naming:** A, B, C or 1, 2, 3 or custom codes
- **Chamber Sizing:** Variable capacity based on area
- **Chamber Purpose:** Segregation by commodity, customer, or quality

### **Capacity Planning:**
- **Max Capacity:** Physical limit based on floor area
- **Safety Margin:** Keep 10-20% buffer capacity
- **Weight Limits:** Consider floor load-bearing capacity
- **Access Constraints:** Factor in aisle space and handling equipment

## **VALIDATION RULES**

### **Must Have Validations:**
1. **Godown Code:** Cannot be empty, must be unique
2. **Godown Name:** Cannot be empty
3. **Address Details:** Complete address required (address, city, state, zip)
4. **At Least One Floor:** Minimum one warehouse floor required
5. **Floor Number:** Unique within same godown
6. **Chamber Requirement:** If has_chambers checked, chambers must exist
7. **Chamber Code:** Unique within same floor
8. **Capacity Values:** max_capacity > 0 if specified
9. **Status:** Default to 'Active'

### **Business Logic Validations:**
1. **Floor Numbering:** Suggest sequential numbering (0, 1, 2...)
2. **Chamber Distribution:** Warn if floors have vastly different chamber counts
3. **Capacity Reasonableness:** Check if capacity matches floor area
4. **Utilization Limits:** Warn when utilization exceeds 90%
5. **Status Consistency:** Inactive godown should have inactive floors

### **Optional Business Validations:**
1. **Area Calculations:** Total chamber area ≤ floor area
2. **Load Limits:** Consider weight distribution across floors
3. **Access Requirements:** Ensure proper pathways and access points
4. **Safety Compliance:** Meet fire safety and structural standards

## **CAPACITY MANAGEMENT DETAILS**

### **Chamber Capacity Tracking:**
```javascript
// Real-time capacity calculation
Chamber {
    max_capacity: 1000 bags,
    occupied_capacity: 650 bags (from Aawak allocations),
    available_capacity: 350 bags,
    utilization: 65%,
    status: "Occupied"
}
```

### **Floor-Level Aggregation:**
```javascript
Floor {
    floor_name: "Ground Floor",
    total_chambers: 3,
    total_capacity: 3700 bags,
    occupied_capacity: 2100 bags,
    available_capacity: 1600 bags,
    utilization: 57%
}
```

### **Godown-Level Summary:**
```javascript
Godown {
    godown_name: "Main Warehouse",
    total_floors: 3,
    total_chambers: 8,
    total_capacity: 10000 bags,
    occupied_capacity: 7200 bags,
    available_capacity: 2800 bags,
    utilization: 72%
}
```

## **HIERARCHICAL NAVIGATION**

### **User Interface Flow:**
1. **Godown List:** Show all godowns with utilization summary
2. **Godown View:** Display floors and overall capacity
3. **Floor View:** Show chambers and floor-level capacity
4. **Chamber View:** Display occupancy details and allocated Aawaks

### **Drill-Down Capability:**
```
Godown List
└─ Godown Details
   ├─ Floor 1
   │  ├─ Chamber A (Available: 350 bags)
   │  ├─ Chamber B (Occupied: Full)
   │  └─ Chamber C (Available: 200 bags)
   ├─ Floor 2
   │  └─ ...
   └─ Capacity Summary Dashboard
```

## **STATUS MANAGEMENT**

### **Status Options:**
- **Godown Status:** Active, Inactive
- **Floor Status:** Active, Maintenance, Inactive
- **Chamber Status:** Available, Occupied, Reserved, Maintenance

### **Status Impact:**
- **Active:** Available for new allocations
- **Occupied:** Partially or fully allocated
- **Reserved:** Booked for future use
- **Maintenance:** Temporarily unavailable
- **Inactive:** Not in service

### **Cascading Status:**
- **Inactive Godown:** All floors and chambers inactive
- **Inactive Floor:** All chambers in floor inactive
- **Maintenance Chamber:** Only that chamber unavailable

## **NAMING CONVENTION**

### **Auto-Naming:**
- **Godown Series:** GD-.YYYY.-.####
- **Example:** GD-2025-0001
- **Uniqueness:** Ensured by naming series
- **Sequential:** Auto-incremented per year

### **Manual Naming:**
- **Godown Code:** User-defined unique code (e.g., WH-MUM-01)
- **Floor Naming:** Ground Floor, First Floor, Basement, etc.
- **Chamber Naming:** A, B, C or 1, 2, 3 or A1, A2, B1, B2

## **USER INTERFACE CONSIDERATIONS**

### **Field Organization:**
- **Section 1:** Godown Basic Information (name, code, address)
- **Section 2:** Contact Information (person, mobile)
- **Section 3:** Warehouse Floors (child table with nested chambers)
- **Section 4:** Capacity Summary (calculated fields)
- **Section 5:** Status

### **Child Table Display:**
- **Warehouse Floors Table:**
  - Columns: Floor Name | Floor Number | Type | Area | Chambers | Status
  - Expandable rows to show nested chambers
  - Color-coding for status (Green/Yellow/Red)

### **Nested Child Table:**
- **Floor Chambers Table (inside floor row):**
  - Columns: Chamber Name | Code | Area | Capacity | Occupied | Available | Status
  - Real-time capacity updates
  - Visual capacity indicators (progress bars)

### **Capacity Dashboard:**
- **Visual Summary:** Charts showing utilization
- **Quick Stats:** Total/Occupied/Available at glance
- **Alert Indicators:** High utilization warnings
- **Trends:** Historical capacity usage


### **Data Integrity:**
- **Structure Integrity:** Prevent orphan floors/chambers
- **Capacity Consistency:** Validate allocations against capacity
- **Status Consistency:** Maintain logical status relationships
- **Audit Trail:** Track capacity changes and allocations

## **BEST PRACTICES**

### **Setup Guidelines:**
1. **Physical Mapping:** Match digital structure to physical layout
2. **Clear Naming:** Use intuitive floor and chamber names
3. **Accurate Capacity:** Measure and set realistic capacities
4. **Regular Updates:** Review and update structure as facility changes
5. **Status Maintenance:** Keep status current with actual conditions

### **Capacity Planning:**
1. **Buffer Space:** Don't plan for 100% utilization
2. **Segregation:** Plan chamber allocation by commodity type
3. **Access Optimization:** Group frequently accessed chambers
4. **Safety Margins:** Consider emergency access requirements

### **Operational Tips:**
1. **Regular Audits:** Physical verification of occupancy
2. **Maintenance Schedules:** Plan downtime for repairs
3. **Utilization Monitoring:** Track trends and optimize allocation
4. **Customer Segregation:** Allocate chambers by customer if needed

## **CAPACITY CALCULATION FORMULAS**

### **Chamber Level:**
```javascript
available_capacity = max_capacity - occupied_capacity
utilization_percent = (occupied_capacity / max_capacity) * 100
status = utilization_percent >= 100 ? "Occupied" : "Available"
```

### **Floor Level:**
```javascript
floor_total_capacity = SUM(chamber.max_capacity for all chambers)
floor_occupied = SUM(chamber.occupied_capacity for all chambers)
floor_available = floor_total_capacity - floor_occupied
floor_utilization = (floor_occupied / floor_total_capacity) * 100
```

### **Godown Level:**
```javascript
godown_total_capacity = SUM(floor.total_capacity for all floors)
godown_occupied = SUM(floor.occupied for all floors)
godown_available = godown_total_capacity - godown_occupied
godown_utilization = (godown_occupied / godown_total_capacity) * 100
```

## **ERROR HANDLING**

### **Common Errors:**
1. **Duplicate Code:** "Godown code already exists"
2. **No Floors:** "Add at least one warehouse floor"
3. **No Chambers:** "Floor marked with chambers but none defined"
4. **Duplicate Floor:** "Floor number already exists in this godown"
5. **Duplicate Chamber:** "Chamber code already exists on this floor"
6. **Invalid Capacity:** "Chamber capacity must be greater than zero"

### **Warning Messages:**
1. **High Utilization:** "Godown utilization exceeds 90%"
2. **Capacity Mismatch:** "Chamber areas exceed floor area"
3. **Status Inconsistency:** "Active chambers in inactive floor"
4. **Over-allocation:** "Chamber allocation exceeds capacity"

## **DATA MIGRATION CONSIDERATIONS**

### **Initial Setup:**
1. **Godown Creation:** Create main godown records first
2. **Floor Addition:** Add all floors to godown
3. **Chamber Setup:** Define chambers within each floor
4. **Capacity Setting:** Set accurate capacities
5. **Status Activation:** Activate for operations

### **Bulk Import:**
- Support CSV import for large facility setups
- Validate hierarchy during import
- Auto-create parent-child relationships
- Set default statuses and capacities