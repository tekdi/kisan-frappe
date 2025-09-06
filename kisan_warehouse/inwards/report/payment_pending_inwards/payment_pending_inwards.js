// Copyright (c) 2025, Kisan Warehouse and contributors
// For license information, please see license.txt

frappe.query_reports["Payment Pending Inwards"] = {
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
            "options": ["", "Pending", "Processing", "Success"],
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
        
        // Color coding for Sauda ID (if missing)
        if (column.fieldname == "sauda_id" && data) {
            if (data.sauda_id && data.sauda_id !== "-") {
                // Has Sauda - Normal blue link
                value = `<a href="/app/sauda/${data.sauda_id}" style="color: #007bff;">${data.sauda_id}</a>`;
            } else {
                // No Sauda - Gray text
                value = `<span style="color: #6c757d; font-style: italic;">No Sauda</span>`;
            }
        }
        
        // Color coding for Days Status column
        if (column.fieldname == "days_status" && data) {
            if (data.urgency == "Overdue") {
                // Overdue - Red
                value = `<span style="color: #dc3545; font-weight: bold;">${data.days_status}</span>`;
            } else if (data.urgency == "Due Today") {
                // Due Today - Orange
                value = `<span style="color: #fd7e14; font-weight: bold;">${data.days_status}</span>`;
            } else {
                // Upcoming - Green
                value = `<span style="color: #28a745; font-weight: 500;">${data.days_status}</span>`;
            }
        }
        
        // Color coding for Amount Pending
        if (column.fieldname == "total_amount_pending" && data) {
            if (data.total_amount_pending > 0) {
                if (data.urgency == "Overdue") {
                    // Overdue amount - Red
                    value = `<span style="color: #dc3545; font-weight: 500;">₹${data.total_amount_pending}</span>`;
                } else if (data.urgency == "Due Today") {
                    // Due today amount - Orange
                    value = `<span style="color: #fd7e14; font-weight: 500;">₹${data.total_amount_pending}</span>`;
                } else {
                    // Upcoming amount - Normal
                    value = `<span style="color: #6c757d;">₹${data.total_amount_pending}</span>`;
                }
            }
        }
        
        // Color coding for Payment Status
        if (column.fieldname == "inward_payment_status" && data) {
            let statusColor = {
                'pending': '#fd7e14',
                'processing': '#17a2b8', 
                'success': '#28a745',
                'failed': '#dc3545'
            };
            let color = statusColor[data.inward_payment_status] || '#6c757d';
            value = `<span style="color: ${color}; font-weight: 500;">${data.inward_payment_status}</span>`;
        }

        // Color coding for Payment Notes
        if (column.fieldname == "payment_notes" && data) {
            if (data.payment_notes && data.payment_notes !== "-") {
                value = `<span style="color: #17a2b8; font-size: 11px;">${data.payment_notes}</span>`;
            } else {
                value = `<span style="color: #6c757d; font-size: 11px;">-</span>`;
            }
        }

        // Highlight entire row for overdue payments
        if (column.fieldname == "inward_id" && data && data.urgency == "Overdue") {
            $(row).css('background-color', '#fff5f5');
        }
        
        return value;
    },

    "onload": function(report) {
        // Bank Export Button
        report.page.add_inner_button(__("🏦 Bank Export"), function() {
            // Get raw data excluding totals
            let raw_data = frappe.query_report.data;
            
            // CRITICAL FIX: Filter out total rows and invalid data
            let valid_data = raw_data.filter(row => {
                return row.inward_id && 
                       row.inward_id.startsWith('INW-') && // Only actual Inward IDs
                       row.customer_name && 
                       row.customer_name !== 'Total' &&
                       row.total_amount_pending > 0;
            });
            
            if (!valid_data || valid_data.length === 0) {
                frappe.msgprint(__("No valid payment records to export. Please apply filters and ensure the report has data."));
                return;
            }
            
            console.log("Filtered data for export:", valid_data); // Debug
            export_to_bank_format(valid_data);
        });

        // Add Reset All Filters button
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

        // Today's Due Payments
        report.page.add_inner_button(__("Today's Due"), function() {
            frappe.query_report.set_filter_value("payment_due_date_from", frappe.datetime.get_today());
            frappe.query_report.set_filter_value("payment_due_date_to", frappe.datetime.get_today());
            frappe.query_report.set_filter_value("show_all", 0);
            frappe.query_report.refresh();
        });

        // Overdue Payments
        report.page.add_inner_button(__("Overdue Payments"), function() {
            frappe.query_report.set_filter_value("payment_due_date_from", "");
            frappe.query_report.set_filter_value("payment_due_date_to", frappe.datetime.add_days(frappe.datetime.get_today(), -1));
            frappe.query_report.set_filter_value("show_all", 0);
            frappe.query_report.refresh();
        });

        // Show All Pending
        report.page.add_inner_button(__("All Pending"), function() {
            frappe.query_report.set_filter_value("show_all", 1);
            frappe.query_report.set_filter_value("payment_due_date_from", "");
            frappe.query_report.set_filter_value("payment_due_date_to", "");
            frappe.query_report.set_filter_value("payment_status", "");
            frappe.query_report.refresh();
        });

        // Upcoming Payments
        report.page.add_inner_button(__("Upcoming Payments"), function() {
            frappe.query_report.set_filter_value("payment_due_date_from", frappe.datetime.add_days(frappe.datetime.get_today(), 1));
            frappe.query_report.set_filter_value("payment_due_date_to", "");
            frappe.query_report.set_filter_value("show_all", 0);
            frappe.query_report.refresh();
        });
    }
};

// Bank Export Function
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
        console.log("Data received for bank export:", data); // Debug
        
        // Get customer bank details from server
        frappe.call({
            method: "kisan_warehouse.inwards.report.payment_pending_inwards.payment_pending_inwards.get_customer_bank_details",
            args: {
                customer_ids: data.map(row => row.customer_id || row.customer_name).filter(Boolean)
            },
            callback: function(response) {
                let customer_bank_data = response.message || {};
                console.log("Customer bank data:", customer_bank_data); // Debug
                
                create_bank_excel(data, customer_bank_data);
            }
        });
        
    } catch (error) {
        console.error("Bank Export Error:", error);
        frappe.show_alert({
            message: __(`Export failed: ${error.message}`),
            indicator: 'red'
        }, 5);
    }
}

function create_bank_excel(data, customer_bank_data) {
    try {
        // Create bank export data with real customer bank details
        let bank_data = data.map((row) => {
            let message_type = (row.total_amount_pending > 200000) ? "RTGS" : "NEFT";
            
            let current_date = new Date();
            let formatted_date = [
                String(current_date.getDate()).padStart(2, '0'),
                String(current_date.getMonth() + 1).padStart(2, '0'),
                current_date.getFullYear()
            ].join('/');
            
            // Get customer bank details
            let customer_key = row.customer_id || row.customer_name;
            let bank_details = customer_bank_data[customer_key] || {};
            
            return {
                "Client Code": "ABCD1234",
                "Customer Reference No": row.inward_id || "",
                "Debit Account No.": "1122334455556",
                "Transaction Type Code": "LBT",
                "Message Type": message_type,
                "Beneficiary ID": "", // Keep blank as requested
                "Beneficiary Name": row.customer_name || "",
                "Beneficiary Account No.": bank_details.bank_account_no || "",
                "Beneficiary Bank Swift Code / IFSC Code": bank_details.ifsc_code || "",
                "Payment Amount": parseFloat(row.total_amount_pending) || 0,
                "Value Date": formatted_date,
                "Remarks": `Payment for Inward ${row.inward_id} - ${row.product_name || 'Product'}`
            };
        });

        // Create Excel workbook
        let wb = XLSX.utils.book_new();
        let ws = XLSX.utils.json_to_sheet(bank_data);
        
        ws['!cols'] = [
            {wch: 12}, // Client Code
            {wch: 22}, // Customer Reference No
            {wch: 18}, // Debit Account No
            {wch: 22}, // Transaction Type Code
            {wch: 15}, // Message Type
            {wch: 15}, // Beneficiary ID
            {wch: 30}, // Beneficiary Name
            {wch: 22}, // Beneficiary Account No
            {wch: 25}, // Beneficiary Bank Swift Code / IFSC Code
            {wch: 15}, // Payment Amount
            {wch: 12}, // Value Date
            {wch: 40}  // Remarks
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
        
        let filename = `Bank_Export_Payment_Pending_${date_str}_${time_str}.xlsx`;
        
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
        
        console.log("Bank Export Success:", {
            filename: filename,
            total_records: bank_data.length,
            total_amount: total_amount,
            rtgs_count: rtgs_count,
            neft_count: neft_count
        });
        
    } catch (error) {
        console.error("Excel creation error:", error);
        frappe.show_alert({
            message: __(`Excel creation failed: ${error.message}`),
            indicator: 'red'
        }, 5);
    }
}