// Copyright (c) 2025, Kisan Warehouse and contributors
// For license information, please see license.txt

frappe.query_reports["Stock by Warehouse"] = {
    "filters": [
        {
            "fieldname": "warehouse",
            "label": __("Warehouse"),
            "fieldtype": "Link",
            "options": "Warehouse",
            "width": "80px"
        },
        {
            "fieldname": "filter_by",
            "label": __("Filter By"),
            "fieldtype": "Select",
            "options": ["All", "Today", "Yesterday", "Last 7 Days", "Current Month", "Last Month", "Custom"],
            "default": "All",
            "width": "80px"
        },
        {
            "fieldname": "date_from",
            "label": __("Date Range (From)"),
            "fieldtype": "Date",
            "width": "80px",
            "depends_on": "eval:doc.filter_by=='Custom'"
        },
        {
            "fieldname": "date_to", 
            "label": __("Date Range (To)"),
            "fieldtype": "Date",
            "width": "80px",
            "depends_on": "eval:doc.filter_by=='Custom'"
        }
    ],

    "formatter": function(value, row, column, data, default_formatter) {
        value = default_formatter(value, row, column, data);
        
        // Color coding for Utilization Percentage
        if (column.fieldname == "utilization_percent" && data) {
            if (data.capacity_status == "Critical") {
                // Critical utilization - Red
                value = `<span style="color: #dc3545; font-weight: bold;">${data.utilization_percent}%</span>`;
            } else if (data.capacity_status == "High") {
                // High utilization - Orange
                value = `<span style="color: #fd7e14; font-weight: bold;">${data.utilization_percent}%</span>`;
            } else if (data.capacity_status == "Medium") {
                // Medium utilization - Yellow
                value = `<span style="color: #ffc107; font-weight: 500;">${data.utilization_percent}%</span>`;
            } else {
                // Low utilization - Green
                value = `<span style="color: #28a745; font-weight: 500;">${data.utilization_percent}%</span>`;
            }
        }
        
        // Color coding for Stock levels
        if (column.fieldname == "stock_tons" && data) {
            if (data.stock_tons > 500) {
                // High stock - Green
                value = `<span style="color: #28a745; font-weight: 500;">${data.stock_tons}</span>`;
            } else if (data.stock_tons > 100) {
                // Medium stock - Orange
                value = `<span style="color: #fd7e14; font-weight: 500;">${data.stock_tons}</span>`;
            } else if (data.stock_tons > 0) {
                // Low stock - Red
                value = `<span style="color: #dc3545; font-weight: 500;">${data.stock_tons}</span>`;
            } else {
                // No stock - Gray
                value = `<span style="color: #6c757d;">0.000</span>`;
            }
        }
        
        // Color coding for Total Value
        if (column.fieldname == "total_value" && data) {
            if (data.total_value > 1000000) {
                // High value - Green
                value = `<span style="color: #28a745; font-weight: 500;">₹${data.total_value}</span>`;
            } else if (data.total_value > 500000) {
                // Medium value - Orange
                value = `<span style="color: #fd7e14; font-weight: 500;">₹${data.total_value}</span>`;
            } else if (data.total_value > 0) {
                // Low value - Normal
                value = `<span style="color: #6c757d;">₹${data.total_value}</span>`;
            }
        }
        
        // Color coding for Total Products
        if (column.fieldname == "total_products" && data) {
            if (data.total_products > 10) {
                // Many products - Blue
                value = `<span style="color: #007bff; font-weight: 500;">${data.total_products}</span>`;
            } else if (data.total_products > 5) {
                // Few products - Orange
                value = `<span style="color: #fd7e14; font-weight: 500;">${data.total_products}</span>`;
            } else if (data.total_products > 0) {
                // Single/few products - Normal
                value = `<span style="color: #6c757d;">${data.total_products}</span>`;
            }
        }
        
        // Make warehouse name clickable for drill-down (future enhancement)
        if (column.fieldname == "warehouse_name" && data) {
            value = `<a href="#" onclick="drillDownWarehouse('${data.warehouse_name}')" style="color: #007bff; text-decoration: none;">${data.warehouse_name_display || data.warehouse_name}</a>`;
        }
        
        // Highlight entire row for critical capacity
        if (column.fieldname == "warehouse_name" && data && data.capacity_status == "Critical") {
            $(row).css('background-color', '#fff5f5');
        }
        
        return value;
    },

    "onload": function(report) {
        // Add Reset All Filters button
        report.page.add_inner_button(__("Reset All Filters"), function() {
            frappe.query_report.set_filter_value("warehouse", "");
            frappe.query_report.set_filter_value("filter_by", "All");
            frappe.query_report.set_filter_value("date_from", "");
            frappe.query_report.set_filter_value("date_to", "");
            frappe.query_report.refresh();
        });

        // Quick filter buttons
        report.page.add_inner_button(__("Today's Stock"), function() {
            frappe.query_report.set_filter_value("filter_by", "Today");
            frappe.query_report.refresh();
        });

        report.page.add_inner_button(__("This Week"), function() {
            frappe.query_report.set_filter_value("filter_by", "Last 7 Days");
            frappe.query_report.refresh();
        });

        report.page.add_inner_button(__("This Month"), function() {
            frappe.query_report.set_filter_value("filter_by", "Current Month");
            frappe.query_report.refresh();
        });

        report.page.add_inner_button(__("All Warehouses"), function() {
            frappe.query_report.set_filter_value("filter_by", "All");
            frappe.query_report.set_filter_value("warehouse", "");
            frappe.query_report.refresh();
        });

        report.page.add_inner_button(__("Critical Capacity"), function() {
            frappe.query_report.set_filter_value("filter_by", "All");
            frappe.query_report.set_filter_value("warehouse", "");
            frappe.query_report.refresh();
            // Note: This will show all warehouses, user can visually identify critical ones by red highlighting
        });

        // Handle drill-down functionality
        report.page.add_field({
            fieldtype: 'HTML',
            fieldname: 'warehouse_script',
            options: `
                <script>
                function drillDownWarehouse(warehouse_name) {
                    // Future enhancement: Navigate to product-level stock for this warehouse
                    frappe.msgprint('Drill-down feature: Show product-level stock for ' + warehouse_name);
                    // frappe.set_route('query-report', 'Stock by Product', {warehouse: warehouse_name});
                }
                </script>
            `
        });
    }
};