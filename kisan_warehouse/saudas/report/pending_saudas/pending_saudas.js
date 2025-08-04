// Copyright (c) 2025, Kisan Warehouse and contributors
// For license information, please see license.txt

frappe.query_reports["Pending Saudas"] = {
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
            "fieldname": "delivery_date_from",
            "label": __("Delivery Date (From)"),
            "fieldtype": "Date",
            "width": "80px"
        },
        {
            "fieldname": "delivery_date_to",
            "label": __("Delivery Date (To)"),
            "fieldtype": "Date",
            "width": "80px"
        },
        {
            "fieldname": "payment_date_from",
            "label": __("Payment Date (From)"),
            "fieldtype": "Date",
            "width": "80px"
        },
        {
            "fieldname": "payment_date_to",
            "label": __("Payment Date (To)"),
            "fieldtype": "Date",
            "width": "80px"
        },
        {
            "fieldname": "sauda_status",
            "label": __("Sauda Status"),
            "fieldtype": "Select",
            "options": ["", "pending", "confirmed", "cancelled", "completed"],
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
        
        // Color coding for Days Overdue column
        if (column.fieldname == "days_overdue" && data) {
            if (data.days_overdue > 0) {
                // Overdue - Red
                value = `<span style="color: #dc3545; font-weight: bold;">${data.days_overdue}</span>`;
            } else if (data.days_overdue == 0) {
                // Due Today - Orange
                value = `<span style="color: #fd7e14; font-weight: bold;">Due Today</span>`;
            } else {
                // Future - Green
                value = `<span style="color: #28a745;">-</span>`;
            }
        }
        
        // Color coding for Pending Quantity
        if (column.fieldname == "pending_quantity" && data) {
            if (data.pending_quantity > 0) {
                value = `<span style="color: #dc3545; font-weight: 500;">${data.pending_quantity}</span>`;
            }
        }
        
        // Color coding for Status
        if (column.fieldname == "sauda_status" && data) {
            let statusColor = {
                'pending': '#fd7e14',
                'confirmed': '#28a745', 
                'cancelled': '#dc3545',
                'completed': '#6c757d'
            };
            let color = statusColor[data.sauda_status] || '#6c757d';
            value = `<span style="color: ${color}; font-weight: 500;">${data.sauda_status}</span>`;
        }

        // Highlight entire row for overdue items
        if (column.fieldname == "sauda_id" && data && data.days_overdue > 0) {
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
            frappe.query_report.set_filter_value("delivery_date_from", "");
            frappe.query_report.set_filter_value("delivery_date_to", "");
            frappe.query_report.set_filter_value("payment_date_from", "");
            frappe.query_report.set_filter_value("payment_date_to", "");
            frappe.query_report.set_filter_value("sauda_status", "");
            frappe.query_report.set_filter_value("show_all", 0);
            frappe.query_report.refresh();
        });

        // Set default filters
        report.page.add_inner_button(__("Today's Pending"), function() {
            frappe.query_report.set_filter_value("delivery_date_from", frappe.datetime.get_today());
            frappe.query_report.set_filter_value("delivery_date_to", frappe.datetime.get_today());
            frappe.query_report.set_filter_value("show_all", 0);
            frappe.query_report.refresh();
        });

        report.page.add_inner_button(__("Overdue Items"), function() {
            frappe.query_report.set_filter_value("delivery_date_from", "");
            frappe.query_report.set_filter_value("delivery_date_to", frappe.datetime.add_days(frappe.datetime.get_today(), -1));
            frappe.query_report.set_filter_value("show_all", 0);
            frappe.query_report.refresh();
        });

        report.page.add_inner_button(__("Show All"), function() {
            frappe.query_report.set_filter_value("show_all", 1);
            frappe.query_report.set_filter_value("delivery_date_from", "");
            frappe.query_report.set_filter_value("delivery_date_to", "");
            frappe.query_report.refresh();
        });
    }
};