// Copyright (c) 2025, Kisan Warehouse and contributors
// For license information, please see license.txt

frappe.query_reports["Payment Pending Outwards"] = {
    "filters": [
        {
            "fieldname": "customer",
            "label": __("Customer"),
            "fieldtype": "Link",
            "options": "Customer",
            "width": "80px"
        },
        {
            "fieldname": "broker",
            "label": __("Broker"),
            "fieldtype": "Link",
            "options": "Broker",
            "width": "80px"
        },
        {
            "fieldname": "product",
            "label": __("Product"),
            "fieldtype": "Link",
            "options": "Product",
            "width": "80px"
        },
        {
            "fieldname": "warehouse",
            "label": __("Warehouse"),
            "fieldtype": "Link",
            "options": "Warehouse",
            "width": "80px"
        },
        {
            "fieldname": "payment_due_date_from",
            "label": __("Payment Due Date (From)"),
            "fieldtype": "Date",
            "width": "80px"
        },
        {
            "fieldname": "payment_due_date_to",
            "label": __("Payment Due Date (To)"),
            "fieldtype": "Date",
            "width": "80px"
        },
        {
            "fieldname": "payment_status",
            "label": __("Payment Status"),
            "fieldtype": "Select",
            "options": ["", "Pending", "Processing", "Success", "Failed"],
            "width": "80px"
        },
        {
            "fieldname": "show_all",
            "label": __("Show All (Ignore Date Filter)"),
            "fieldtype": "Check",
            "width": "80px"
        }
    ],

    "formatter": function(value, row, column, data, default_formatter) {
        value = default_formatter(value, row, column, data);
        
        if (column.fieldname == "sauda_id" && data) {
            if (data.sauda_id && data.sauda_id !== "-") {
                value = `<a href="/app/sauda/${data.sauda_id}" style="color: #007bff;">${data.sauda_id}</a>`;
            } else {
                value = `<span style="color: #6c757d; font-style: italic;">No Sauda</span>`;
            }
        }
        
        if (column.fieldname == "days_status" && data) {
            if (data.urgency == "Overdue") {
                value = `<span style="color: #dc3545; font-weight: bold;">${data.days_status}</span>`;
            } else if (data.urgency == "Due Today") {
                value = `<span style="color: #fd7e14; font-weight: bold;">${data.days_status}</span>`;
            } else {
                value = `<span style="color: #28a745; font-weight: 500;">${data.days_status}</span>`;
            }
        }
        
        if (column.fieldname == "total_amount_pending" && data) {
            if (data.total_amount_pending > 0) {
                if (data.urgency == "Overdue") {
                    value = `<span style="color: #dc3545; font-weight: 500;">₹${data.total_amount_pending}</span>`;
                } else if (data.urgency == "Due Today") {
                    value = `<span style="color: #fd7e14; font-weight: 500;">₹${data.total_amount_pending}</span>`;
                } else {
                    value = `<span style="color: #6c757d;">₹${data.total_amount_pending}</span>`;
                }
            }
        }
        
        if (column.fieldname == "payment_status" && data) {
            let statusColor = {
                'pending': '#fd7e14',
                'processing': '#17a2b8', 
                'success': '#28a745',
                'failed': '#dc3545'
            };
            let color = statusColor[data.payment_status] || '#6c757d';
            value = `<span style="color: ${color}; font-weight: 500;">${data.payment_status}</span>`;
        }

        if (column.fieldname == "outward_id" && data && data.urgency == "Overdue") {
            $(row).css('background-color', '#fff5f5');
        }
        
        return value;
    },

    "onload": function(report) {
        report.page.add_inner_button(__("🏦 Bank Export"), function() {
            let raw_data = frappe.query_report.data;
            
            let valid_data = raw_data.filter(row => {
                return row.outward_id && 
                       row.outward_id.startsWith('OUT-') &&
                       row.customer_name && 
                       row.customer_name !== 'Total' &&
                       row.total_amount_pending > 0;
            });
            
            if (!valid_data || valid_data.length === 0) {
                frappe.msgprint(__("No valid payment records to export. Please apply filters and ensure the report has data."));
                return;
            }
            
            export_to_bank_format(valid_data);
        });

        report.page.add_inner_button(__("Reset All Filters"), function() {
            frappe.query_report.set_filter_value("customer", "");
            frappe.query_report.set_filter_value("broker", "");
            frappe.query_report.set_filter_value("product", "");
            frappe.query_report.set_filter_value("warehouse", "");
            frappe.query_report.set_filter_value("payment_due_date_from", "");
            frappe.query_report.set_filter_value("payment_due_date_to", "");
            frappe.query_report.set_filter_value("payment_status", "");
            frappe.query_report.set_filter_value("show_all", 0);
            frappe.query_report.refresh();
        });

        report.page.add_inner_button(__("Today's Due"), function() {
            frappe.query_report.set_filter_value("payment_due_date_from", frappe.datetime.get_today());
            frappe.query_report.set_filter_value("payment_due_date_to", frappe.datetime.get_today());
            frappe.query_report.set_filter_value("show_all", 0);
            frappe.query_report.refresh();
        });

        report.page.add_inner_button(__("Overdue Payments"), function() {
            frappe.query_report.set_filter_value("payment_due_date_from", "");
            frappe.query_report.set_filter_value("payment_due_date_to", frappe.datetime.add_days(frappe.datetime.get_today(), -1));
            frappe.query_report.set_filter_value("show_all", 0);
            frappe.query_report.refresh();
        });

        report.page.add_inner_button(__("All Pending"), function() {
            frappe.query_report.set_filter_value("show_all", 1);
            frappe.query_report.set_filter_value("payment_due_date_from", "");
            frappe.query_report.set_filter_value("payment_due_date_to", "");
            frappe.query_report.set_filter_value("payment_status", "");
            frappe.query_report.refresh();
        });

        report.page.add_inner_button(__("Upcoming Payments"), function() {
            frappe.query_report.set_filter_value("payment_due_date_from", frappe.datetime.add_days(frappe.datetime.get_today(), 1));
            frappe.query_report.set_filter_value("payment_due_date_to", "");
            frappe.query_report.set_filter_value("show_all", 0);
            frappe.query_report.refresh();
        });
    }
};

function export_to_bank_format(data) {
    frappe.show_alert({
        message: __('Preparing bank export file...'),
        indicator: 'blue'
    }, 3);

    if (typeof XLSX === 'undefined') {
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', function() {
            generate_bank_export(data);
        });
    } else {
        generate_bank_export(data);
    }
}

function loadScript(src, callback) {
    var script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    script.onerror = function() {
        frappe.msgprint(__('Failed to load Excel library. Please check your internet connection.'));
    };
    document.head.appendChild(script);
}

function generate_bank_export(data) {
    try {
        frappe.call({
            method: "kisan_warehouse.outwards.report.payment_pending_outwards.payment_pending_outwards.get_customer_bank_details",
            args: {
                customer_ids: data.map(row => row.customer_id || row.customer_name).filter(Boolean)
            },
            callback: function(response) {
                let customer_bank_data = response.message || {};
                create_bank_excel(data, customer_bank_data);
            }
        });
        
    } catch (error) {
        frappe.show_alert({
            message: __(`Export failed: ${error.message}`),
            indicator: 'red'
        }, 5);
    }
}

function create_bank_excel(data, customer_bank_data) {
    try {
        let bank_data = data.map((row) => {
            let message_type = (row.total_amount_pending > 200000) ? "RTGS" : "NEFT";
            
            let current_date = new Date();
            let formatted_date = [
                String(current_date.getDate()).padStart(2, '0'),
                String(current_date.getMonth() + 1).padStart(2, '0'),
                current_date.getFullYear()
            ].join('/');
            
            let customer_key = row.customer_id || row.customer_name;
            let bank_details = customer_bank_data[customer_key] || {};
            
            return {
                "Client Code": "ABCD1234",
                "Customer Reference No": row.outward_id || "",
                "Debit Account No.": "1122334455556",
                "Transaction Type Code": "LBT",
                "Message Type": message_type,
                "Beneficiary ID": "",
                "Beneficiary Name": row.customer_name || "",
                "Beneficiary Account No.": bank_details.bank_account_no || "",
                "Beneficiary Bank Swift Code / IFSC Code": bank_details.ifsc_code || "",
                "Payment Amount": parseFloat(row.total_amount_pending) || 0,
                "Value Date": formatted_date,
                "Remarks": `Payment for Outward ${row.outward_id} - ${row.product_name || 'Product'}`
            };
        });

        let wb = XLSX.utils.book_new();
        let ws = XLSX.utils.json_to_sheet(bank_data);
        
        ws['!cols'] = [
            {wch: 12}, {wch: 22}, {wch: 18}, {wch: 22}, {wch: 15}, {wch: 15},
            {wch: 30}, {wch: 22}, {wch: 25}, {wch: 15}, {wch: 12}, {wch: 40}
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, "Bank Export");
        
        let current_date = new Date();
        let date_str = [
            current_date.getFullYear(),
            String(current_date.getMonth() + 1).padStart(2, '0'),
            String(current_date.getDate()).padStart(2, '0')
        ].join('');
        let time_str = [
            String(current_date.getHours()).padStart(2, '0'),
            String(current_date.getMinutes()).padStart(2, '0')
        ].join('');
        
        let filename = `Bank_Export_Payment_Pending_Outwards_${date_str}_${time_str}.xlsx`;
        
        XLSX.writeFile(wb, filename);
        
        let total_amount = bank_data.reduce((sum, row) => sum + parseFloat(row["Payment Amount"]), 0);
        let rtgs_count = bank_data.filter(row => row["Message Type"] === "RTGS").length;
        let neft_count = bank_data.filter(row => row["Message Type"] === "NEFT").length;
        
        let missing_bank_details = bank_data.filter(row => 
            !row["Beneficiary Account No."] || 
            !row["Beneficiary Bank Swift Code / IFSC Code"]
        ).length;
        
        frappe.show_alert({
            message: __(`Bank export completed successfully!<br>
                        File: ${filename}<br>
                        Total Records: ${bank_data.length}<br>
                        Total Amount: ₹${total_amount.toLocaleString('en-IN')}<br>
                        RTGS: ${rtgs_count} | NEFT: ${neft_count}${missing_bank_details > 0 ? '<br><strong>⚠️ Warning: ' + missing_bank_details + ' records have missing bank details</strong>' : ''}`),
            indicator: 'green'
        }, 10);
        
    } catch (error) {
        frappe.show_alert({
            message: __(`Excel creation failed: ${error.message}`),
            indicator: 'red'
        }, 5);
    }
}