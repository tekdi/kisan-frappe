frappe.query_reports["Tally Inward Report"] = {
    "filters": [
        {
            "fieldname": "from_date",
            "label": __("From Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.add_months(frappe.datetime.get_today(), -1),
            "reqd": 1
        },
        {
            "fieldname": "to_date",
            "label": __("To Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.get_today(),
            "reqd": 1
        },
        {
            "fieldname": "customer",
            "label": __("Customer"),
            "fieldtype": "Link",
            "options": "Customer"
        },
        {
            "fieldname": "warehouse",
            "label": __("Warehouse"),
            "fieldtype": "Link",
            "options": "Warehouse"
        },
        {
            "fieldname": "product",
            "label": __("Product"),
            "fieldtype": "Link",
            "options": "Product"
        },
        {
            "fieldname": "broker",
            "label": __("Broker"),
            "fieldtype": "Link",
            "options": "Broker"
        },
        {
            "fieldname": "inward_status",
            "label": __("Inward Status"),
            "fieldtype": "Select",
            "options": "\nPending\nReceived\nApproved\nStored"
        }
    ],

    "formatter": function (value, row, column, data, default_formatter) {
        value = default_formatter(value, row, column, data);

        if (column.fieldname == "voucher_no" && value) {
            // Make inward ID clickable
            value = `<a href="/app/inward/${data[column.colIndex]}" target="_blank">${value}</a>`;
        }

        // Add color coding for amounts
        if (column.fieldname == "amount" && parseFloat(value) > 0) {
            value = `<span style="color: #28a745; font-weight: bold;">${value}</span>`;
        }
        
        // Format GST percentages
        if (column.fieldname.includes('gst') && column.fieldtype == 'Percent') {
            value = value + '%';
        }

        return value;
    },

    onload: function(report) {
        // Add Export to Tally button
        report.page.add_inner_button(__("Export to Tally"), function() {
            let filters = report.get_filter_values();
            if (!filters.from_date || !filters.to_date) {
                frappe.msgprint(__('Please select From Date and To Date'));
                return;
            }

            frappe.show_alert({
                message: __('Preparing Tally Export...'),
                indicator: 'blue'
            });

            frappe.call({			
				method: "kisan_warehouse.inwards.report.tally_inward_report.tally_inward_report.export_to_tally",			
                args: {
                    filters: filters
                },
                callback: function(r) {
                    if (r.message) {
                        frappe.show_alert({
                            message: __('Tally Export Ready!'),
                            indicator: 'green'
                        });
                        
                        // Create download link
                        let a = document.createElement('a');
                        a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(r.message);
                        a.download = 'tally_inward_export_' + frappe.datetime.get_today() + '.csv';
                        a.click();
                    }
                },
                error: function(r) {
                    frappe.msgprint(__('Error generating Tally export. Please try again.'));
                }
            });
        });

        // Add Summary button
        report.page.add_inner_button(__("Show Summary"), function() {
            show_summary_dialog(report);
        });
    },

    get_datatable_options(options) {
        return Object.assign({}, options, {
            checkboxColumn: true
        });
    }	

};

function show_summary_dialog(report) {
    let data = report.data;
    if (!data || data.length === 0) {
        frappe.msgprint(__('No data available for summary'));
        return;
    }

    // Calculate summary
    let summary = {
        total_records: data.length,
        total_quantity: 0,
        total_amount: 0,
        total_cgst: 0,
        total_sgst: 0,
        total_igst: 0
    };

    data.forEach(row => {
        summary.total_quantity += parseFloat(row[7]) || 0; // Quantity column
        summary.total_amount += parseFloat(row[9]) || 0;   // Amount column
        summary.total_cgst += parseFloat(row[11]) || 0;    // CGST Amount
        summary.total_sgst += parseFloat(row[13]) || 0;    // SGST Amount
        summary.total_igst += parseFloat(row[15]) || 0;    // IGST Amount
    });

    // Create summary HTML
    let html = `
        <div class="row">
            <div class="col-md-12">
                <h5>📊 Report Summary</h5>
                <table class="table table-bordered">
                    <tr><td><strong>Total Records:</strong></td><td>${summary.total_records}</td></tr>
                    <tr><td><strong>Total Quantity:</strong></td><td>${summary.total_quantity.toFixed(2)} Kg</td></tr>
                    <tr><td><strong>Total Amount:</strong></td><td>₹ ${summary.total_amount.toFixed(2)}</td></tr>
                    <tr><td><strong>Total CGST:</strong></td><td>₹ ${summary.total_cgst.toFixed(2)}</td></tr>
                    <tr><td><strong>Total SGST:</strong></td><td>₹ ${summary.total_sgst.toFixed(2)}</td></tr>
                    <tr><td><strong>Total IGST:</strong></td><td>₹ ${summary.total_igst.toFixed(2)}</td></tr>
                    <tr><td><strong>Grand Total:</strong></td><td>₹ ${(summary.total_amount + summary.total_cgst + summary.total_sgst + summary.total_igst).toFixed(2)}</td></tr>
                </table>
            </div>
        </div>`;

    // Show dialog
    let d = new frappe.ui.Dialog({
        title: 'Tally Inward Report Summary',
        fields: [{
            fieldtype: 'HTML',
            fieldname: 'summary_html',
            options: html
        }],
        primary_action_label: 'Close',
        primary_action: function() {
            d.hide();
        }
    });
    d.show();
}