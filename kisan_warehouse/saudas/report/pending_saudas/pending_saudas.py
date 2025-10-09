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
            "label": _("Booking Date"),
            "fieldname": "booking_date",
            "fieldtype": "Date",
            "width": 100
        },
        {
            "label": _("Expected Qty (Tons)"),
            "fieldname": "expected_quantity",
            "fieldtype": "Float",
            "width": 120,
            "precision": 2
        },
        {
            "label": _("Pending Qty (Tons)"),
            "fieldname": "pending_quantity",
            "fieldtype": "Float",
            "width": 120,
            "precision": 2
        },
        {
            "label": _("Delivery End Date"),
            "fieldname": "delivery_end_date",
            "fieldtype": "Date",
            "width": 120
        },
        {
            "label": _("Payment End Date"),
            "fieldname": "payment_end_date",
            "fieldtype": "Date",
            "width": 120
        },
        {
            "label": _("Days Overdue"),
            "fieldname": "days_overdue",
            "fieldtype": "Int",
            "width": 100
        },
        {
            "label": _("Total Amount"),
            "fieldname": "total_amount",
            "fieldtype": "Currency",
            "width": 120
        },
        {
            "label": _("Status"),
            "fieldname": "sauda_status",
            "fieldtype": "Data",
            "width": 100
        }
    ]

def get_data(filters):
    """Fetch and process report data"""
    
    # Build WHERE conditions based on filters
    conditions = get_conditions(filters)
    
    # Main SQL query
    query = """
        SELECT 
            s.name as sauda_id,
            COALESCE(c.first_name, '') as customer_name,
            COALESCE(CONCAT(c.first_name, ' ', c.last_name), 'No Customer') as customer_full_name,
            COALESCE(CONCAT(b.first_name, ' ', b.last_name), 'No Broker') as broker_name,
            COALESCE(p.product_name, 'No Product') as product_name,
            COALESCE(w.warehouse_name, 'No Warehouse') as warehouse_name,
            s.booking_date,
            s.expected_quantity,
            s.pending_quantity,
            s.delivery_end_date,
            s.payment_end_date,
            s.delivery_duration,
            s.total_amount,
            s.booking_amount,
            s.sauda_status,
            COALESCE(DATEDIFF(CURDATE(), s.delivery_end_date), 0) as days_overdue
        FROM `tabSauda` s
        LEFT JOIN `tabCustomer` c ON s.customer = c.name
        LEFT JOIN `tabBroker` b ON s.broker = b.name  
        LEFT JOIN `tabProduct` p ON s.product = p.name
        LEFT JOIN `tabWarehouse` w ON s.warehouse = w.name
        WHERE s.docstatus < 2 {conditions}
        ORDER BY s.delivery_end_date ASC, s.pending_quantity DESC
    """.format(conditions=conditions)
    
    # Execute query
    data = frappe.db.sql(query, filters, as_dict=1)
    
    # Process calculations and formatting
    for row in data:
        # Format customer name
        row.customer_name = row.customer_full_name
        
        # Ensure days_overdue is not None
        if row.days_overdue is None:
            row.days_overdue = 0
        
        # Handle negative days (future dates)
        if row.days_overdue < 0:
            row.days_overdue = 0
            
        # Add urgency indicator (for future use)
        if row.days_overdue > 0:
            row.urgency = "Overdue"
        elif row.days_overdue == 0:
            row.urgency = "Due Today"
        else:
            row.urgency = "Upcoming"
    
    return data

def get_conditions(filters):
    """Build SQL WHERE conditions based on filters"""
    conditions = []
    
    # Core business logic: Only show pending saudas
    conditions.append("s.pending_quantity > 0")
    
    # Customer filter
    if filters.get("customer"):
        conditions.append("s.customer = %(customer)s")
    
    # Broker filter
    if filters.get("broker"):
        conditions.append("s.broker = %(broker)s")
    
    # Product filter
    if filters.get("product"):
        conditions.append("s.product = %(product)s")
    
    # Warehouse filter
    if filters.get("warehouse"):
        conditions.append("s.warehouse = %(warehouse)s")
    
    # Delivery date range filters
    if filters.get("delivery_date_from"):
        conditions.append("s.delivery_end_date >= %(delivery_date_from)s")
    
    if filters.get("delivery_date_to"):
        conditions.append("s.delivery_end_date <= %(delivery_date_to)s")
    
    # Payment date range filters
    if filters.get("payment_date_from"):
        conditions.append("s.payment_end_date >= %(payment_date_from)s")
    
    if filters.get("payment_date_to"):
        conditions.append("s.payment_end_date <= %(payment_date_to)s")
    
    # Sauda status filter
    if filters.get("sauda_status"):
        conditions.append("s.sauda_status = %(sauda_status)s")
    
    # Default filter: Show today's pending if no delivery date filter provided
    if not filters.get("delivery_date_from") and not filters.get("delivery_date_to"):
        if not filters.get("show_all"):
            conditions.append("s.delivery_end_date = CURDATE()")
    
    return " AND " + " AND ".join(conditions) if conditions else ""