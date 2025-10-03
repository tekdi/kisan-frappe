// Copyright (c) 2025, Kisan Warehouse and contributors
// For license information, please see license.txt

frappe.ui.form.on('Godown', {
	refresh: function(frm) {
		// Set default values
		if (frm.is_new()) {
			frm.set_value('status', 'Active');
		}
	},

	validate: function(frm) {
		// Capitalize godown name, city, state
		['godown_name', 'city', 'state'].forEach(function(field) {
			if (frm.doc[field]) {
				let formatted = frm.doc[field].charAt(0).toUpperCase() + frm.doc[field].slice(1).toLowerCase();
				if (formatted !== frm.doc[field]) {
					frm.set_value(field, formatted);
				}
			}
		});

		// Validate required fields
		if (!frm.doc.godown_name) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Godown Name is required'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		if (!frm.doc.godown_code) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Godown Code is required'),
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

		// Validate address fields
		if (!frm.doc.address) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Address is required'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		if (!frm.doc.city) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('City is required'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		if (!frm.doc.state) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('State is required'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		if (!frm.doc.zip) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('ZIP Code is required'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		// Validate ZIP code format
		if (frm.doc.zip && !/^\d{6}$/.test(frm.doc.zip)) {
			frappe.msgprint({
				title: __('Invalid ZIP Code'),
				message: __('ZIP Code must be exactly 6 digits'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		// Validate mobile number format if provided
		if (frm.doc.mobile && !/^\d{10}$/.test(frm.doc.mobile)) {
			frappe.msgprint({
				title: __('Invalid Mobile Number'),
				message: __('Mobile number must be exactly 10 digits'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}
	}
});