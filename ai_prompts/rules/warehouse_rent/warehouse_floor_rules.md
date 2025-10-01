# Warehouse Floor DocType Scripts

## **IMPLEMENTATION PROMPT TEMPLATE**

```
I need to implement client and server scripts for the Warehouse Floor DocType in our Kisan Warehouse Frappe app.

**CRITICAL REQUIREMENTS:**
1. Server script should be minimal: `class WarehouseFloor(Document): pass`
2. All calculations must be client-side only
3. No server-side validation that could cause database locks
4. Follow Frappe v15 standards

**Business Logic:**
[See calculations below]

**Implementation Steps:**
1. First implement floor-level validations
2. Test thoroughly before adding chamber validations
3. Export fixtures after each working change
4. Use bench console for Client Script creation
5. Keep server script minimal to avoid timeout issues

**Reference:** Use the working nested child table implementations as template.
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
bench --site kisan-new.localhost reload-doctype "Warehouse Floor"

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
- Don't allow floors without chambers when has_chambers is checked
- Don't allow duplicate floor numbers within same godown

### **What ALWAYS Works:**
- Use Client Script DocType via bench console
- Keep server scripts minimal: `class WarehouseFloor(Document): pass`
- Export fixtures after every change
- Test thoroughly before adding complexity
- Validate floor uniqueness within godown scope
- Ensure chambers exist when required

## **BUSINESS LOGIC REQUIREMENTS**

### **Objective**
Manage individual warehouse floors within godowns with nested chamber structure and floor-level capacity tracking.

### **Fields Involved**

#### **Floor DocType Fields (Child of Godown):**
- **Input Fields:** floor_name, floor_number, floor_type, total_area, has_chambers, status
- **Nested Child Tables:** floor_chambers (Floor Chamber)
- **Calculated Fields:** total_capacity (aggregated from chambers)

### **Validation Logic to Implement**

#### **1. Floor-Level Validation**
1. **Unique Floor Number:** floor_number must be unique within same godown
2. **Floor Name:** Cannot be empty
3. **Chamber Requirement:** If has_chambers = checked, floor must have at least one chamber
4. **Status Management:** Default to 'Active'

#### **2. Chamber-Level Validation (Nested)**
5. **Chamber Existence:** When has_chambers checked, floor_chambers must have rows
6. **Chamber Capacity:** Validate chamber capacities are reasonable
7. **Total Floor Area:** SUM(chamber.area) should not exceed floor.total_area

### **Capacity Calculations**

#### **Floor-Level Aggregations:**
1. **total_capacity = SUM(chamber.max_capacity)** from all chambers in floor
2. **total_chambers = COUNT(floor_chambers)** number of chambers in floor
3. **occupied_capacity = SUM(chamber.occupied)** from chamber allocation tracking
4. **available_capacity = total_capacity - occupied_capacity**
5. **utilization_percent = (occupied_capacity / total_capacity) × 100**

### **Requirements**
- **Client-side:** Real-time validation of floor and chamber structure
- **Server-side:** Minimal validation only (required fields)
- **Validation:** Unique floor_number within same godown
- **Validation:** Chambers required when has_chambers checked
- **Nested Structure:** Support floor_chambers child table within floor child table
- **Capacity Tracking:** Aggregate chamber capacities to floor level
- **Status Management:** Track floor operational status
- **User Experience:** Clear error messages for structure violations

### **Field Triggers Required**

#### **Floor Field Triggers:**
- **floor_number** → Validate uniqueness within parent godown
- **floor_name** → Auto-generate from floor_number if empty (e.g., "Floor 1")
- **has_chambers** → Validate floor_chambers exists when checked
- **floor_chambers child table changes** → Recalculate total_capacity
- **status** → Filter available floors in Aawak allocation

#### **Nested Chamber Triggers:**
- **chamber additions/deletions** → Update floor total_capacity
- **chamber.max_capacity changes** → Recalculate floor total_capacity
- **chamber.area changes** → Validate against floor total_area

### **Key Implementation Notes**
- **Nested Child Table:** Floor is child of Godown, contains chambers as nested child
- **Scope Validation:** floor_number unique within godown, not globally
- **Capacity Aggregation:** Floor capacity is sum of chamber capacities
- **Conditional Requirement:** Chambers required only when has_chambers checked
- **Status Inheritance:** Consider parent godown status
- **Floor Types:** Support Ground, Upper, Basement floor types

## **SUCCESS METRICS**

### **Working Implementation Should:**
- Validate unique floor_number within same godown
- Allow duplicate floor_numbers across different godowns
- Require chambers when has_chambers is checked
- Calculate total floor capacity from chambers
- Validate chamber areas don't exceed floor area
- Support floor types (Ground, Upper, Basement)
- Default floor status to 'Active'
- Handle nested chamber structure properly
- Update capacity when chambers added/removed
- Filter active floors for allocations
- Submit parent godown without hanging
- Export properly to fixtures
- Maintain structure integrity

## **SPECIFIC WAREHOUSE FLOOR CONSIDERATIONS**

### **Floor Types:**
- **Ground Floor:** Primary access level, typically floor_number = 0
- **Upper Floors:** Elevated levels, floor_number = 1, 2, 3...
- **Basement:** Below ground level, floor_number = -1, -2...

### **Floor Characteristics:**
- **Access:** Ground floors easier for loading/unloading
- **Load Bearing:** Upper floors may have weight limits
- **Environment:** Basement floors better for temperature control
- **Cost:** Ground floor typically premium pricing

### **Chamber Organization:**
- **With Chambers:** Divided floor for segregated storage
- **Without Chambers:** Open floor for bulk storage
- **Mixed Use:** Some floors chambered, others open

### **Capacity Management:**
- **Floor Capacity:** Sum of all chamber capacities
- **Allocation Priority:** Typically fill ground floor first
- **Utilization Tracking:** Monitor per floor efficiency
- **Balancing:** Distribute load across floors

## **VALIDATION RULES**

### **Must Have Validations:**
1. **Floor Name:** Cannot be empty
2. **Floor Number:** Cannot be empty, unique within godown
3. **Chamber Requirement:** If has_chambers checked, floor_chambers must exist
4. **Capacity Validation:** Chamber capacities must be > 0
5. **Area Validation:** Total chamber area ≤ floor total_area (if specified)
6. **Status:** Default to 'Active'

### **Business Logic Validations:**
1. **Floor Numbering:** Sequential numbering recommended (0, 1, 2, -1)
2. **Capacity Distribution:** Warn if chambers have vastly different capacities
3. **Area Utilization:** Warn if chamber areas use < 60% of floor area
4. **Status Consistency:** Inactive floor in active godown should warn

### **Optional Business Validations:**
1. **Load Distribution:** Check weight distribution across floor
2. **Safety Standards:** Ensure adequate aisle space
3. **Fire Safety:** Validate emergency exit accessibility
4. **Equipment Access:** Ensure forklift/trolley pathways

## **FLOOR-CHAMBER RELATIONSHIP**

### **Structure Hierarchy:**
```
Godown (Parent)
└── Warehouse Floor (Child Level 1)
    └── Floor Chamber (Child Level 2)
```

### **Data Flow:**
```javascript
// Floor aggregates from chambers
Floor {
    floor_name: "Ground Floor",
    floor_number: 0,
    has_chambers: true,
    floor_chambers: [
        {chamber_name: "A", max_capacity: 1000},
        {chamber_name: "B", max_capacity: 1500},
        {chamber_name: "C", max_capacity: 1200}
    ],
    // Calculated fields
    total_capacity: 3700,
    total_chambers: 3,
    occupied_capacity: 2100,
    available_capacity: 1600,
    utilization: 57%
}
```

## **INTEGRATION POINTS**

### **With Godown (Parent):**
- **Floor Validation:** Unique floor_number within parent godown
- **Capacity Rollup:** Floor capacities aggregate to godown total
- **Status Inheritance:** Consider godown status when validating floor
- **Structure Integrity:** Cannot delete floor with active allocations

### **With Floor Chamber (Nested Child):**
- **Chamber Management:** Add/edit/delete chambers within floor
- **Capacity Calculation:** Sum chamber capacities to floor total
- **Area Validation:** Chamber areas vs floor total area
- **Occupancy Tracking:** Aggregate chamber occupancy to floor level

### **With Inward Aawak:**
- **Floor Selection:** Show available floors in godown
- **Chamber Allocation:** Allocate bags to chambers within floor
- **Capacity Check:** Validate against floor available capacity
- **Status Filter:** Only show active floors for allocation

## **NAMING AND DISPLAY**

### **Floor Naming Conventions:**
- **Numeric:** Floor 0, Floor 1, Floor 2
- **Descriptive:** Ground Floor, First Floor, Second Floor
- **Codes:** GF, FF, SF or L0, L1, L2

### **Floor Number Standards:**
```
Basement 2: -2
Basement 1: -1
Ground Floor: 0
First Floor: 1
Second Floor: 2
```

### **Display Format:**
- **List View:** "Ground Floor (Floor 0) - 3 Chambers - 3700 bags capacity"
- **Detail View:** Full floor information with chamber breakdown
- **Utilization:** Visual indicators (progress bars, color coding)

## **CAPACITY TRACKING DETAILS**

### **Real-Time Calculations:**
```javascript
// On chamber capacity change
function updateFloorCapacity(floor) {
    let total = 0;
    floor.floor_chambers.forEach(chamber => {
        total += chamber.max_capacity || 0;
    });
    floor.total_capacity = total;
    
    // Update occupancy
    floor.occupied_capacity = getOccupiedFromAawak(floor);
    floor.available_capacity = total - floor.occupied_capacity;
    floor.utilization = (floor.occupied_capacity / total * 100).toFixed(2);
}
```

### **Capacity Alerts:**
- **High Utilization:** Warning when > 90%
- **Over-capacity:** Error when allocation exceeds capacity
- **Under-utilization:** Notice when < 30% for long period
- **Capacity Changes:** Log when capacities are modified

## **STATUS MANAGEMENT**

### **Status Options:**
- **Active:** Floor operational and available
- **Maintenance:** Temporarily unavailable for repairs
- **Inactive:** Permanently closed or not in use

### **Status Impact:**
- **Active:** Show in allocation screens
- **Maintenance:** Hide from new allocations, existing allocations continue
- **Inactive:** No allocations allowed, consider moving existing stock

### **Status Workflow:**
```
Active → Maintenance (scheduled repairs)
Maintenance → Active (repairs completed)
Active → Inactive (floor closure)
```

## **ERROR HANDLING**

### **Common Errors:**
1. **Duplicate Floor:** "Floor number {X} already exists in this godown"
2. **Missing Chambers:** "Chambers required when 'Has Chambers' is checked"
3. **Invalid Capacity:** "Chamber capacity must be greater than zero"
4. **Area Exceeded:** "Total chamber area exceeds floor area"

### **Warning Messages:**
1. **Capacity Limit:** "Floor utilization exceeds 90%"
2. **Area Mismatch:** "Chamber areas use only 45% of floor area"
3. **Status Issue:** "Inactive floor contains active chambers"
4. **Uneven Distribution:** "Chamber capacities vary significantly"

## **BEST PRACTICES**

### **Floor Setup:**
1. **Sequential Numbering:** Use 0, 1, 2 for clarity
2. **Descriptive Names:** Use clear floor names (Ground, First, etc.)
3. **Accurate Areas:** Measure and record actual floor areas
4. **Realistic Capacities:** Set achievable capacity limits

### **Chamber Planning:**
1. **Equal Distribution:** Try to balance chamber sizes
2. **Access Consideration:** Place high-turnover chambers near access points
3. **Commodity Segregation:** Plan chamber allocation by product type
4. **Future Expansion:** Leave room for additional chambers

### **Maintenance:**
1. **Regular Audits:** Physical verification of structure
2. **Capacity Reviews:** Update capacities as needed
3. **Status Updates:** Keep status current with actual conditions
4. **Documentation:** Maintain floor plans and chamber layouts