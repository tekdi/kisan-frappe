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
    """Define report columns with proper widths"""
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
            "label": _("State"),
            "fieldname": "state",
            "fieldtype": "Data", 
            "width": 60
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
            "label": _("CGST"),
            "fieldname": "cgst",
            "fieldtype": "Percent",
            "width": 60,
            "precision": 1
        },
        {
            "label": _("CGST Amt"),
            "fieldname": "cgst_amount",
            "fieldtype": "Currency", 
            "width": 90,
            "precision": 2
        },
        {
            "label": _("SGST"),
            "fieldname": "sgst",
            "fieldtype": "Percent",
            "width": 60,
            "precision": 1
        },
        {
            "label": _("SGST Amt"),
            "fieldname": "sgst_amount",
            "fieldtype": "Currency",
            "width": 90,
            "precision": 2
        },
        {
            "label": _("IGST"),
            "fieldname": "igst", 
            "fieldtype": "Percent",
            "width": 60,
            "precision": 1
        },
        {
            "label": _("IGST Amt"),
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
            "label": _("UOM"),
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
    
    # SQL Query with proper COALESCE and formatting
    query = f"""
        SELECT 
            COALESCE(CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')), c.first_name, '') as supplier_account,
            COALESCE(CONCAT(c.first_name, ' ', COALESCE(c.middle_name, ''), ' ', COALESCE(c.last_name, '')), '') as supplier_name,
            COALESCE(c.state, 'MH') as state,
            COALESCE(c.gstin, '') as gstin,
            COALESCE(CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')), '') as customer_name,
            'Purchase' as voucher_type,
            COALESCE(p.product_name, '') as product_name,
            COALESCE(i.total_arrival_weight, 0) as quantity,
            COALESCE(i.sub_total / NULLIF(i.total_arrival_weight, 0) * 100, 0) as rate,
            COALESCE(i.sub_total, 0) as amount,
            COALESCE(i.cgst_percent, 0) as cgst,
            COALESCE(i.sub_total * i.cgst_percent / 100, 0) as cgst_amount,
            COALESCE(i.sgst_percent, 0) as sgst,
            COALESCE(i.sub_total * i.sgst_percent / 100, 0) as sgst_amount,
            COALESCE(i.igst_percent, 0) as igst,
            COALESCE(i.sub_total * i.igst_percent / 100, 0) as igst_amount,
            i.name as voucher_no,
            COALESCE(p.hsn_code, '05-0...') as hsn_code,
            'Kg' as uom
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
        row['cgst'] = flt(row['cgst'], 2)
        row['cgst_amount'] = flt(row['cgst_amount'], 2)
        row['sgst'] = flt(row['sgst'], 2)
        row['sgst_amount'] = flt(row['sgst_amount'], 2)
        row['igst'] = flt(row['igst'], 2)
        row['igst_amount'] = flt(row['igst_amount'], 2)
        
        # Clean up text fields and handle empty values
        row['supplier_name'] = (row['supplier_name'] or '').strip().replace('  ', ' ')
        row['customer_name'] = (row['customer_name'] or '').strip().replace('  ', ' ')
        row['product_name'] = (row['product_name'] or '').strip()
        row['supplier_account'] = (row['supplier_account'] or '').strip().replace('  ', ' ')
        
        # Ensure no empty strings become None
        for key, value in row.items():
            if value is None or value == '':
                if key in ['quantity', 'rate', 'amount', 'cgst', 'cgst_amount', 'sgst', 'sgst_amount', 'igst', 'igst_amount']:
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
        
        # Add headers
        headers = [col["label"] for col in columns]
        csv_content.append(",".join(f'"{header}"' for header in headers))
        
        # Add data rows
        for row in data:
            csv_row = []
            for col in columns:
                fieldname = col["fieldname"]
                value = row.get(fieldname, "")
                
                # Format based on field type
                if col["fieldtype"] in ["Currency", "Float"]:
                    value = flt(value, 2)
                elif col["fieldtype"] == "Percent":
                    value = f"{flt(value, 2)}%"
                
                csv_row.append(f'"{value}"')
            
            csv_content.append(",".join(csv_row))
        
        return "\n".join(csv_content)
        
    except Exception as e:
        frappe.log_error(f"Tally Export Error: {str(e)}")
        frappe.throw(_("Error generating Tally export: {0}").format(str(e)))