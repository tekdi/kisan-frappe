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
    """Fetch and process report data with inward minus outward"""
    
    # Build WHERE conditions based on filters
    conditions = get_conditions(filters)
    
    # Main SQL query - Net stock = Inward - Outward per warehouse
    query = """
        SELECT 
            w.name as warehouse_name,
            w.warehouse_name as warehouse_display_name,
            (COALESCE(inward_data.total_bags, 0) - COALESCE(outward_data.total_bags, 0)) as total_bags,
            (COALESCE(inward_data.stock_kg, 0) - COALESCE(outward_data.stock_kg, 0)) as stock_kg,
            (COALESCE(inward_data.total_value, 0) - COALESCE(outward_data.total_value, 0)) as total_value,
            inward_data.products_list as inward_products,
            outward_data.products_list as outward_products
        FROM `tabWarehouse` w
        LEFT JOIN (
            SELECT 
                i.warehouse,
                SUM(iid.item_bags) as total_bags,
                SUM(iid.item_arrival_weight) as stock_kg,
                SUM(iid.item_amount) as total_value,
                GROUP_CONCAT(DISTINCT i.product) as products_list
            FROM `tabInward Item Detail` iid
            INNER JOIN `tabInward` i ON iid.parent = i.name
            WHERE i.docstatus < 2 {conditions}
            GROUP BY i.warehouse
        ) as inward_data ON w.name = inward_data.warehouse
        LEFT JOIN (
            SELECT 
                o.warehouse,
                SUM(oid.item_bags) as total_bags,
                SUM(oid.item_gross_weight) as stock_kg,
                SUM(oid.item_amount) as total_value,
                GROUP_CONCAT(DISTINCT o.product) as products_list
            FROM `tabOutward Item Detail` oid
            INNER JOIN `tabOutward` o ON oid.parent = o.name
            WHERE o.docstatus < 2
            GROUP BY o.warehouse
        ) as outward_data ON w.name = outward_data.warehouse
        WHERE (inward_data.warehouse IS NOT NULL OR outward_data.warehouse IS NOT NULL)
        {warehouse_filter}
        HAVING stock_kg > 0
        ORDER BY stock_kg DESC
    """.format(
        conditions=conditions,
        warehouse_filter="AND w.name = %(warehouse)s" if filters.get("warehouse") else ""
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
        
        # Calculate total unique products with remaining stock
        row.total_products = calculate_active_products(
            row.get('inward_products'),
            row.get('outward_products'),
            row.warehouse_name
        )
        
        # Handle null values
        if not row.total_bags:
            row.total_bags = 0
            
        if not row.stock_kg:
            row.stock_kg = 0.0
            
        if not row.total_value:
            row.total_value = 0.0
            
        # Set warehouse name for display
        if row.warehouse_display_name:
            row.warehouse_name_display = row.warehouse_display_name
        else:
            row.warehouse_name_display = row.warehouse_name
    
    return data

def calculate_active_products(inward_products_str, outward_products_str, warehouse):
    """
    Calculate number of products with remaining stock > 0
    by checking product-level stock for each product
    """
    if not inward_products_str:
        return 0
    
    inward_products = set(inward_products_str.split(',')) if inward_products_str else set()
    outward_products = set(outward_products_str.split(',')) if outward_products_str else set()
    
    # Get all unique products
    all_products = inward_products.union(outward_products)
    
    active_product_count = 0
    
    for product in all_products:
        # Get inward stock for this product in this warehouse
        inward_stock = frappe.db.sql("""
            SELECT COALESCE(SUM(iid.item_arrival_weight), 0) as stock
            FROM `tabInward Item Detail` iid
            INNER JOIN `tabInward` i ON iid.parent = i.name
            WHERE i.warehouse = %s AND i.product = %s AND i.docstatus < 2
        """, (warehouse, product), as_dict=1)
        
        # Get outward stock for this product in this warehouse
        outward_stock = frappe.db.sql("""
            SELECT COALESCE(SUM(oid.item_gross_weight), 0) as stock
            FROM `tabOutward Item Detail` oid
            INNER JOIN `tabOutward` o ON oid.parent = o.name
            WHERE o.warehouse = %s AND o.product = %s AND o.docstatus < 2
        """, (warehouse, product), as_dict=1)
        
        inward_qty = inward_stock[0].stock if inward_stock else 0
        outward_qty = outward_stock[0].stock if outward_stock else 0
        
        net_stock = flt(inward_qty) - flt(outward_qty)
        
        # Only count if product has remaining stock
        if net_stock > 0:
            active_product_count += 1
    
    return active_product_count

def get_conditions(filters):
    """Build SQL WHERE conditions based on filters"""
    conditions = []
    
    # Warehouse filter
    if filters.get("warehouse"):
        conditions.append("i.warehouse = %(warehouse)s")
    
    # Date filtering logic (applies to inward only)
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