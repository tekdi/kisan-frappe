// Copyright (c) 2025, Kisan Warehouse and contributors
// For license information, please see license.txt

frappe.query_reports["Stock by Product"] = {
    "filters": [
        {
            "fieldname": "product",
            "label": __("Product"),
            "fieldtype": "Link",
            "options": "Product",
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
        
        // Color coding for Stock levels
        if (column.fieldname == "stock_tons" && data) {
            if (data.stock_tons > 100) {
                // High stock - Green
                value = `<span style="color: #28a745; font-weight: 500;">${data.stock_tons}</span>`;
            } else if (data.stock_tons > 50) {
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
            if (data.total_value > 500000) {
                // High value - Green
                value = `<span style="color: #28a745; font-weight: 500;">₹${data.total_value}</span>`;
            } else if (data.total_value > 100000) {
                // Medium value - Orange
                value = `<span style="color: #fd7e14; font-weight: 500;">₹${data.total_value}</span>`;
            } else if (data.total_value > 0) {
                // Low value - Normal
                value = `<span style="color: #6c757d;">₹${data.total_value}</span>`;
            }
        }
        
        // Color coding for Warehouse Count
        if (column.fieldname == "warehouse_count" && data) {
            if (data.warehouse_count > 3) {
                // Multi-warehouse - Blue
                value = `<span style="color: #007bff; font-weight: 500;">${data.warehouse_count}</span>`;
            } else if (data.warehouse_count > 1) {
                // Few warehouses - Orange
                value = `<span style="color: #fd7e14; font-weight: 500;">${data.warehouse_count}</span>`;
            } else {
                // Single warehouse - Normal
                value = `<span style="color: #6c757d;">${data.warehouse_count}</span>`;
            }
        }
        
        // Make product name clickable for drill-down (future enhancement)
        if (column.fieldname == "product_name" && data) {
            value = `<a href="#" onclick="drillDownProduct('${data.product_name}')" style="color: #007bff; text-decoration: none;">${data.product_name_display || data.product_name}</a>`;
        }
        
        return value;
    },

    "onload": function(report) {
        // Add Reset All Filters button
        report.page.add_inner_button(__("Reset All Filters"), function() {
            frappe.query_report.set_filter_value("product", "");
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

        report.page.add_inner_button(__("All Stock"), function() {
            frappe.query_report.set_filter_value("filter_by", "All");
            frappe.query_report.set_filter_value("product", "");
            frappe.query_report.refresh();
        });

        // Handle filter_by change to show/hide custom date fields
        report.page.add_field({
            fieldtype: 'HTML',
            fieldname: 'filter_script',
            options: `
                <script>
                function drillDownProduct(product_name) {
                    // Future enhancement: Navigate to warehouse-level stock for this product
                    frappe.msgprint('Drill-down feature: Show warehouse-level stock for ' + product_name);
                    // frappe.set_route('query-report', 'Stock by Warehouse', {product: product_name});
                }
                </script>
            `
        });
    }
};