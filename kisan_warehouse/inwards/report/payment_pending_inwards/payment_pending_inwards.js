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