import frappe
from frappe import _
from frappe.utils import flt, getdate, formatdate, nowdate

def execute(filters=None):
    """Main function to execute the report"""
    if not filters:
        filters = {}
    
    # Set default dates if not provided
    if not filters.get("from_date"):
        filters["from_date"] = frappe.utils.add_months(nowdate(), -1)
    if not filters.get("to_date"):
        filters["to_date"] = nowdate()
    
    columns = get_columns()
    data = get_data(filters)
    
    return columns, data

def get_columns():
    """Define report columns with proper widths - EXACT Excel format"""
    return [
        {
            "label": _("Supplier A/c"),
            "fieldname": "supplier_account",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("Supplier Name"),
            "fieldname": "supplier_name", 
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
            "label": _("Customer Name"),
            "fieldname": "customer_name",
            "fieldtype": "Data",
            "width": 160
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
            "label": _("CGST %"),
            "fieldname": "cgst_percent",
            "fieldtype": "Percent",
            "width": 70,
            "precision": 2
        },
        {
            "label": _("CGST"),
            "fieldname": "cgst_amount",
            "fieldtype": "Currency", 
            "width": 90,
            "precision": 2
        },
        {
            "label": _("SGST %"),
            "fieldname": "sgst_percent",
            "fieldtype": "Percent",
            "width": 70,
            "precision": 2
        },
        {
            "label": _("SGST"),
            "fieldname": "sgst_amount",
            "fieldtype": "Currency",
            "width": 90,
            "precision": 2
        },
        {
            "label": _("IGST %"),
            "fieldname": "igst_percent", 
            "fieldtype": "Percent",
            "width": 70,
            "precision": 2
        },
        {
            "label": _("IGST"),
            "fieldname": "igst_amount",
            "fieldtype": "Currency",
            "width": 90,
            "precision": 2
        },
        {
            "label": _("Voucher No"),
            "fieldname": "voucher_no",
            "fieldtype": "Link",
            "options": "Inward",
            "width": 110
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
    
    # Build WHERE conditions
    conditions = []
    values = []
    
    # Date filters
    conditions.append("i.inward_date BETWEEN %s AND %s")
    values.extend([filters["from_date"], filters["to_date"]])
    
    # Optional filters
    if filters.get("customer"):
        conditions.append("i.customer = %s")
        values.append(filters["customer"])
        
    if filters.get("warehouse"):
        conditions.append("i.warehouse = %s") 
        values.append(filters["warehouse"])
        
    if filters.get("product"):
        conditions.append("i.product = %s")
        values.append(filters["product"])
        
    if filters.get("broker"):
        conditions.append("i.broker = %s")
        values.append(filters["broker"])
        
    if filters.get("inward_status"):
        conditions.append("i.inward_status = %s")
        values.append(filters["inward_status"])
    
    where_clause = " AND ".join(conditions)
    
    # SQL Query with proper COALESCE and formatting - Using actual GST amount fields
    query = f"""
        SELECT 
            COALESCE(CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')), c.first_name, '') as supplier_account,
            COALESCE(CONCAT(c.first_name, ' ', COALESCE(c.middle_name, ''), ' ', COALESCE(c.last_name, '')), '') as supplier_name,
            COALESCE(c.state, 'Maharashtra') as state,
            COALESCE(c.gstin, '') as gstin,
            COALESCE(CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')), '') as customer_name,
            'Purchase Import' as voucher_type,
            COALESCE(p.product_name, '') as product_name,
            COALESCE(i.total_arrival_weight, 0) as quantity,
            COALESCE(i.sub_total / NULLIF(i.total_arrival_weight, 0) * 100, 0) as rate,
            COALESCE(i.sub_total, 0) as amount,
            COALESCE(i.cgst_percent, 0) as cgst_percent,
            COALESCE(i.cgst_amount, 0) as cgst_amount,
            COALESCE(i.sgst_percent, 0) as sgst_percent,
            COALESCE(i.sgst_amount, 0) as sgst_amount,
            COALESCE(i.igst_percent, 0) as igst_percent,
            COALESCE(i.igst_amount, 0) as igst_amount,
            i.name as voucher_no,
            COALESCE(p.hsn_code, '') as hsn_code,
            'nos' as uom
        FROM 
            `tabInward` i
        LEFT JOIN `tabCustomer` c ON i.customer = c.name
        LEFT JOIN `tabProduct` p ON i.product = p.name  
        WHERE 
            {where_clause}
        ORDER BY 
            i.inward_date DESC, i.name DESC
    """
    
    data = frappe.db.sql(query, values, as_dict=1)
    
    # Format data for better display
    formatted_data = []
    for row in data:
        # Ensure numeric values are properly formatted
        row['quantity'] = flt(row['quantity'], 2)
        row['rate'] = flt(row['rate'], 2) 
        row['amount'] = flt(row['amount'], 2)
        row['cgst_percent'] = flt(row['cgst_percent'], 2)
        row['cgst_amount'] = flt(row['cgst_amount'], 2)
        row['sgst_percent'] = flt(row['sgst_percent'], 2)
        row['sgst_amount'] = flt(row['sgst_amount'], 2)
        row['igst_percent'] = flt(row['igst_percent'], 2)
        row['igst_amount'] = flt(row['igst_amount'], 2)
        
        # Clean up text fields and handle empty values
        row['supplier_name'] = (row['supplier_name'] or '').strip().replace('  ', ' ')
        row['customer_name'] = (row['customer_name'] or '').strip().replace('  ', ' ')
        row['product_name'] = (row['product_name'] or '').strip()
        row['supplier_account'] = (row['supplier_account'] or '').strip().replace('  ', ' ')
        
        # Ensure no empty strings become None
        for key, value in row.items():
            if value is None or value == '':
                if key in ['quantity', 'rate', 'amount', 'cgst_percent', 'cgst_amount', 'sgst_percent', 'sgst_amount', 'igst_percent', 'igst_amount']:
                    row[key] = 0.0
                else:
                    row[key] = ''
        
        formatted_data.append(row)
    
    return formatted_data

@frappe.whitelist()
def export_to_tally(filters):
    """Server-side method to export data for Tally"""
    try:
        # Convert string filters to dict if needed
        if isinstance(filters, str):
            import json
            filters = json.loads(filters)
        
        # Get report data
        columns, data = execute(filters)
        
        if not data:
            frappe.throw(_("No data found for the selected filters"))
        
        # Create CSV content for Tally import
        csv_content = []
        
        # Add headers - EXACT Excel format
        headers = [
            "Supplier A/c", "Supplier Name", "State Name", "GSTIN", "Customer Name", 
            "Voucher Type", "Product Name", "Quantity", "Rate", "Amount",
            "CGST %", "CGST", "SGST %", "SGST", "IGST %", "IGST",
            "Voucher No", "HSN", "UNIT"
        ]
        csv_content.append(",".join(f'"{header}"' for header in headers))
        
        # Add data rows
        for row in data:
            csv_row = [
                f'"{row.get("supplier_account", "")}"',
                f'"{row.get("supplier_name", "")}"', 
                f'"{row.get("state", "")}"',
                f'"{row.get("gstin", "")}"',
                f'"{row.get("customer_name", "")}"',
                f'"{row.get("voucher_type", "")}"',
                f'"{row.get("product_name", "")}"',
                f'"{flt(row.get("quantity", 0), 2)}"',
                f'"{flt(row.get("rate", 0), 2)}"',
                f'"{flt(row.get("amount", 0), 2)}"',
                f'"{flt(row.get("cgst_percent", 0), 2)}"',
                f'"{flt(row.get("cgst_amount", 0), 2)}"',
                f'"{flt(row.get("sgst_percent", 0), 2)}"',
                f'"{flt(row.get("sgst_amount", 0), 2)}"',
                f'"{flt(row.get("igst_percent", 0), 2)}"',
                f'"{flt(row.get("igst_amount", 0), 2)}"',
                f'"{row.get("voucher_no", "")}"',
                f'"{row.get("hsn_code", "")}"',
                f'"{row.get("uom", "")}"'
            ]
            csv_content.append(",".join(csv_row))
        
        return "\n".join(csv_content)
        
    except Exception as e:
        frappe.log_error(f"Tally Export Error: {str(e)}")
        frappe.throw(_("Error generating Tally export: {0}").format(str(e)))