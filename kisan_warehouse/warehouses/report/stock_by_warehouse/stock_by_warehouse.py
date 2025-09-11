# Copyright (c) 2025, Kisan Warehouse and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import getdate, today, formatdate, flt, add_days

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    
    return columns, data

def get_columns():
    """Define report columns with proper formatting"""
    return [
        {
            "label": _("Warehouse Name"),
            "fieldname": "warehouse_name",
            "fieldtype": "Link",
            "options": "Warehouse",
            "width": 200
        },
        {
            "label": _("Total Products"),
            "fieldname": "total_products",
            "fieldtype": "Int",
            "width": 120
        },
        {
            "label": _("Total Bags"),
            "fieldname": "total_bags",
            "fieldtype": "Int",
            "width": 100
        },
        {
            "label": _("Stock (Tons)"),
            "fieldname": "stock_tons",
            "fieldtype": "Float",
            "width": 120,
            "precision": 3
        },
        {
            "label": _("Total Value (₹)"),
            "fieldname": "total_value",
            "fieldtype": "Currency",
            "width": 130
        }
    ]

def get_data(filters):
    """Fetch and process report data"""
    
    # Build WHERE conditions based on filters
    conditions = get_conditions(filters)
    
    # Main SQL query - Aggregated by Warehouse
    query = """
        SELECT 
            w.name as warehouse_name,
            w.warehouse_name as warehouse_display_name,
            COUNT(DISTINCT i.product) as total_products,
            SUM(iid.bags) as total_bags,
            SUM(iid.item_arrival_weight) as stock_kg,
            SUM(iid.item_amount) as total_value
        FROM `tabInward Item Detail` iid
        INNER JOIN `tabInward` i ON iid.parent = i.name
        INNER JOIN `tabWarehouse` w ON i.warehouse = w.name
        WHERE i.docstatus < 2 {conditions}
        GROUP BY w.name, w.warehouse_name
        ORDER BY SUM(iid.item_arrival_weight) DESC
    """.format(conditions=conditions)
    
    # Execute query
    data = frappe.db.sql(query, filters, as_dict=1)
    
    # Process calculations and formatting
    for row in data:
        # Calculate tons from KG
        if row.stock_kg:
            row.stock_tons = flt(row.stock_kg / 1000, 3)
        else:
            row.stock_tons = 0.0
            
        # Handle null values
        if not row.total_products:
            row.total_products = 0
            
        if not row.total_bags:
            row.total_bags = 0
            
        if not row.stock_kg:
            row.stock_kg = 0.0
            
        if not row.total_value:
            row.total_value = 0.0
            
        if not row.storage_capacity:
            row.storage_capacity = 0.0
            
        # Set warehouse name for display (use actual warehouse name, not ID)
        if row.warehouse_display_name:
            row.warehouse_name_display = row.warehouse_display_name
        else:
            row.warehouse_name_display = row.warehouse_name
            
   
    return data

def get_conditions(filters):
    """Build SQL WHERE conditions based on filters"""
    conditions = []
    
    # Warehouse filter
    if filters.get("warehouse"):
        conditions.append("i.warehouse = %(warehouse)s")
    
    # Date filtering logic
    date_condition = get_date_condition(filters)
    if date_condition:
        conditions.append(date_condition)
    
    return " AND " + " AND ".join(conditions) if conditions else ""

def get_date_condition(filters):
    """Build date condition based on Filter By selection"""
    
    filter_by = filters.get("filter_by")
    
    if not filter_by or filter_by == "All":
        return ""
    
    from frappe.utils import today, add_days, getdate
    
    today_date = getdate(today())  # Convert string to date object
    
    if filter_by == "Today":
        return f"DATE(i.inward_date) = '{today()}'"
    
    elif filter_by == "Yesterday":
        yesterday = add_days(today(), -1)
        return f"DATE(i.inward_date) = '{yesterday}'"
    
    elif filter_by == "Last 7 Days":
        week_ago = add_days(today(), -7)
        return f"DATE(i.inward_date) BETWEEN '{week_ago}' AND '{today()}'"
    
    elif filter_by == "Current Month":
        # First day of current month
        import datetime
        today_date_obj = getdate(today())
        first_day = today_date_obj.replace(day=1)
        return f"DATE(i.inward_date) BETWEEN '{first_day}' AND '{today()}'"
    
    elif filter_by == "Last Month":
        # First and last day of previous month
        import datetime
        today_date_obj = getdate(today())
        first_day_current = today_date_obj.replace(day=1)
        last_day_last_month = first_day_current - datetime.timedelta(days=1)
        first_day_last_month = last_day_last_month.replace(day=1)
        return f"DATE(i.inward_date) BETWEEN '{first_day_last_month}' AND '{last_day_last_month}'"
    
    elif filter_by == "Custom":
        # Use custom date range
        date_from = filters.get("date_from")
        date_to = filters.get("date_to")
        
        if date_from and date_to:
            return f"DATE(i.inward_date) BETWEEN '{date_from}' AND '{date_to}'"
        elif date_from:
            return f"DATE(i.inward_date) >= '{date_from}'"
        elif date_to:
            return f"DATE(i.inward_date) <= '{date_to}'"
    
    return ""