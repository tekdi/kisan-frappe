// Copyright (c) 2025, Kisan Warehouse and contributors
// For license information, please see license.txt

frappe.ui.form.on('Godown Floor', {
	refresh: function(frm) {
		// Set default values
		if (frm.is_new()) {
			frm.set_value('status', 'Active');
		}
	},

	validate: function(frm) {
		// Capitalize floor name
		if (frm.doc.floor_name) {
			let formatted = frm.doc.floor_name.charAt(0).toUpperCase() + frm.doc.floor_name.slice(1).toLowerCase();
			if (formatted !== frm.doc.floor_name) {
				frm.set_value('floor_name', formatted);
			}
		}

		// Validate required fields
		if (!frm.doc.floor_name) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Floor Name is required'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		if (!frm.doc.floor_number) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Floor Number is required'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		if (!frm.doc.godown) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Godown is required'),
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
		if (frm.doc.floor_number && frm.doc.floor_number <= 0) {
			frappe.msgprint({
				title: __('Invalid Floor Number'),
				message: __('Floor Number must be greater than 0'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		if (frm.doc.total_area && frm.doc.total_area <= 0) {
			frappe.msgprint({
				title: __('Invalid Area'),
				message: __('Total Area must be greater than 0'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}
	}
});