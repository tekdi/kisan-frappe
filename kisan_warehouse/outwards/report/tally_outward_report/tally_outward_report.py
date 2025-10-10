import frappe
from frappe import _
from frappe.utils import flt, getdate, formatdate, nowdate

def execute(filters=None):
    """Main function to execute the report"""
    if not filters:
        filters = {}
    
    if not filters.get("from_date"):
        filters["from_date"] = frappe.utils.add_months(nowdate(), -1)
    if not filters.get("to_date"):
        filters["to_date"] = nowdate()
    
    columns = get_columns()
    data = get_data(filters)
    
    return columns, data

def get_columns():
    """Define report columns with proper widths - Outward format"""
    return [
        {
            "label": _("Customer A/c"),
            "fieldname": "customer_account",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("Customer Name"),
            "fieldname": "customer_name", 
            "fieldtype": "Data",
            "width": 180
        },
        {
            "label": _("State Name"),
            "fieldname": "state",
            "fieldtype": "Data", 
            "width": 80
        },
        {
            "label": _("GSTIN"),
            "fieldname": "gstin",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("Voucher Type"),
            "fieldname": "voucher_type",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Product Name"),
            "fieldname": "product_name",
            "fieldtype": "Data",
            "width": 140
        },
        {
            "label": _("Warehouse"),
            "fieldname": "warehouse_name",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("Quantity"),
            "fieldname": "quantity",
            "fieldtype": "Float",
            "width": 90,
            "precision": 2
        },
        {
            "label": _("Rate"),
            "fieldname": "rate",
            "fieldtype": "Currency",
            "width": 90,
            "precision": 2
        },
        {
            "label": _("Amount"),
            "fieldname": "amount", 
            "fieldtype": "Currency",
            "width": 110,
            "precision": 2
        },
        {
            "label": _("Broker Commission %"),
            "fieldname": "broker_commission_percent",
            "fieldtype": "Percent",
            "width": 90,
            "precision": 2
        },
        {
            "label": _("Broker Commission"),
            "fieldname": "broker_commission_amount",
            "fieldtype": "Currency", 
            "width": 110,
            "precision": 2
        },
        {
            "label": _("Voucher No"),
            "fieldname": "voucher_no",
            "fieldtype": "Link",
            "options": "Outward",
            "width": 110
        },
        {
            "label": _("Outward Date"),
            "fieldname": "outward_date",
            "fieldtype": "Date",
            "width": 100
        },
        {
            "label": _("Status"),
            "fieldname": "status",
            "fieldtype": "Data",
            "width": 90
        },
        {
            "label": _("Vehicle"),
            "fieldname": "vehicle",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("HSN"),
            "fieldname": "hsn_code",
            "fieldtype": "Data", 
            "width": 80
        },
        {
            "label": _("UNIT"),
            "fieldname": "uom",
            "fieldtype": "Data",
            "width": 60
        }
    ]

def get_data(filters):
    """Fetch and format data based on filters"""
    
    conditions = []
    values = []
    
    conditions.append("o.outward_date BETWEEN %s AND %s")
    values.extend([filters["from_date"], filters["to_date"]])
    
    if filters.get("customer"):
        conditions.append("o.customer = %s")
        values.append(filters["customer"])
        
    if filters.get("warehouse"):
        conditions.append("o.warehouse = %s") 
        values.append(filters["warehouse"])
        
    if filters.get("product"):
        conditions.append("o.product = %s")
        values.append(filters["product"])
        
    if filters.get("broker"):
        conditions.append("o.broker = %s")
        values.append(filters["broker"])
        
    if filters.get("outward_status"):
        conditions.append("o.outward_status = %s")
        values.append(filters["outward_status"])
    
    where_clause = " AND ".join(conditions)
    
    query = f"""
        SELECT 
            COALESCE(CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')), c.first_name, '') as customer_account,
            COALESCE(CONCAT(c.first_name, ' ', COALESCE(c.middle_name, ''), ' ', COALESCE(c.last_name, '')), '') as customer_name,
            COALESCE(c.state, 'Maharashtra') as state,
            COALESCE(c.gstin, '') as gstin,
            'Sales Export' as voucher_type,
            COALESCE(p.product_name, '') as product_name,
            COALESCE(w.warehouse_name, '') as warehouse_name,
            COALESCE((
                SELECT SUM(oi.item_gross_weight)
                FROM `tabOutward Item Detail` oi
                WHERE oi.parent = o.name
            ), 0) as quantity,
            COALESCE((
                SELECT AVG(oi.item_rate)
                FROM `tabOutward Item Detail` oi
                WHERE oi.parent = o.name
            ), 0) as rate,
            COALESCE(o.net_total, 0) as amount,
            COALESCE(o.broker_commission_percent, 0) as broker_commission_percent,
            COALESCE(o.broker_commission_amount, 0) as broker_commission_amount,
            o.name as voucher_no,
            o.outward_date,
            COALESCE(o.outward_status, 'pending') as status,
            COALESCE(v.vehicle_number, '') as vehicle,
            COALESCE(p.hsn_code, '') as hsn_code,
            'Kg' as uom
        FROM 
            `tabOutward` o
        LEFT JOIN `tabCustomer` c ON o.customer = c.name
        LEFT JOIN `tabProduct` p ON o.product = p.name
        LEFT JOIN `tabWarehouse` w ON o.warehouse = w.name
        LEFT JOIN `tabVehicle` v ON o.vehicle = v.name
        LEFT JOIN `tabSauda` s ON o.sauda = s.name
        WHERE 
            s.booking_type = 'Outward / Sales' AND {where_clause}
        ORDER BY 
            o.outward_date DESC, o.name DESC
    """
    
    data = frappe.db.sql(query, values, as_dict=1)
    
    formatted_data = []
    for row in data:
        row['quantity'] = flt(row['quantity'], 2)
        row['rate'] = flt(row['rate'], 2) 
        row['amount'] = flt(row['amount'], 2)
        row['broker_commission_percent'] = flt(row['broker_commission_percent'], 2)
        row['broker_commission_amount'] = flt(row['broker_commission_amount'], 2)
        
        row['customer_name'] = (row['customer_name'] or '').strip().replace('  ', ' ')
        row['customer_account'] = (row['customer_account'] or '').strip().replace('  ', ' ')
        row['product_name'] = (row['product_name'] or '').strip()
        row['warehouse_name'] = (row['warehouse_name'] or '').strip()
        row['vehicle'] = (row['vehicle'] or '').strip()
        
        for key, value in row.items():
            if value is None or value == '':
                if key in ['quantity', 'rate', 'amount', 'broker_commission_percent', 'broker_commission_amount']:
                    row[key] = 0.0
                else:
                    row[key] = ''
        
        formatted_data.append(row)
    
    return formatted_data

@frappe.whitelist()
def export_to_tally(filters):
    """Server-side method to export data for Tally"""
    try:
        if isinstance(filters, str):
            import json
            filters = json.loads(filters)
        
        columns, data = execute(filters)
        
        if not data:
            frappe.throw(_("No data found for the selected filters"))
        
        csv_content = []
        
        headers = [
            "Customer A/c", "Customer Name", "State Name", "GSTIN", "Voucher Type", 
            "Product Name", "Warehouse", "Quantity", "Rate", "Amount",
            "Broker Commission %", "Broker Commission", "Voucher No", "Outward Date",
            "Status", "Vehicle", "HSN", "UNIT"
        ]
        csv_content.append(",".join(f'"{header}"' for header in headers))
        
        for row in data:
            csv_row = [
                f'"{row.get("customer_account", "")}"',
                f'"{row.get("customer_name", "")}"', 
                f'"{row.get("state", "")}"',
                f'"{row.get("gstin", "")}"',
                f'"{row.get("voucher_type", "")}"',
                f'"{row.get("product_name", "")}"',
                f'"{row.get("warehouse_name", "")}"',
                f'"{flt(row.get("quantity", 0), 2)}"',
                f'"{flt(row.get("rate", 0), 2)}"',
                f'"{flt(row.get("amount", 0), 2)}"',
                f'"{flt(row.get("broker_commission_percent", 0), 2)}"',
                f'"{flt(row.get("broker_commission_amount", 0), 2)}"',
                f'"{row.get("voucher_no", "")}"',
                f'"{row.get("outward_date", "")}"',
                f'"{row.get("status", "")}"',
                f'"{row.get("vehicle", "")}"',
                f'"{row.get("hsn_code", "")}"',
                f'"{row.get("uom", "")}"'
            ]
            csv_content.append(",".join(csv_row))
        
        return "\n".join(csv_content)
        
    except Exception as e:
        frappe.log_error(f"Tally Outward Export Error: {str(e)}")
        frappe.throw(_("Error generating Tally export: {0}").format(str(e)))