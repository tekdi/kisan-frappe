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
            "label": _("Outward ID"),
            "fieldname": "outward_id",
            "fieldtype": "Link",
            "options": "Outward",
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
            "label": _("Outward Date"),
            "fieldname": "outward_date",
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
            "fieldname": "payment_status",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Days Status"),
            "fieldname": "days_status",
            "fieldtype": "Data",
            "width": 120
        }
    ]

def get_data(filters):
    """Fetch and process report data"""
    
    conditions = get_conditions(filters)
    
    query = """
        SELECT 
            o.name as outward_id,
            COALESCE(o.sauda, '') as sauda_id,
            COALESCE(CONCAT(c.first_name, ' ', c.last_name), 'No Customer') as customer_name,
            COALESCE(CONCAT(b.first_name, ' ', b.last_name), 'No Broker') as broker_name,
            COALESCE(p.product_name, 'No Product') as product_name,
            COALESCE(w.warehouse_name, 'No Warehouse') as warehouse_name,
            o.outward_date,
            COALESCE(o.net_total, 0) as net_total,
            COALESCE(o.total_amount_paid, 0) as total_amount_paid,
            COALESCE(o.total_amount_pending, o.net_total) as total_amount_pending,
            o.payment_due_date,
            COALESCE(o.payment_status, 'pending') as payment_status,
            DATEDIFF(CURDATE(), o.payment_due_date) as days_difference,
            o.customer as customer_id,
            COALESCE(c.bank_account_name, '') as bank_account_name,
            COALESCE(c.bank_account_no, '') as bank_account_no,
            COALESCE(c.ifsc_code, '') as ifsc_code,
            COALESCE(c.bank_name, '') as bank_name
        FROM `tabOutward` o
        LEFT JOIN `tabCustomer` c ON o.customer = c.name
        LEFT JOIN `tabBroker` b ON o.broker = b.name  
        LEFT JOIN `tabProduct` p ON o.product = p.name
        LEFT JOIN `tabWarehouse` w ON o.warehouse = w.name
        LEFT JOIN `tabSauda` s ON o.sauda = s.name
        WHERE o.docstatus < 2 
        AND s.booking_type = 'Outward / Sales' {conditions}
        ORDER BY o.payment_due_date ASC, o.total_amount_pending DESC
    """.format(conditions=conditions)
    
    data = frappe.db.sql(query, filters, as_dict=1)
    
    for row in data:
        if not row.total_amount_paid:
            row.total_amount_paid = 0
            
        if not row.total_amount_pending:
            row.total_amount_pending = row.net_total
            
        row.total_amount_pending = flt(row.net_total - row.total_amount_paid, 2)
        
        days_diff = row.days_difference
        if days_diff > 0:
            row.days_status = f"{days_diff} Days Overdue"
            row.urgency = "Overdue"
        elif days_diff == 0:
            row.days_status = "Due Today"
            row.urgency = "Due Today"
        else:
            days_future = abs(days_diff)
            row.days_status = f"Due in {days_future} Days"
            row.urgency = "Upcoming"
            
        if not row.sauda_id:
            row.sauda_id = "-"
            
        if not row.bank_account_name:
            row.bank_account_name = ""
        if not row.bank_account_no:
            row.bank_account_no = ""
        if not row.ifsc_code:
            row.ifsc_code = ""
        if not row.bank_name:
            row.bank_name = ""
    
    return data

def get_conditions(filters):
    """Build SQL WHERE conditions based on filters"""
    conditions = []
    
    conditions.append("o.payment_status IN ('pending', 'processing')")
    conditions.append("o.total_amount_pending > 0")
    
    if filters.get("customer"):
        conditions.append("o.customer = %(customer)s")
    
    if filters.get("broker"):
        conditions.append("o.broker = %(broker)s")
    
    if filters.get("product"):
        conditions.append("o.product = %(product)s")
    
    if filters.get("warehouse"):
        conditions.append("o.warehouse = %(warehouse)s")
    
    if filters.get("payment_due_date_from"):
        conditions.append("o.payment_due_date >= %(payment_due_date_from)s")
    
    if filters.get("payment_due_date_to"):
        conditions.append("o.payment_due_date <= %(payment_due_date_to)s")
    
    if filters.get("payment_status"):
        if filters.get("payment_status") == "Pending":
            conditions.append("o.payment_status = 'pending'")
        elif filters.get("payment_status") == "Processing":
            conditions.append("o.payment_status = 'processing'")
        elif filters.get("payment_status") == "Success":
            conditions.append("o.payment_status = 'success'")
        elif filters.get("payment_status") == "Failed":
            conditions.append("o.payment_status = 'failed'")
    
    if not filters.get("payment_due_date_from") and not filters.get("payment_due_date_to"):
        if not filters.get("show_all"):
            conditions.append("o.payment_due_date = CURDATE()")
    
    return " AND " + " AND ".join(conditions) if conditions else ""

@frappe.whitelist()
def get_customer_bank_details(customer_ids):
    """Get bank details for customers"""
    import json
    
    if isinstance(customer_ids, str):
        customer_ids = json.loads(customer_ids)
    
    if not customer_ids:
        return {}
    
    placeholders = ', '.join(['%s'] * len(customer_ids))
    
    query = f"""
        SELECT 
            name as customer_id,
            COALESCE(bank_account_name, '') as bank_account_name,
            COALESCE(bank_account_no, '') as bank_account_no,
            COALESCE(ifsc_code, '') as ifsc_code,
            COALESCE(bank_name, '') as bank_name
        FROM `tabCustomer` 
        WHERE name IN ({placeholders})
    """
    
    bank_details = frappe.db.sql(query, customer_ids, as_dict=True)
    
    result = {}
    for detail in bank_details:
        result[detail.customer_id] = {
            'bank_account_name': detail.bank_account_name,
            'bank_account_no': detail.bank_account_no,
            'ifsc_code': detail.ifsc_code,
            'bank_name': detail.bank_name
        }
    
    return result