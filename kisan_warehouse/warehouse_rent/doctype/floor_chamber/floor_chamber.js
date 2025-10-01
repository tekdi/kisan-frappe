// Copyright (c) 2025, Kisan Warehouse and contributors
// For license information, please see license.txt

frappe.ui.form.on('Floor Chamber', {
	refresh: function(frm) {
		// Set default values
		if (frm.is_new()) {
			frm.set_value('status', 'Available');
		}
	},

	validate: function(frm) {
		// Capitalize chamber name
		if (frm.doc.chamber_name) {
			let formatted = frm.doc.chamber_name.charAt(0).toUpperCase() + frm.doc.chamber_name.slice(1).toLowerCase();
			if (formatted !== frm.doc.chamber_name) {
				frm.set_value('chamber_name', formatted);
			}
		}

		// Validate required fields
		if (!frm.doc.chamber_name) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Chamber Name is required'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		if (!frm.doc.chamber_code) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Chamber Code is required'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		if (!frm.doc.floor) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Floor is required'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		if (!frm.doc.status) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Status is required'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		// Validate positive values
		if (frm.doc.area && frm.doc.area <= 0) {
			frappe.msgprint({
				title: __('Invalid Area'),
				message: __('Area must be greater than 0'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		if (frm.doc.max_capacity && frm.doc.max_capacity <= 0) {
			frappe.msgprint({
				title: __('Invalid Capacity'),
				message: __('Max Capacity must be greater than 0'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}
	}
});
