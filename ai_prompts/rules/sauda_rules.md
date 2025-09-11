# Sauda DocType Scripts

## **IMPLEMENTATION PROMPT TEMPLATE**

```
I need to implement client and server scripts for the Sauda DocType in our Kisan Warehouse Frappe app.

**CRITICAL REQUIREMENTS:**
1. Use ONLY Client Script DocType (created via bench console) - DO NOT create .js files
2. Server script should be minimal: `class Sauda(Document): pass`
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

**Reference:** Use the working Inward implementation as template.
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
bench --site kisan.local reload-doctype Sauda

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
- Keep server scripts minimal: `class Sauda(Document): pass`
- Export fixtures after every change
- Test thoroughly before adding complexity
- Use system restart if you get lock timeouts
- Handle zero values in calculations (use >= 0 instead of > 0)

## **BUSINESS LOGIC REQUIREMENTS**

### **Objective**
Perform automatic calculations and real-time field updates for booking agreements.

### **Fields Involved**
- **Input Fields:** expected_quantity (kg), sauda_rate, booking_date, delivery_duration, payment_duration
- **Calculated Fields:** total_amount, delivery_end_date, payment_end_date, pending_quantity, pending_total_amount

### **Calculations to Implement**
1. **total_amount = (expected_quantity / 100) × sauda_rate** (KG to Quintal conversion)
2. **delivery_end_date = booking_date + delivery_duration (days)**
3. **payment_end_date = booking_date + payment_duration (days)**
4. **Default pending values:**
   - pending_quantity = expected_quantity
   - pending_total_amount = total_amount

### **Requirements**
- Client-side: Real-time updates when input fields change
- Server-side: Minimal validation only (positive values)
- Validation: All quantities, rates, and durations must be >= 0
- Zero Handling: Calculations should work with zero values
- Draft State: Pending values should auto-populate for draft documents
- Date Validation: End dates should be valid and not in the past
- KG-Ton System: All weights in KG, rates per Ton (1000 KG)

## **SUCCESS METRICS**

### **Working Implementation Should:**
- Calculate total_amount in real-time using KG-Ton conversion
- Calculate delivery and payment end dates when durations change
- Auto-populate pending values for draft/new documents
- Handle zero values without errors
- Validate positive values for critical fields
- Support booking amount and cash discount calculations
- Submit forms without hanging/timeout
- Work on both new and edit forms
- Export properly to fixtures
- Maintain data consistency with linked Inward transactions