// Copyright (c) 2025, Kisan Warehouse and contributors
// For license information, please see license.txt


frappe.ui.form.on('Outward', {
    onload: function(frm) {
        // Ensure proper field display on form load
        refreshAllLinkFields(frm);
        
        // If form has data but amounts are not calculated, trigger calculation
        if (frm.doc.outward_items && frm.doc.outward_items.length > 0 && 
            (!frm.doc.net_total || frm.doc.net_total === 0)) {
            calculate_net_total(frm);
        }
    },

    refresh: function(frm) {
        // Set default values for new documents
        if (frm.is_new()) {
            frm.set_value('outward_date', frappe.datetime.get_today());
            frm.set_value('outward_status', 'pending');
        }
        
        // Refresh all link fields to show actual names
        refreshAllLinkFields(frm);
        
        // If form has data but amounts are not calculated, trigger calculation
        if (frm.doc.outward_items && frm.doc.outward_items.length > 0 && 
            (!frm.doc.net_total || frm.doc.net_total === 0)) {
            calculate_net_total(frm);
        }
    },

    validate: function(frm) {
        // Validate required fields
        if (!frm.doc.sauda) {
            frappe.msgprint({
                title: __('Required Field Missing'),
                message: __('Sauda is required'),
                indicator: 'red'
            });
            frappe.validated = false;
            return false;
        }

        if (!frm.doc.vehicle) {
            frappe.msgprint({
                title: __('Required Field Missing'),
                message: __('Vehicle is required'),
                indicator: 'red'
            });
            frappe.validated = false;
            return false;
        }

        // Validate outward items
        if (!frm.doc.outward_items || frm.doc.outward_items.length === 0) {
            frappe.msgprint({
                title: __('Outward Items Required'),
                message: __('At least one outward item is required'),
                indicator: 'red'
            });
            frappe.validated = false;
            return false;
        }

        // Validate each outward item
        let validation_failed = false;
        frm.doc.outward_items.forEach(function(row, index) {
            if (!row.item_gross_weight || row.item_gross_weight <= 0) {
                frappe.msgprint({
                    title: __('Invalid Item Weight'),
                    message: __('Gross weight must be greater than 0 for row ' + (index + 1)),
                    indicator: 'red'
                });
                validation_failed = true;
            }

            if (!row.item_bags || row.item_bags <= 0) {
                frappe.msgprint({
                    title: __('Invalid Item Bags'),
                    message: __('Number of bags must be greater than 0 for row ' + (index + 1)),
                    indicator: 'red'
                });
                validation_failed = true;
            }

            if (!row.item_rate || row.item_rate <= 0) {
                frappe.msgprint({
                    title: __('Invalid Item Rate'),
                    message: __('Rate must be greater than 0 for row ' + (index + 1)),
                    indicator: 'red'
                });
                validation_failed = true;
            }
        });

        if (validation_failed) {
            frappe.validated = false;
            return false;
        }

        // Validate broker commission
        if (frm.doc.broker_commission_percent && frm.doc.broker_commission_percent < 0) {
            frappe.msgprint({
                title: __('Invalid Broker Commission'),
                message: __('Broker commission percentage must be greater than or equal to 0'),
                indicator: 'red'
            });
            frappe.validated = false;
            return false;
        }
    },

    // Auto-populate fields when Sauda is selected
    sauda: function(frm) {
        if (frm.doc.sauda) {
            // Use frappe.db.get_doc to fetch complete Sauda document
            frappe.db.get_doc('Sauda', frm.doc.sauda)
                .then(function(sauda_doc) {
                    // Manually set values to ensure proper population
                    frm.set_value('customer', sauda_doc.customer);
                    frm.set_value('warehouse', sauda_doc.warehouse);
                    frm.set_value('product', sauda_doc.product);
                    frm.set_value('broker', sauda_doc.broker || '');
                    
                    // Refresh fields after setting values
                    setTimeout(function() {
                        refreshAllLinkFields(frm);
                        
                        // Pre-fill child table
                        prefill_outward_items(frm, sauda_doc);
                        
                        // Auto-populate broker commission
                        if (sauda_doc.broker) {
                            populate_broker_commission(frm, sauda_doc.broker);
                        } else {
                            // If no broker, set commission to 0
                            frm.set_value('broker_commission_percent', 0);
                            frm.set_value('broker_commission_amount', 0);
                        }
                    }, 100);
                })
                .catch(function(err) {
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Could not fetch Sauda details'),
                        indicator: 'red'
                    });
                });
        } else {
            clearForm(frm);
        }
    },

    // Manual broker change
    broker: function(frm) {
        if (frm.doc.broker) {
            populate_broker_commission(frm, frm.doc.broker);
        } else {
            // If broker cleared, reset commission
            frm.set_value('broker_commission_percent', 0);
            frm.set_value('broker_commission_amount', 0);
        }
    },

    // Calculate broker commission when percentage changes
    broker_commission_percent: function(frm) {
        calculate_broker_commission(frm);
    }
});

// Child table events for Outward Item Detail
frappe.ui.form.on('Outward Item Detail', {
    item_gross_weight: function(frm, cdt, cdn) {
        calculate_item_amount(frm, cdt, cdn);
    },

    item_rate: function(frm, cdt, cdn) {
        calculate_item_amount(frm, cdt, cdn);
    },

    outward_items_add: function(frm) {
        calculate_net_total(frm);
    },

    outward_items_remove: function(frm) {
        calculate_net_total(frm);
    }
});

// Helper Functions

function refreshAllLinkFields(frm) {
    // Refresh all link fields to display actual names
    frm.refresh_field('sauda');
    frm.refresh_field('customer');
    frm.refresh_field('warehouse');
    frm.refresh_field('product');
    frm.refresh_field('broker');
    frm.refresh_field('vehicle');
    frm.refresh_field('outward_items');
    frm.refresh_field('net_total');
    frm.refresh_field('broker_commission_percent');
    frm.refresh_field('broker_commission_amount');
}

function prefill_outward_items(frm, sauda_doc) {
    // Clear existing items
    frm.clear_table('outward_items');
    
    // Add one row with Sauda data
    let child = frm.add_child('outward_items');
    child.item_gross_weight = sauda_doc.expected_quantity || sauda_doc.pending_quantity || 0;
    child.item_rate = sauda_doc.sauda_rate || 0;
    child.item_bags = 0; // User needs to enter this
    
    // Refresh the child table
    frm.refresh_field('outward_items');
    
    // Calculate item amount for the new row
    setTimeout(function() {
        if (child.name) {
            calculate_item_amount(frm, child.doctype, child.name);
        }
    }, 200);
}

function populate_broker_commission(frm, broker_name) {
    if (!broker_name) {
        frm.set_value('broker_commission_percent', 0);
        frm.set_value('broker_commission_amount', 0);
        return;
    }
    
    frappe.db.get_doc('Broker', broker_name)
        .then(function(broker_doc) {
            let commission_rate = 0;
            
            // Try different possible field names for commission
            if (broker_doc.commission_rate) {
                commission_rate = broker_doc.commission_rate;
            } else if (broker_doc.commission_percent) {
                commission_rate = broker_doc.commission_percent;
            } else if (broker_doc.default_commission_percent) {
                commission_rate = broker_doc.default_commission_percent;
            } else if (broker_doc.commission) {
                commission_rate = broker_doc.commission;
            }
            
            frm.set_value('broker_commission_percent', commission_rate);
            calculate_broker_commission(frm);
        })
        .catch(function(err) {
            // Set to 0 if broker not found or error
            frm.set_value('broker_commission_percent', 0);
            frm.set_value('broker_commission_amount', 0);
        });
}

function calculate_item_amount(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    
    if (!row) {
        return;
    }
    
    // Get values, default to 0 if empty
    let gross_weight = flt(row.item_gross_weight) || 0;
    let rate = flt(row.item_rate) || 0;
    
    // Calculate: item_amount = (item_gross_weight / 100) × item_rate
    // Convert KG to Quintal (100 KG = 1 Quintal)
    let item_amount = (gross_weight / 100) * rate;
    
    // Round to 2 decimal places
    item_amount = Math.round(item_amount * 100) / 100;
    
    // Set the calculated value
    frappe.model.set_value(cdt, cdn, 'item_amount', item_amount);
    
    // Trigger net total calculation
    calculate_net_total(frm);
}

function calculate_net_total(frm) {
    let net_total = 0;
    
    // Loop through all rows in outward_items child table
    if (frm.doc.outward_items && frm.doc.outward_items.length > 0) {
        frm.doc.outward_items.forEach(function(row) {
            net_total += flt(row.item_amount) || 0;
        });
    }
    
    // Round to 2 decimal places
    net_total = Math.round(net_total * 100) / 100;
    
    // Set net total
    frm.set_value('net_total', net_total);
    
    // Trigger broker commission calculation
    calculate_broker_commission(frm);
}

function calculate_broker_commission(frm) {
    let net_total = flt(frm.doc.net_total) || 0;
    let commission_percent = flt(frm.doc.broker_commission_percent) || 0;
    
    // Calculate broker commission amount
    let commission_amount = (net_total * commission_percent) / 100;
    
    // Round to 2 decimal places
    commission_amount = Math.round(commission_amount * 100) / 100;
    
    // Set broker commission amount
    frm.set_value('broker_commission_amount', commission_amount);
}

function clearForm(frm) {
    // Clear all auto-populated fields
    frm.set_value('customer', '');
    frm.set_value('warehouse', '');
    frm.set_value('product', '');
    frm.set_value('broker', '');
    frm.set_value('broker_commission_percent', 0);
    frm.set_value('broker_commission_amount', 0);
    
    // Clear child table
    frm.clear_table('outward_items');
    frm.refresh_field('outward_items');
    
    // Reset totals
    frm.set_value('net_total', 0);
    
    // Refresh all fields
    refreshAllLinkFields(frm);
}