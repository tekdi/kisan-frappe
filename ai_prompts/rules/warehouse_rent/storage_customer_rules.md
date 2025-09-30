# Storage Customer - AI DocType Creation Guide

```
Create a Frappe v15 DocType for Storage Customer with these specifications:

**Basic Configuration:**
- DocType Name: Storage Customer
- Module: Warehouse Rent
- Naming: Auto-naming with series "SCUST-.YYYY.-.####"
- Track Changes: Yes
- Is Submittable: No
- Custom: No

**Fields (in exact order):**

1. **naming_series** (Select)
   - Hidden: Yes
   - Default: "SCUST-.YYYY.-.####"

2. **Section Break:** Customer Information

3. **customer_type** (Select)
   - Label: Customer Type
   - Mandatory: Yes
   - Options: Individual, Company
   - Default: Individual
   - In List View: No

4. **Column Break**

5. **first_name** (Data)
   - Label: First Name
   - Mandatory: Yes
   - Length: 100
   - In List View: Yes

6. **middle_name** (Data)
   - Label: Middle Name
   - Mandatory: No
   - Length: 100

7. **Column Break**

8. **last_name** (Data)
   - Label: Last Name
   - Mandatory: Yes
   - Length: 100
   - In List View: Yes

9. **nick_name** (Data)
   - Label: Nick Name
   - Mandatory: No
   - Length: 100

10. **Section Break:** Contact Details

11. **mobile** (Data)
    - Label: Mobile Number
    - Mandatory: Yes
    - Unique: Yes
    - Length: 10
    - In List View: Yes

12. **Column Break**

13. **alternate_mobile** (Data)
    - Label: Alternate Mobile
    - Mandatory: No
    - Length: 10

14. **Column Break**

15. **email** (Data)
    - Label: Email
    - Mandatory: No
    - Length: 140

16. **Section Break:** Address Information

17. **address** (Small Text)
    - Label: Address
    - Mandatory: Yes
    - Rows: 3

18. **Column Break**

19. **city** (Data)
    - Label: City
    - Mandatory: Yes
    - Length: 100

20. **state** (Data)
    - Label: State
    - Mandatory: Yes
    - Length: 100

21. **Column Break**

22. **zip** (Data)
    - Label: ZIP Code
    - Mandatory: Yes
    - Length: 6

23. **Section Break:** Status

24. **status** (Select)
    - Label: Status
    - Mandatory: Yes
    - Options: Active, Inactive
    - Default: Active

**Additional Settings:**
- Title Field: first_name
- Search Fields: first_name, last_name, mobile, email
- Sort Field: modified
- Sort Order: DESC

**Permissions:**
- System Manager: All rights
- Kisan Admin: Create, Read, Write
- Kisan Accountant: Create, Read, Write
- Kisan Operator: Create, Read, Write

**File Location:**
apps/kisan_warehouse/kisan_warehouse/warehouse_rent/doctype/storage_customer/

Create:
1. storage_customer.json (DocType definition – must be added in doctype.json after DocType creation)
2. storage_customer.py (Minimal server script: class StorageCustomer(Document): pass)
3. __init__.py (empty file)
```


---

## 📋 FIELD REFERENCE TABLE

| Field Name | Label | Type | Required | Unique | Length | Options/Default |
|------------|-------|------|----------|--------|--------|-----------------|
| customer_type | Customer Type | Select | Yes | No | - | Individual, Company (Default: Individual) |
| first_name | First Name | Data | Yes | No | 100 | - |
| middle_name | Middle Name | Data | No | No | 100 | - |
| last_name | Last Name | Data | Yes | No | 100 | - |
| nick_name | Nick Name | Data | No | No | 100 | - |
| address | Address | Small Text | Yes | No | - | 3 rows |
| city | City | Data | Yes | No | 100 | - |
| state | State | Data | Yes | No | 100 | - |
| zip | ZIP Code | Data | Yes | No | 6 | - |
| mobile | Mobile Number | Data | Yes | Yes | 10 | - |
| alternate_mobile | Alternate Mobile | Data | No | No | 10 | - |
| email | Email | Data | No | No | 140 | - |
| status | Status | Select | Yes | No | - | Active, Inactive (Default: Active) |

---

## ⚙️ POST-CREATION COMMANDS

Run these commands after DocType is created:

```bash
# 1. Export fixtures
bench --site kisan-new.localhost export-fixtures

# 2. Migrate database
bench --site kisan-new.localhost migrate

# 3. Reload DocType
bench --site kisan-new.localhost reload-doctype "Storage Customer"

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

- [ ] DocType appears in Warehouse Rent module
- [ ] All 13 data fields + 1 naming field present
- [ ] Naming series generates SCUST-2025-0001 format
- [ ] Can create new Storage Customer
- [ ] Mobile uniqueness enforced
- [ ] Status defaults to "Active"
- [ ] Customer Type defaults to "Individual"
- [ ] Search by name/mobile works
- [ ] List view shows first_name, last_name, mobile

---

# Storage Customer DocType Scripts

## **IMPLEMENTATION PROMPT TEMPLATE**

```
I need to implement client and server scripts for the Storage Customer DocType in our Kisan Warehouse Frappe app.

**CRITICAL REQUIREMENTS:**
1. Use ONLY Client Script DocType (created via bench console) - DO NOT create .js files
2. Server script should be minimal: `class StorageCustomer(Document): pass`
3. All calculations must be client-side only
4. No server-side validation that could cause database locks
5. Follow Frappe v15 standards

**Business Logic:**
[See calculations below]

**Implementation Steps:**
1. First implement basic field auto-population
2. Test thoroughly before adding validations
3. Export fixtures after each working change
4. Use bench console for Client Script creation
5. Keep server script minimal to avoid timeout issues

**Reference:** Use the working Customer master implementations as template.
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
bench --site kisan-new.localhost reload-doctype "Storage Customer"

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

Client script Requirements:
- All validations run only on blur (not keypress).
- Show frappe.msgprint with clear error message.
- Reset invalid field value if validation fails.
- Use `frm.set_value()` safely to update values (avoid infinite loop).
- Keep code modular and reusable for other Doctypes.


### **What ALWAYS Works:**
- Use Client Script DocType via bench console
- Keep server scripts minimal: `class StorageCustomer(Document): pass`
- Export fixtures after every change
- Test thoroughly before adding complexity
- Use system restart if you get lock timeouts
- Handle empty/null values gracefully

## **BUSINESS LOGIC REQUIREMENTS**

### **Objective**
Manage storage rental customer master data with automatic name generation and contact information validation for warehouse rental operations.

### **Fields Involved**

#### **DocType Fields:**
- **Input Fields:** customer_type, first_name, middle_name, last_name, address, city, state, zip, mobile, alternate_mobile, email, status
- **Auto-populated Fields:** None (simple master data)
- **Display Fields:** Full name display (concatenated from name fields)

### **Auto-population Logic to Implement**

#### **1. Full Name Display**
- **Display Logic:** Show full name as "first_name middle_name last_name" 
- **Usage:** For dropdown displays and reports
- **Format:** 
    "FirstName MiddleName LastName"

### **Validation Requirements**

#### **Contact Validation:**
1. **Mobile Number:** 10-digit Indian mobile format
2. **Alternate Mobile:** Different from primary mobile
3. **Email:** Valid email format (if provided)
4. **ZIP Code:** Valid Indian PIN code format (6 digits)

#### **Required Field Validation:**
1. **customer_type:** Must be selected (Individual or Company)
2. **first_name:** Cannot be empty
3. **last_name:** Cannot be empty
4. **address:** Complete address required
5. **city, state:** Location information required
6. **mobile:** Primary contact required
7. **status:** Default to 'Active'

### **Requirements**
- **Client-side:** Simple field validations and auto-formatting
- **Server-side:** Minimal validation only (required fields)
- **Data Formatting:** Auto-capitalize names, format mobile numbers
- **User Experience:** Clear error messages for validation failures
- **Draft State:** Allow saving with partial data in draft
- **Master Data:** Simple, clean customer information storage

### **Field Triggers Required**

#### **Field Triggers:**
- **first_name, middle_name, last_name** → Update display name
- **mobile** → Format and validate mobile number
- **alternate_mobile** → Validate uniqueness from primary mobile
- **email** → Validate email format
- **zip** → Validate PIN code format

### **Key Implementation Notes**
- **Simple Master:** No complex calculations, focus on data quality
- **Name Handling:** Proper concatenation and display of customer names
- **Contact Validation:** Ensure valid Indian mobile and PIN formats
- **Status Management:** Track active/inactive customers
- **User-Friendly:** Clear field labels and helpful validation messages

## **SUCCESS METRICS**

### **Working Implementation Should:**
- Auto-format and validate mobile numbers
- Validate email format when provided
- Ensure unique alternate mobile from primary
- Validate PIN code format
- Display full customer name properly
- Save with all required fields validated
- Handle both Individual and Company customer types
- Submit forms without hanging/timeout
- Work on both new and edit forms
- Export properly to fixtures
- Support quick customer search by name or mobile

## **SPECIFIC STORAGE CUSTOMER CONSIDERATIONS**

### **Customer Types:**
- **Individual:** Farmers, small traders storing personal stock
- **Company:** Agricultural businesses, larger storage clients
- **Different Requirements:** May have different billing or contract terms

### **Contact Information:**
- **Primary Mobile:** Main contact for all communications
- **Alternate Mobile:** Backup contact for emergencies
- **Email:** Optional but useful for invoices and reports
- **Address:** Complete for delivery and legal documentation

### **Status Management:**
- **Active:** Currently using storage services
- **Inactive:** Past customers or suspended accounts
- **Usage:** Filter active customers in transactions

### **Data Quality:**
- **Name Consistency:** Proper capitalization and formatting
- **Contact Verification:** Valid mobile numbers for SMS/calls
- **Address Completeness:** Full address for legal compliance
- **Duplicate Prevention:** Check for existing customers before creating new

## **VALIDATION RULES**

### **Must Have Validations:**
1. **Mobile Format:** Exactly 10 digits, starting with 6-9
2. **PIN Code:** Exactly 6 digits
3. **Email Format:** Valid email pattern (if provided)
4. **Alternate Mobile:** Must be different from primary mobile
5. **Required Fields:** customer_type, first_name, last_name, address, city, state, zip, mobile, status

### **Optional Business Validations:**
1. **Duplicate Check:** Check if customer already exists by mobile number
2. **Name Similarity:** Warn if similar customer name exists
3. **Address Validation:** Verify city/state/PIN combination
4. **Credit Limit:** Set default credit limit for new customers

## **DISPLAY FORMATTING**


### **Mobile Display:**
- Format: +91-98765-43210 (with country code)
- Storage: 9876543210 (without formatting)

### **Address Display:**
- Multi-line format for readability
- Include city, state, PIN code in standard format



## **NAMING CONVENTION**

### **Auto-Naming:**
- **Series:** SCUST-.YYYY.-.####
- **Example:** SCUST-2025-0001
- **Uniqueness:** Ensured by naming series
- **Sequential:** Auto-incremented per year

## **USER INTERFACE CONSIDERATIONS**

### **Field Organization:**
- **Section 1:** Customer Type and Name fields
- **Section 2:** Contact Information (mobile, email)
- **Section 3:** Address Details (address, city, state, ZIP)
- **Section 4:** Status

### **Field Behavior:**
- **Auto-Capitalize:** First letters of names
- **Auto-Format:** Mobile numbers with proper spacing
- **Real-time Validation:** Immediate feedback on field blur
- **Smart Defaults:** Status = 'Active' for new customers

## **PERMISSIONS & SECURITY**

### **Role-Based Access:**
- **System Manager:** Full access (CRUD)
- **Kisan Admin:** Create, Read, Update (no delete)
- **Kisan Accountant:** Create, Read, Update (no delete)
- **Kisan Operator:** Create, Read, Update (no delete)

### **Data Privacy:**
- **Mobile Numbers:** Sensitive contact information
- **Address:** Personal identification data
- **Email:** Private communication channel
- **Compliance:** Follow data protection regulations