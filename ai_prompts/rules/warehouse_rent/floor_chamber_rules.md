# Floor Chamber DocType Scripts

## **IMPLEMENTATION PROMPT TEMPLATE**

```
I need to implement client and server scripts for the Floor Chamber DocType in our Kisan Warehouse Frappe app.

**CRITICAL REQUIREMENTS:**
1. Use ONLY Client Script DocType (created via bench console) - DO NOT create .js files
2. Server script should be minimal: `class FloorChamber(Document): pass`
3. All calculations must be client-side only
4. No server-side validation that could cause database locks
5. Follow Frappe v15 standards

**Business Logic:**
[See calculations below]

**Implementation Steps:**
1. First implement chamber-level validations
2. Test thoroughly before adding occupancy tracking
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
bench --site kisan-new.localhost reload-doctype "Floor Chamber"

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
- Don't allow duplicate chamber codes within same floor
- Don't allow zero or negative max_capacity values
- Don't allow allocations exceeding chamber capacity

### **What ALWAYS Works:**
- Use Client Script DocType via bench console
- Keep server scripts minimal: `class FloorChamber(Document): pass`
- Export fixtures after every change
- Test thoroughly before adding complexity
- Validate chamber uniqueness within floor scope
- Track occupancy from Aawak allocations

## **BUSINESS LOGIC REQUIREMENTS**

### **Objective**
Manage individual storage chambers within warehouse floors with real-time occupancy tracking and capacity management for bag allocation.

### **Fields Involved**

#### **Chamber DocType Fields (Nested Child of Floor):**
- **Input Fields:** chamber_name, chamber_code, area, max_capacity, status
- **Calculated Fields:** occupied_capacity, available_capacity, utilization_percent (from Aawak allocations)

### **Validation Logic to Implement**

#### **1. Chamber-Level Validation**
1. **Unique Chamber Code:** chamber_code must be unique within same floor
2. **Chamber Name:** Cannot be empty
3. **Capacity Validation:** max_capacity must be > 0 if specified
4. **Area Validation:** area must be > 0 if specified
5. **Status Management:** Default to 'Available'

#### **2. Occupancy Tracking**
6. **Occupied Capacity:** Calculate from Inward Aawak chamber_allocations
7. **Available Capacity:** max_capacity - occupied_capacity
8. **Utilization Percent:** (occupied_capacity / max_capacity) × 100
9. **Status Auto-Update:** Change to 'Occupied' when bags allocated

### **Capacity Calculations**

#### **Chamber-Level Calculations:**
1. **occupied_capacity = SUM(bags_allocated)** from all active Aawak allocations
2. **available_capacity = max_capacity - occupied_capacity**
3. **utilization_percent = (occupied_capacity / max_capacity) × 100**
4. **can_allocate = available_capacity > 0**

#### **Status Determination:**
5. **If utilization = 0%:** status = 'Available'
6. **If 0% < utilization < 100%:** status = 'Occupied' (partially)
7. **If utilization = 100%:** status = 'Occupied' (full)
8. **Manual Override:** status can be set to 'Reserved' or 'Maintenance'

### **Requirements**
- **Client-side:** Real-time validation of chamber properties
- **Server-side:** Minimal validation only (required fields, positive values)
- **Validation:** Unique chamber_code within same floor
- **Validation:** max_capacity must be positive
- **Occupancy Tracking:** Real-time updates from Aawak allocations
- **Capacity Check:** Prevent over-allocation beyond max_capacity
- **Status Management:** Auto and manual status updates
- **User Experience:** Clear capacity indicators and availability status

### **Field Triggers Required**

#### **Chamber Field Triggers:**
- **chamber_code** → Validate uniqueness within parent floor
- **chamber_name** → Auto-generate code if empty (e.g., "CH-A")
- **max_capacity** → Validate positive value and reasonableness
- **area** → Validate against parent floor total_area
- **status** → Filter available chambers in Aawak allocation
- **Aawak allocations** → Update occupied_capacity and utilization

### **Key Implementation Notes**
- **Nested Child Table:** Chamber is nested child (Floor → Chamber)
- **Scope Validation:** chamber_code unique within floor, not globally
- **Dynamic Occupancy:** Updates based on Aawak allocations and Jawak releases
- **Capacity Management:** Real-time tracking of bags stored
- **Status Intelligence:** Auto-status based on occupancy
- **Allocation Ready:** Provide available capacity for quick allocation decisions

## **SUCCESS METRICS**

### **Working Implementation Should:**
- Validate unique chamber_code within same floor
- Allow duplicate chamber_codes across different floors
- Require positive max_capacity values
- Calculate occupied_capacity from Aawak allocations
- Calculate available_capacity in real-time
- Update utilization_percent dynamically
- Auto-update status based on occupancy
- Prevent allocation beyond max_capacity
- Show available capacity in allocation screens
- Support status filtering (Available, Occupied, Reserved, Maintenance)
- Submit parent godown without hanging
- Export properly to fixtures
- Maintain occupancy accuracy

## **SPECIFIC FLOOR CHAMBER CONSIDERATIONS**

### **Chamber Characteristics:**
- **Size:** Variable based on floor area division
- **Capacity:** Measured in number of bags
- **Access:** Proximity to loading/unloading areas
- **Environment:** Temperature, humidity control (if applicable)

### **Chamber Naming Conventions:**
- **Alphabetic:** A, B, C, D...
- **Numeric:** 1, 2, 3, 4...
- **Alphanumeric:** A1, A2, B1, B2...
- **Descriptive:** North-A, South-B, East-1

### **Chamber Types:**
- **Standard:** Regular storage chambers
- **Climate-Controlled:** Temperature/humidity controlled
- **Secure:** Enhanced security for valuable commodities
- **Quick-Access:** Near loading docks for high-turnover goods

### **Capacity Planning:**
- **Physical Capacity:** Maximum bags that fit physically
- **Safe Capacity:** 80-90% of physical capacity
- **Operational Capacity:** Accounting for aisle space and access
- **Reserved Capacity:** Buffer for special requirements

## **VALIDATION RULES**

### **Must Have Validations:**
1. **Chamber Name:** Cannot be empty
2. **Chamber Code:** Cannot be empty, unique within floor
3. **Max Capacity:** Must be > 0 if specified
4. **Area:** Must be > 0 if specified
5. **Allocation Check:** bags_allocated ≤ max_capacity
6. **Status:** Default to 'Available'

### **Business Logic Validations:**
1. **Code Format:** Suggest standard naming conventions
2. **Capacity Reasonableness:** Warn if capacity very high/low for area
3. **Area Distribution:** Check if chamber areas sum to floor area
4. **Utilization Alerts:** Warn when approaching full capacity

### **Optional Business Validations:**
1. **Load Distribution:** Balance capacity across chambers
2. **Access Optimization:** Consider proximity to loading areas
3. **Commodity Compatibility:** Ensure suitable for stored commodity
4. **Safety Standards:** Meet fire safety and accessibility requirements

## **OCCUPANCY TRACKING DETAILS**

### **Real-Time Calculations:**
```javascript
// Chamber occupancy from Aawak allocations
Chamber {
    chamber_name: "Chamber A",
    chamber_code: "A",
    max_capacity: 1000,
    area: 500, // sq ft
    
    // Calculated from Aawak allocations
    occupied_capacity: 650,
    available_capacity: 350,
    utilization_percent: 65,
    
    // Auto-determined status
    status: "Occupied" // Available, Occupied, Reserved, Maintenance
}
```

### **Occupancy Update Logic:**
```javascript
// When Aawak submitted (bag allocation)
function updateChamberOccupancy(chamber_id, bags_allocated) {
    chamber.occupied_capacity += bags_allocated;
    chamber.available_capacity = chamber.max_capacity - chamber.occupied_capacity;
    chamber.utilization_percent = (chamber.occupied_capacity / chamber.max_capacity * 100);
    
    if (chamber.occupied_capacity > 0) {
        chamber.status = "Occupied";
    }
}

// When Jawak submitted (bag release)
function releaseChamberOccupancy(chamber_id, bags_released) {
    chamber.occupied_capacity -= bags_released;
    chamber.available_capacity = chamber.max_capacity - chamber.occupied_capacity;
    chamber.utilization_percent = (chamber.occupied_capacity / chamber.max_capacity * 100);
    
    if (chamber.occupied_capacity === 0) {
        chamber.status = "Available";
    }
}
```

### **Capacity Validation:**
```javascript
// Before Aawak allocation
function validateAllocation(chamber_id, bags_to_allocate) {
    if (chamber.available_capacity < bags_to_allocate) {
        throw "Chamber capacity exceeded! Available: " + chamber.available_capacity + " bags";
    }
    return true;
}
```

## **STATUS MANAGEMENT**

### **Status Options:**
- **Available:** Chamber empty and ready for allocation
- **Occupied:** Chamber has bags stored (partial or full)
- **Reserved:** Chamber booked for future allocation
- **Maintenance:** Chamber temporarily unavailable

### **Status Auto-Update Rules:**
```javascript
// Automatic status determination
if (occupied_capacity === 0 && status !== "Reserved" && status !== "Maintenance") {
    status = "Available";
} else if (occupied_capacity > 0 && occupied_capacity < max_capacity) {
    status = "Occupied"; // Partially occupied
} else if (occupied_capacity >= max_capacity) {
    status = "Occupied"; // Fully occupied
}
// Reserved and Maintenance are manual overrides
```

### **Status Transitions:**
```
Available → Reserved (manual booking)
Available → Occupied (Aawak allocation)
Occupied → Available (Jawak release, all bags out)
Any Status → Maintenance (manual override)
Maintenance → Available (repairs completed)
```

### **Status Impact on Operations:**
- **Available:** Show in Aawak allocation screens
- **Occupied:** Show with remaining capacity
- **Reserved:** Hide from general allocation, show to specific customer
- **Maintenance:** Hide from all allocations

## **INTEGRATION POINTS**

### **With Warehouse Floor (Parent):**
- **Chamber Validation:** Unique chamber_code within floor
- **Capacity Rollup:** Chamber capacities aggregate to floor total
- **Area Validation:** Chamber area ≤ floor total_area
- **Status Filtering:** Active chambers in active floors

### **With Godown (Grandparent):**
- **Hierarchical Display:** Godown → Floor → Chamber navigation
- **Total Capacity:** Chamber capacities roll up to godown level
- **Utilization Reporting:** Chamber usage aggregates to facility level

### **With Inward Aawak:**
- **Chamber Selection:** Show available chambers for allocation
- **Capacity Check:** Validate bags_allocated ≤ available_capacity
- **Occupancy Update:** Increase occupied_capacity when allocated
- **Status Change:** Update to 'Occupied' when bags allocated
- **Multi-Chamber:** Single Aawak can allocate to multiple chambers

### **With Outward Jawak:**
- **Release Processing:** Decrease occupied_capacity when released
- **Capacity Restoration:** Add released bags back to available_capacity
- **Status Update:** Change to 'Available' when fully emptied
- **Partial Release:** Update occupancy for partial releases

## **CAPACITY VISUALIZATION**

### **Display Formats:**

#### **List View:**
```
Chamber A | 650/1000 bags | 65% | Occupied | 350 available
Chamber B | 1500/1500 bags | 100% | Occupied | 0 available
Chamber C | 0/1200 bags | 0% | Available | 1200 available
```

#### **Visual Indicators:**
- **Progress Bar:** Show utilization percentage
- **Color Coding:**
  - Green: 0-70% utilization (Available)
  - Yellow: 71-90% utilization (Nearly Full)
  - Red: 91-100% utilization (Full)
  - Blue: Reserved
  - Gray: Maintenance

#### **Capacity Dashboard:**
```
┌─────────────────────────────────┐
│ Chamber A                       │
│ ████████████░░░░░ 65%          │
│ 650 / 1000 bags                │
│ 350 bags available              │
│ Status: Occupied                │
└─────────────────────────────────┘
```

## **ALLOCATION WORKFLOW**

### **Operator View During Aawak Entry:**

#### **Step 1: Select Floor**
```
Floor: Ground Floor
Available Chambers: 3
Total Available Capacity: 1550 bags
```

#### **Step 2: View Chamber Availability**
```
┌──────────┬──────────┬───────────┬──────────┐
│ Chamber  │ Capacity │ Available │ Status   │
├──────────┼──────────┼───────────┼──────────┤
│ A        │ 1000     │ 350       │ Occupied │
│ B        │ 1500     │ 0         │ Occupied │
│ C        │ 1200     │ 1200      │ Available│
└──────────┴──────────┴───────────┴──────────┘
```

#### **Step 3: Allocate Bags**
```
Total Bags to Store: 800
Allocation:
  Chamber A: 350 bags (fills to capacity)
  Chamber C: 450 bags (partial allocation)
```

#### **Step 4: Validation**
```
✓ Chamber A: 350 ≤ 350 available ✓
✓ Chamber C: 450 ≤ 1200 available ✓
✓ Total allocated: 800 = 800 required ✓
```

## **REPORTING AND ANALYTICS**

### **Chamber Metrics:**
1. **Utilization Rate:** Average occupancy over time
2. **Turnover Rate:** How often chamber is filled/emptied
3. **Revenue per Chamber:** Total rent generated
4. **Popular Chambers:** Most frequently used
5. **Idle Time:** Duration between allocations

### **Capacity Reports:**
```
Chamber Utilization Report
─────────────────────────────────────────
Chamber  │ Capacity │ Occupied │ Util%
─────────┼──────────┼──────────┼──────
A        │ 1000     │ 650      │ 65%
B        │ 1500     │ 1500     │ 100%
C        │ 1200     │ 450      │ 38%
─────────┼──────────┼──────────┼──────
Total    │ 3700     │ 2600     │ 70%
```

### **Availability Forecast:**
```
Based on current occupancy:
- 2 chambers fully occupied
- 1 chamber partially occupied (38%)
- Total available capacity: 1100 bags
- Estimated days until full: 15 days (based on avg intake)
```

## **NAMING CONVENTION**

### **Chamber Naming Standards:**

#### **Alphabetic:**
- A, B, C, D... (simple and clear)
- AA, AB, AC... (for many chambers)

#### **Numeric:**
- 1, 2, 3, 4... (sequential)
- 01, 02, 03... (with leading zeros)

#### **Alphanumeric:**
- A1, A2, B1, B2 (section + number)
- 1A, 1B, 2A, 2B (row + column)

#### **Descriptive:**
- North-A, South-B (location-based)
- Cold-1, Dry-2 (type-based)

### **Code Standards:**
```
Recommended Format: {FLOOR_CODE}-{CHAMBER_NAME}
Examples:
  GF-A (Ground Floor, Chamber A)
  F1-01 (First Floor, Chamber 01)
  B1-North (Basement 1, North Chamber)
```

## **ERROR HANDLING**

### **Common Errors:**
1. **Duplicate Code:** "Chamber code '{code}' already exists on this floor"
2. **Invalid Capacity:** "Maximum capacity must be greater than zero"
3. **Over-allocation:** "Cannot allocate {X} bags. Only {Y} bags available"
4. **Negative Capacity:** "Available capacity cannot be negative"
5. **Status Conflict:** "Cannot allocate to chamber in Maintenance status"

### **Warning Messages:**
1. **High Utilization:** "Chamber {name} is 95% full"
2. **Capacity Exceeded:** "Allocation exceeds chamber capacity"
3. **Status Mismatch:** "Occupied chamber marked as Available"
4. **Underutilization:** "Chamber {name} has been empty for 30 days"

### **Validation Messages:**
```javascript
// Real-time validation feedback
if (bags_allocated > available_capacity) {
    showError("Cannot allocate " + bags_allocated + " bags. " +
              "Only " + available_capacity + " bags available in this chamber.");
}

if (chamber.status === "Maintenance") {
    showError("This chamber is under maintenance and unavailable for allocation.");
}

if (chamber.status === "Reserved") {
    showWarning("This chamber is reserved. Proceed with allocation?");
}
```

## **BEST PRACTICES**

### **Chamber Setup:**
1. **Consistent Naming:** Use standard naming convention across facility
2. **Realistic Capacity:** Set achievable capacity considering access space
3. **Regular Updates:** Review and update capacities as needed
4. **Documentation:** Maintain chamber layouts and specifications

### **Capacity Management:**
1. **Safety Buffer:** Don't plan for 100% utilization
2. **Regular Audits:** Physical verification of occupancy
3. **Utilization Goals:** Target 70-80% average utilization
4. **Seasonal Planning:** Anticipate peak season capacity needs

### **Operational Tips:**
1. **Fill Strategy:** Fill chambers completely before starting new ones
2. **Access Priority:** Use easily accessible chambers for high-turnover items
3. **Commodity Segregation:** Group similar commodities in adjacent chambers
4. **Emergency Space:** Maintain empty chamber(s) for urgent allocations

### **Maintenance:**
1. **Scheduled Downtime:** Plan maintenance during low-occupancy periods
2. **Status Updates:** Keep status current with actual conditions
3. **Cleaning Cycles:** Regular cleaning between allocations
4. **Structural Inspections:** Periodic safety and integrity checks

## **PERFORMANCE CONSIDERATIONS**

### **Efficient Queries:**
```javascript
// Get available chambers in floor
function getAvailableChambers(floor_id) {
    return chambers.filter(c => 
        c.floor === floor_id && 
        c.status === "Available" && 
        c.available_capacity > 0
    );
}

// Get chambers needing attention
function getChamberAlerts() {
    return chambers.filter(c => 
        c.utilization_percent > 90 || 
        c.status === "Maintenance"
    );
}
```

### **Caching Strategy:**
- Cache chamber capacity data for quick allocation screens
- Refresh cache on Aawak submission or Jawak release
- Real-time updates for active allocation screens
- Periodic background sync for dashboard displays

## **DATA INTEGRITY**

### **Consistency Checks:**
1. **Occupancy Balance:** occupied_capacity = SUM(Aawak allocations - Jawak releases)
2. **Capacity Limits:** occupied_capacity ≤ max_capacity always
3. **Status Accuracy:** Status matches actual occupancy state
4. **Area Totals:** SUM(chamber areas) ≤ floor total_area

### **Reconciliation:**
```javascript
// Daily reconciliation job
function reconcileChamberOccupancy(chamber_id) {
    let actual = calculateOccupancyFromAawak(chamber_id);
    if (chamber.occupied_capacity !== actual) {
        logDiscrepancy(chamber_id, chamber.occupied_capacity, actual);
        chamber.occupied_capacity = actual;
        chamber.available_capacity = chamber.max_capacity - actual;
    }
}
```

## **FUTURE ENHANCEMENTS**

### **Potential Features:**
1. **Auto-Allocation:** Suggest optimal chamber allocation
2. **Defragmentation:** Consolidate partially filled chambers
3. **Predictive Capacity:** Forecast capacity needs
4. **Dynamic Pricing:** Adjust rates based on occupancy
5. **Chamber Reservation:** Advance booking system
6. **Historical Analytics:** Track usage patterns over time