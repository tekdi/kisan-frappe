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
            "label": _("Product Name"),
            "fieldname": "product_name",
            "fieldtype": "Link",
            "options": "Product",
            "width": 200
        },
        {
            "label": _("Total Bags"),
            "fieldname": "total_bags",
            "fieldtype": "Int",
            "width": 100
        },
        {
            "label": _("Stock (KG)"),
            "fieldname": "stock_kg",
            "fieldtype": "Float",
            "width": 120,
            "precision": 2
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
        },
        {
            "label": _("Warehouses"),
            "fieldname": "warehouse_count",
            "fieldtype": "Int",
            "width": 100
        }
    ]

def get_data(filters):
    """Fetch and process report data with inward minus outward"""
    
    # Build WHERE conditions based on filters
    conditions = get_conditions(filters)
    
    # Main SQL query - Net stock = Inward - Outward
    query = """
        SELECT 
            p.name as product_name,
            p.product_name as product_display_name,
            (COALESCE(inward_data.total_bags, 0) - COALESCE(outward_data.total_bags, 0)) as total_bags,
            (COALESCE(inward_data.total_weight, 0) - COALESCE(outward_data.total_weight, 0)) as stock_kg,
            (COALESCE(inward_data.total_amount, 0) - COALESCE(outward_data.total_amount, 0)) as total_value,
            COALESCE(inward_data.warehouse_count, 0) as warehouse_count
        FROM `tabProduct` p
        LEFT JOIN (
            SELECT 
                i.product,
                SUM(iid.item_bags) as total_bags,
                SUM(iid.item_arrival_weight) as total_weight,
                SUM(iid.item_amount) as total_amount,
                COUNT(DISTINCT i.warehouse) as warehouse_count
            FROM `tabInward Item Detail` iid
            INNER JOIN `tabInward` i ON iid.parent = i.name
            WHERE i.docstatus < 2 {conditions}
            GROUP BY i.product
        ) as inward_data ON p.name = inward_data.product
        LEFT JOIN (
            SELECT 
                o.product,
                SUM(oid.item_bags) as total_bags,
                SUM(oid.item_gross_weight) as total_weight,
                SUM(oid.item_amount) as total_amount
            FROM `tabOutward Item Detail` oid
            INNER JOIN `tabOutward` o ON oid.parent = o.name
            WHERE o.docstatus < 2
            GROUP BY o.product
        ) as outward_data ON p.name = outward_data.product
        WHERE (inward_data.product IS NOT NULL OR outward_data.product IS NOT NULL)
        {product_filter}
        HAVING stock_kg > 0
        ORDER BY stock_kg DESC
    """.format(
        conditions=conditions,
        product_filter="AND p.name = %(product)s" if filters.get("product") else ""
    )
    
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
        if not row.total_bags:
            row.total_bags = 0
            
        if not row.stock_kg:
            row.stock_kg = 0.0
            
        if not row.total_value:
            row.total_value = 0.0
            
        if not row.warehouse_count:
            row.warehouse_count = 0
            
        # Set product name for display
        if row.product_display_name:
            row.product_name_display = row.product_display_name
        else:
            row.product_name_display = row.product_name
    
    return data

def get_conditions(filters):
    """Build SQL WHERE conditions based on filters"""
    conditions = []
    
    # Product filter
    if filters.get("product"):
        conditions.append("i.product = %(product)s")
    
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
        return f"DATE(i.arrival_date) = '{today()}'"
    
    elif filter_by == "Yesterday":
        yesterday = add_days(today(), -1)
        return f"DATE(i.arrival_date) = '{yesterday}'"
    
    elif filter_by == "Last 7 Days":
        week_ago = add_days(today(), -7)
        return f"DATE(i.arrival_date) BETWEEN '{week_ago}' AND '{today()}'"
    
    elif filter_by == "Current Month":
        # First day of current month
        import datetime
        today_date_obj = getdate(today())
        first_day = today_date_obj.replace(day=1)
        return f"DATE(i.arrival_date) BETWEEN '{first_day}' AND '{today()}'"
    
    elif filter_by == "Last Month":
        # First and last day of previous month
        import datetime
        today_date_obj = getdate(today())
        first_day_current = today_date_obj.replace(day=1)
        last_day_last_month = first_day_current - datetime.timedelta(days=1)
        first_day_last_month = last_day_last_month.replace(day=1)
        return f"DATE(i.arrival_date) BETWEEN '{first_day_last_month}' AND '{last_day_last_month}'"
    
    elif filter_by == "Custom":
        # Use custom date range
        date_from = filters.get("date_from")
        date_to = filters.get("date_to")
        
        if date_from and date_to:
            return f"DATE(i.arrival_date) BETWEEN '{date_from}' AND '{date_to}'"
        elif date_from:
            return f"DATE(i.arrival_date) >= '{date_from}'"
        elif date_to:
            return f"DATE(i.arrival_date) <= '{date_to}'"
    
    return ""