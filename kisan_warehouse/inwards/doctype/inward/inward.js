// Inward Client Script - Real Names Population and Debit Note Calculations

frappe.ui.form.on('Inward', {
    refresh: function(frm) {
        // Populate real names for print format
        populateRealNames(frm);
        
        // Calculate debit note values
        calculateDebitNoteValues(frm);
    },
    
    onload: function(frm) {
        // Populate real names when form loads
        populateRealNames(frm);
        
        // Calculate debit note values
        calculateDebitNoteValues(frm);
    },
    
    // Trigger calculations when relevant fields change
    total_deductions: function(frm) {
        calculateDebitNoteValues(frm);
    },
    
    cgst_amount: function(frm) {
        calculateDebitNoteValues(frm);
    },
    
    sgst_amount: function(frm) {
        calculateDebitNoteValues(frm);
    },
    
    igst_amount: function(frm) {
        calculateDebitNoteValues(frm);
    }
});

// Debit Note child table events
frappe.ui.form.on('Debit Note', {
    amount: function(frm, cdt, cdn) {
        calculateDebitNoteValues(frm);
    },
    
    debit_note_add: function(frm) {
        calculateDebitNoteValues(frm);
    },
    
    debit_note_remove: function(frm) {
        calculateDebitNoteValues(frm);
    }
});

function populateRealNames(frm) {
    // Populate customer name
    if (frm.doc.customer && !frm.doc.customer_name) {
        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: 'Customer',
                filters: { name: frm.doc.customer },
                fieldname: 'customer_name'
            },
            callback: function(r) {
                if (r.message && r.message.customer_name) {
                    frm.set_value('customer_name', r.message.customer_name);
                }
            }
        });
    }
    
    // Populate broker name
    if (frm.doc.broker && !frm.doc.broker_name) {
        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: 'Broker',
                filters: { name: frm.doc.broker },
                fieldname: 'first_name'
            },
            callback: function(r) {
                if (r.message && r.message.first_name) {
                    frm.set_value('broker_name', r.message.first_name);
                }
            }
        });
    }
    
    // Populate warehouse name
    if (frm.doc.warehouse && !frm.doc.warehouse_name) {
        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: 'Warehouse',
                filters: { name: frm.doc.warehouse },
                fieldname: 'warehouse_name'
            },
            callback: function(r) {
                if (r.message && r.message.warehouse_name) {
                    frm.set_value('warehouse_name', r.message.warehouse_name);
                }
            }
        });
    }
    
    // Populate product name
    if (frm.doc.product && !frm.doc.product_name) {
        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: 'Product',
                filters: { name: frm.doc.product },
                fieldname: 'product_name'
            },
            callback: function(r) {
                if (r.message && r.message.product_name) {
                    frm.set_value('product_name', r.message.product_name);
                }
            }
        });
    }
}

function calculateDebitNoteValues(frm) {
    // Calculate basic value (sum of all debit note amounts)
    let basicValue = 0;
    if (frm.doc.debit_note && frm.doc.debit_note.length > 0) {
        frm.doc.debit_note.forEach(function(row) {
            basicValue += flt(row.amount) || 0;
        });
    }
    
    frm.set_value('debit_note_basic_value', basicValue);
    
    // Get GST rates from App Settings
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: 'App Settings',
            filters: { name: 'App Settings' },
            fieldname: ['debit_note_cgst_rate', 'debit_note_sgst_rate', 'debit_note_igst_rate']
        },
        callback: function(r) {
            if (r.message) {
                let cgstRate = flt(r.message.debit_note_cgst_rate) || 0;
                let sgstRate = flt(r.message.debit_note_sgst_rate) || 0;
                let igstRate = flt(r.message.debit_note_igst_rate) || 0;
                
                // Determine which GST scenario to use based on current Inward record
                let gstAmount = 0;
                
                if ((flt(frm.doc.cgst_amount) > 0) || (flt(frm.doc.sgst_amount) > 0)) {
                    // Scenario 1: CGST + SGST (Intra-state)
                    gstAmount = basicValue * (cgstRate + sgstRate) / 100;
                } else if ((flt(frm.doc.cgst_amount) === 0) && (flt(frm.doc.sgst_amount) === 0) && (flt(frm.doc.igst_amount) > 0)) {
                    // Scenario 2: IGST Only (Inter-state)
                    gstAmount = basicValue * igstRate / 100;
                }
                
                let netPayable = basicValue + gstAmount;
                
                frm.set_value('debit_note_gst_amount', gstAmount);
                frm.set_value('debit_note_net_payable', netPayable);
            }
        }
    });
}

// Auto-update debit note with total deductions
function calculate_and_update_debit_note(frm) {
    if (!frm.doc.total_deductions || frm.doc.total_deductions <= 0) {
        return;
    }
    
    // Clear existing debit note rows
    frm.clear_table('debit_note');
    
    // Add first row with weight information (existing functionality)
    let firstRow = frm.add_child('debit_note');
    frappe.model.set_value('Debit Note', firstRow.name, 'particulars', 'Weight Deduction');
    frappe.model.set_value('Debit Note', firstRow.name, 'deducted_weight_kg', 0);
    frappe.model.set_value('Debit Note', firstRow.name, 'amount', 0);
    
    // Add second row with total deductions
    let secondRow = frm.add_child('debit_note');
    frappe.model.set_value('Debit Note', secondRow.name, 'particulars', 'Quality and other deductions');
    frappe.model.set_value('Debit Note', secondRow.name, 'deducted_weight_kg', 0);
    frappe.model.set_value('Debit Note', secondRow.name, 'amount', frm.doc.total_deductions);
    
    frm.refresh_field('debit_note');
    
    // Recalculate debit note values
    calculateDebitNoteValues(frm);
}

// Make the function available globally
window.calculate_and_update_debit_note = calculate_and_update_debit_note;

