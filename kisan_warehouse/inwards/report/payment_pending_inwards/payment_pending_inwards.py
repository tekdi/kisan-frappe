# Copyright (c) 2025, Kisan Warehouse and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import getdate, today, formatdate, flt

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    
    return columns, data

def get_columns():
    """Define report columns with proper formatting"""
    return [
        {
            "label": _("Inward ID"),
            "fieldname": "inward_id",
            "fieldtype": "Link",
            "options": "Inward",
            "width": 140
        },
        {
            "label": _("Sauda ID"),
            "fieldname": "sauda_id",
            "fieldtype": "Link",
            "options": "Sauda",
            "width": 140
        },
        {
            "label": _("Customer"),
            "fieldname": "customer_name",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": _("Broker"),
            "fieldname": "broker_name",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("Product"),
            "fieldname": "product_name",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("Warehouse"),
            "fieldname": "warehouse_name",
            "fieldtype": "Data",
            "width": 130
        },
        {
            "label": _("Inward Date"),
            "fieldname": "inward_date",
            "fieldtype": "Date",
            "width": 100
        },
        {
            "label": _("Net Total Amount"),
            "fieldname": "net_total",
            "fieldtype": "Currency",
            "width": 130
        },
        {
            "label": _("Amount Paid"),
            "fieldname": "total_amount_paid",
            "fieldtype": "Currency",
            "width": 120
        },
        {
            "label": _("Amount Pending"),
            "fieldname": "total_amount_pending",
            "fieldtype": "Currency",
            "width": 130
        },
        {
            "label": _("Payment Due Date"),
            "fieldname": "payment_due_date",
            "fieldtype": "Date",
            "width": 120
        },
        {
            "label": _("Payment Status"),
            "fieldname": "inward_payment_status",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Days Status"),
            "fieldname": "days_status",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("Payment Notes"),
            "fieldname": "payment_notes",
            "fieldtype": "Data",
            "width": 150
        }
    ]

def get_data(filters):
    """Fetch and process report data"""
    
    # Build WHERE conditions based on filters
    conditions = get_conditions(filters)
    
    # Main SQL query
    query = """
        SELECT 
            i.name as inward_id,
            COALESCE(i.sauda, '') as sauda_id,
            COALESCE(CONCAT(c.first_name, ' ', c.last_name), 'No Customer') as customer_name,
            COALESCE(CONCAT(b.first_name, ' ', b.last_name), 'No Broker') as broker_name,
            COALESCE(p.product_name, 'No Product') as product_name,
            COALESCE(w.warehouse_name, 'No Warehouse') as warehouse_name,
            i.inward_date,
            i.net_total,
            COALESCE(i.total_amount_paid, 0) as total_amount_paid,
            COALESCE(i.total_amount_pending, i.net_total) as total_amount_pending,
            i.payment_due_date,
            COALESCE(i.inward_payment_status, 'pending') as inward_payment_status,
            DATEDIFF(CURDATE(), i.payment_due_date) as days_difference,
            (SELECT ip.payment_note FROM `tabInward Payment` ip 
             WHERE ip.parent = i.name 
             ORDER BY ip.payment_date DESC 
             LIMIT 1) as payment_notes
        FROM `tabInward` i
        LEFT JOIN `tabCustomer` c ON i.customer = c.name
        LEFT JOIN `tabBroker` b ON i.broker = b.name  
        LEFT JOIN `tabProduct` p ON i.product = p.name
        LEFT JOIN `tabWarehouse` w ON i.warehouse = w.name
        WHERE i.docstatus < 2 {conditions}
        ORDER BY i.payment_due_date ASC, i.total_amount_pending DESC
    """.format(conditions=conditions)
    
    # Execute query
    data = frappe.db.sql(query, filters, as_dict=1)
    
    # Process calculations and formatting
    for row in data:
        # Handle null values
        if not row.total_amount_paid:
            row.total_amount_paid = 0
            
        if not row.total_amount_pending:
            row.total_amount_pending = row.net_total
            
        # Calculate actual pending amount
        row.total_amount_pending = flt(row.net_total - row.total_amount_paid, 2)
        
        # CORRECT Days Logic (as you suggested)
        days_diff = row.days_difference
        if days_diff > 0:
            # Past due date - Overdue
            row.days_status = f"{days_diff} Days Overdue"
            row.urgency = "Overdue"
        elif days_diff == 0:
            # Due today
            row.days_status = "Due Today"
            row.urgency = "Due Today"
        else:
            # Future date - Upcoming
            days_future = abs(days_diff)
            row.days_status = f"Due in {days_future} Days"
            row.urgency = "Upcoming"
            
        # Clean up payment notes
        if not row.payment_notes:
            row.payment_notes = "-"
            
        # Handle missing Sauda ID
        if not row.sauda_id:
            row.sauda_id = "-"
    
    return data

def get_conditions(filters):
    """Build SQL WHERE conditions based on filters"""
    conditions = []
    
    # Core business logic: Only show pending payments (exactly as per PDF)
    conditions.append("i.inward_payment_status = 'pending'")
    conditions.append("i.total_amount_pending > 0")
    
    # Customer filter
    if filters.get("customer"):
        conditions.append("i.customer = %(customer)s")
    
    # Broker filter
    if filters.get("broker"):
        conditions.append("i.broker = %(broker)s")
    
    # Product filter
    if filters.get("product"):
        conditions.append("i.product = %(product)s")
    
    # Warehouse filter
    if filters.get("warehouse"):
        conditions.append("i.warehouse = %(warehouse)s")
    
    # Payment due date range filters
    if filters.get("payment_due_date_from"):
        conditions.append("i.payment_due_date >= %(payment_due_date_from)s")
    
    if filters.get("payment_due_date_to"):
        conditions.append("i.payment_due_date <= %(payment_due_date_to)s")
    
    # Payment status filter (updated logic)
    if filters.get("payment_status"):
        if filters.get("payment_status") == "Pending":
            conditions.append("i.inward_payment_status = 'pending'")
        elif filters.get("payment_status") == "Processing":
            conditions.append("i.inward_payment_status = 'processing'")
        elif filters.get("payment_status") == "Success":
            conditions.append("i.inward_payment_status = 'success'")
    
    # Default filter: Show today's pending if no payment due date filter provided
    if not filters.get("payment_due_date_from") and not filters.get("payment_due_date_to"):
        if not filters.get("show_all"):
            conditions.append("i.payment_due_date = CURDATE()")
    
    return " AND " + " AND ".join(conditions) if conditions else ""