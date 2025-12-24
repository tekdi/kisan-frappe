import frappe
from frappe import _
from frappe.utils import get_fullname, money_in_words


@frappe.whitelist()
def generate_multi_purchase_receipt(doc_ids):
    """
    Generate consolidated Purchase Receipt HTML for multiple Outward Jawak records.
    
    Args:
        doc_ids: Comma-separated string of Outward Jawak IDs or list of IDs
        
    Returns:
        dict: Contains HTML content and success status
    """
    try:
        # Parse doc_ids if it's a string
        if isinstance(doc_ids, str):
            id_list = [doc_id.strip() for doc_id in doc_ids.split(',') if doc_id.strip()]
        else:
            id_list = doc_ids
            
        # Validate we have at least one ID
        if not id_list or len(id_list) == 0:
            frappe.throw(_("No document IDs provided"))
            
        # Fetch all Outward Jawak documents
        docs = []
        for doc_id in id_list:
            try:
                doc = frappe.get_doc('Outward Jawak', doc_id)
                docs.append(doc)
            except frappe.DoesNotExistError:
                frappe.throw(_("Outward Jawak {0} not found").format(doc_id))
                
        # Get the Purchase Receipt print format
        print_format = frappe.get_doc('Print Format', 'Purchase Receipt')
        
        # Prepare context for rendering
        # Pass all_docs for multi-record mode
        context = {
            'doc': docs[0],  # First doc for backward compatibility
            'all_docs': docs,  # All documents for multi-record mode
            'is_multi': len(docs) > 1,
            'frappe': frappe,
            'utils': frappe.utils,
            '_': _,
            'get_fullname': get_fullname,
            'money_in_words': money_in_words,
        }
        
        # Render the HTML using Jinja
        from frappe.utils.jinja import render_template
        receipt_html = render_template(print_format.html, context)
        
        # Wrap in complete HTML with print controls
        final_html = get_complete_html(receipt_html, len(docs))
        
        return {
            'success': True,
            'html': final_html,
            'count': len(docs)
        }
        
    except Exception as e:
        frappe.log_error(f"Multi-Purchase Receipt Generation Error: {str(e)}", "Multi-Purchase Receipt Error")
        return {
            'success': False,
            'error': str(e)
        }


def get_complete_html(content, record_count):
    """
    Wrap the Purchase Receipt content in a complete HTML structure with print controls.
    
    Args:
        content: The rendered Purchase Receipt HTML
        record_count: Number of records included
        
    Returns:
        Complete HTML document with print/PDF controls
    """
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Receipt - {record_count} Record(s)</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
            margin: 0;
            padding: 0;
            background: #f5f5f5;
        }}
        
        .print-controls {{
            position: fixed;
            top: 15px;
            right: 15px;
            z-index: 1000;
            background: white;
            padding: 10px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
        }}
        
        /* Frappe Standard Button Styles */
        .btn {{
            display: inline-block;
            padding: 6px 12px;
            margin: 0 4px;
            font-size: 13px;
            font-weight: 400;
            line-height: 1.42857143;
            text-align: center;
            white-space: nowrap;
            vertical-align: middle;
            cursor: pointer;
            border: 1px solid transparent;
            border-radius: 4px;
            transition: all 0.2s ease-in-out;
        }}
        
        .btn-primary {{
            color: #fff;
            background-color: #5e64ff;
            border-color: #5e64ff;
        }}
        
        .btn-primary:hover {{
            background-color: #4c52cc;
            border-color: #4c52cc;
        }}
        
        .btn-default {{
            color: #36414c;
            background-color: #fff;
            border-color: #d1d8dd;
        }}
        
        .btn-default:hover {{
            background-color: #f5f7fa;
            border-color: #b8c2cc;
        }}
        
        .print-container {{
            max-width: 1100px;
            margin: 60px auto 40px;
            background: white;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }}
        
        @media print {{
            .print-controls {{
                display: none !important;
            }}
            
            body {{
                background: white;
            }}
            
            .print-container {{
                margin: 0;
                padding: 0;
                box-shadow: none;
            }}
        }}
    </style>
</head>
<body>
    <!-- Print Controls -->
    <div class="print-controls">
        <button class="btn btn-primary btn-sm" onclick="window.print()">
            <svg class="icon icon-sm" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">
                <use href="#icon-printer"></use>
            </svg>
            Print
        </button>
        <button class="btn btn-default btn-sm" onclick="window.print()">
            <svg class="icon icon-sm" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">
                <use href="#icon-file"></use>
            </svg>
            PDF
        </button>
        <button class="btn btn-default btn-sm" onclick="window.close()">
            <svg class="icon icon-sm" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">
                <use href="#icon-close"></use>
            </svg>
            Close
        </button>
    </div>
    
    <!-- Content Container -->
    <div class="print-container">
        {content}
    </div>
    
    <script>
        window.focus();
        
        document.querySelector('.btn-pdf').addEventListener('click', function() {{
            setTimeout(function() {{
                alert('To save as PDF:\\n1. Choose "Save as PDF" or "Print to PDF" as your printer\\n2. Click Save/Print');
            }}, 100);
        }});
    </script>
</body>
</html>
"""
