# Copyright (c) 2025, Kisan Warehouse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class Outward(Document):
    def validate(self):
        self.validate_sauda_quantity()

    def validate_sauda_quantity(self):
        """Validate that total quantity doesn't exceed Sauda expected quantity"""
        if not self.sauda:
            return
            
        sauda = frappe.get_doc('Sauda', self.sauda)
        expected_qty = sauda.expected_quantity
        
        # Calculate current outward total
        current_total = sum([item.item_gross_weight for item in self.outward_items])
        
        # Get already dispatched quantity (excluding current doc)
        already_dispatched = get_sauda_dispatched_quantity(self.sauda, self.name)
        
        # Total = already dispatched + current
        total_quantity = already_dispatched + current_total
        
        # Allow small tolerance for floating point calculation if needed, strictly > here
        if total_quantity > expected_qty:
            frappe.throw(
                title=frappe._("Quantity Limit Exceeded"),
                msg=frappe._(
                    "<b>Sauda:</b> {0}<br>"
                    "<b>Expected Quantity:</b> {1} kg<br>"
                    "<b>Already Dispatched:</b> {2} kg<br>"
                    "<b>Current Outward:</b> {3} kg<br><hr>"
                    "<b>Total ({4} kg)</b> exceeds limit by <b>{5} kg</b>"
                ).format(
                    self.sauda,
                    expected_qty,
                    already_dispatched,
                    current_total,
                    total_quantity,
                    total_quantity - expected_qty
                )
            )

@frappe.whitelist()
def get_sauda_dispatched_quantity(sauda_name, exclude_outward=None):
    """
    Returns total dispatched quantity for a Sauda across all Outwards
    
    Args:
        sauda_name: Name of the Sauda
        exclude_outward: Current Outward to exclude (for edit scenarios)
    
    Returns:
        Float: Total gross weight dispatched
    """
    filters = {
        'sauda': sauda_name,
        'docstatus': ['in', [0, 1]]  # Draft and Submitted
    }
    
    if exclude_outward:
        filters['name'] = ['!=', exclude_outward]
    
    outwards = frappe.get_all('Outward', filters=filters, fields=['name'])
    
    if not outwards:
        return 0.0
        
    total_dispatched = 0.0
    for outward in outwards:
        items_weight = frappe.db.sql("""
            SELECT sum(item_gross_weight) 
            FROM `tabOutward Item Detail` 
            WHERE parent = %s
        """, (outward.name))
        
        if items_weight and items_weight[0][0]:
            total_dispatched += items_weight[0][0]
    
    return total_dispatched