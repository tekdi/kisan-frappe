frappe.query_reports["Tally Outward Report"] = {
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
            "fieldname": "outward_status",
            "label": __("Outward Status"),
            "fieldtype": "Select",
            "options": "\nPending\nDispatched\nDelivered\nCompleted"
        }
    ],

    "formatter": function (value, row, column, data, default_formatter) {
        value = default_formatter(value, row, column, data);

        if (column.fieldname == "voucher_no" && value) {
            value = `<a href="/app/outward/${data[column.colIndex]}" target="_blank">${value}</a>`;
        }

        if (column.fieldname == "amount" && parseFloat(value || 0) > 0) {
            value = `<span style="color: #28a745; font-weight: bold;">${value}</span>`;
        }

        return value;
    },

    onload: function(report) {
        report.page.add_inner_button(__("Reset Filters"), function() {
            report.set_filter_value('from_date', frappe.datetime.add_months(frappe.datetime.get_today(), -1));
            report.set_filter_value('to_date', frappe.datetime.get_today());
            report.set_filter_value('customer', '');
            report.set_filter_value('warehouse', '');
            report.set_filter_value('product', '');
            report.set_filter_value('broker', '');
            report.set_filter_value('outward_status', '');
            
            report.refresh();
            
            frappe.show_alert({
                message: __('Filters reset to default values'),
                indicator: 'blue'
            });
        });

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
                method: "kisan_warehouse.outwards.report.tally_outward_report.tally_outward_report.export_to_tally",
                args: {
                    filters: filters
                },
                callback: function(r) {
                    if (r.message) {
                        frappe.show_alert({
                            message: __('Tally Export Ready!'),
                            indicator: 'green'
                        });
                        
                        let a = document.createElement('a');
                        a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(r.message);
                        a.download = 'tally_outward_export_' + frappe.datetime.get_today() + '.csv';
                        a.click();
                    }
                },
                error: function(r) {
                    frappe.msgprint(__('Error generating Tally export. Please try again.'));
                }
            });
        });

        report.page.add_inner_button(__("Show Summary"), function() {
            show_summary_dialog(report);
        });
    },

    get_datatable_options(options) {
        return Object.assign({}, options, {
            checkboxColumn: true,
            events: {
                onCheckRow: function(data) {
                }
            }
        });
    }
};

function show_summary_dialog(report) {
    let data = report.data;
    if (!data || data.length === 0) {
        frappe.msgprint(__('No data available for summary'));
        return;
    }

    let summary = {
        total_records: data.length,
        total_quantity: 0,
        total_amount: 0,
        total_broker_commission: 0
    };

    data.forEach(row => {
        summary.total_quantity += parseFloat(row[7]) || 0;
        summary.total_amount += parseFloat(row[9]) || 0;
        summary.total_broker_commission += parseFloat(row[11]) || 0;
    });

    let html = `
        <div class="row">
            <div class="col-md-12">
                <h5>📊 Report Summary</h5>
                <table class="table table-bordered">
                    <tr><td><strong>Total Records:</strong></td><td>${summary.total_records}</td></tr>
                    <tr><td><strong>Total Quantity:</strong></td><td>${summary.total_quantity.toFixed(2)} Kg</td></tr>
                    <tr><td><strong>Total Amount:</strong></td><td>₹ ${summary.total_amount.toFixed(2)}</td></tr>
                    <tr><td><strong>Total Broker Commission:</strong></td><td>₹ ${summary.total_broker_commission.toFixed(2)}</td></tr>
                    <tr><td><strong>Net Amount (After Commission):</strong></td><td>₹ ${(summary.total_amount - summary.total_broker_commission).toFixed(2)}</td></tr>
                </table>
            </div>
        </div>`;

    let d = new frappe.ui.Dialog({
        title: 'Tally Outward Report Summary',
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