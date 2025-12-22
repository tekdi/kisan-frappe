// Copyright (c) 2025, Kisan Warehouse and contributors
// For license information, please see license.txt

frappe.ui.form.on('Commodity', {
	refresh: function (frm) {
		// Set default values
		if (frm.is_new()) {
			frm.set_value('status', 'Active');
		}
	},

	validate: function (frm) {
		// Capitalize commodity name and category
		['commodity_name', 'category'].forEach(function (field) {
			if (frm.doc[field]) {
				let formatted = frm.doc[field].charAt(0).toUpperCase() + frm.doc[field].slice(1).toLowerCase();
				if (formatted !== frm.doc[field]) {
					frm.set_value(field, formatted);
				}
			}
		});

		// Validate required fields
		if (!frm.doc.commodity_name) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Commodity Name is required'),
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

		// Validate bag configurations
		// if (!frm.doc.bag_configurations || frm.doc.bag_configurations.length === 0) {
		// 	frappe.msgprint({
		// 		title: __('Bag Configuration Required'),
		// 		message: __('At least one bag configuration is required'),
		// 		indicator: 'red'
		// 	});
		// 	frappe.validated = false;
		// 	return;
		// }


		// Check for duplicate bag weights
		let bag_weights = [];
		let duplicate_weights = [];

		if (frm.doc.bag_configurations && frm.doc.bag_configurations.length > 0) {
			frm.doc.bag_configurations.forEach(function (row, index) {
				if (row.bag_weight) {
					if (bag_weights.includes(row.bag_weight)) {
						duplicate_weights.push(row.bag_weight);
					} else {
						bag_weights.push(row.bag_weight);
					}
				}
			});

			if (duplicate_weights.length > 0) {
				frappe.msgprint({
					title: __('Duplicate Bag Weight'),
					message: __('Duplicate bag weights found: ' + duplicate_weights.join(', ') + '. Each bag weight must be unique.'),
					indicator: 'red'
				});
				frappe.validated = false;
				return;
			}

			// Validate bag configurations
			frm.doc.bag_configurations.forEach(function (row, index) {
				// Validate bag weight
				if (!row.bag_weight) {
					frappe.msgprint({
						title: __('Invalid Bag Configuration'),
						message: __('Bag weight is required for row ' + (index + 1)),
						indicator: 'red'
					});
					frappe.validated = false;
					return;
				}

				// Validate rate per bag per day
				if (!row.rate_per_bag_per_day || row.rate_per_bag_per_day <= 0) {
					frappe.msgprint({
						title: __('Invalid Bag Configuration'),
						message: __('Rate per bag per day must be greater than 0 for row ' + (index + 1)),
						indicator: 'red'
					});
					frappe.validated = false;
					return;
				}
			});
		}

		// Validate HSN code format if provided
		if (frm.doc.hsn_code) {
			let hsn_code = frm.doc.hsn_code.replace(/\D/g, '');
			if (hsn_code.length !== 8) {
				frappe.msgprint({
					title: __('Invalid HSN Code'),
					message: __('HSN code must be exactly 8 digits'),
					indicator: 'red'
				});
				frappe.validated = false;
				return;
			}
			frm.set_value('hsn_code', hsn_code);
		}
	}
});

// Child table validations
frappe.ui.form.on('Commodity Bag Configuration', {
	bag_weight: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];

		// Check for duplicate bag weights
		let duplicate_found = false;
		frm.doc.bag_configurations.forEach(function (config_row, index) {
			if (config_row.name !== row.name && config_row.bag_weight === row.bag_weight) {
				duplicate_found = true;
			}
		});

		if (duplicate_found) {
			frappe.msgprint({
				title: __('Duplicate Bag Weight'),
				message: __('This bag weight is already configured. Please select a different weight.'),
				indicator: 'red'
			});
			frappe.set_value(cdt, cdn, 'bag_weight', '');
		}
	},

	rate_per_bag_per_day: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];

		// Validate positive rate
		if (row.rate_per_bag_per_day && row.rate_per_bag_per_day <= 0) {
			frappe.msgprint({
				title: __('Invalid Rate'),
				message: __('Rate per bag per day must be greater than 0'),
				indicator: 'red'
			});
			frappe.set_value(cdt, cdn, 'rate_per_bag_per_day', '');
		}
	},

	bag_configurations_remove: function (frm) {
		// Check if at least one configuration remains
		if (frm.doc.bag_configurations && frm.doc.bag_configurations.length === 0) {
			frappe.msgprint({
				title: __('Bag Configuration Required'),
				message: __('At least one bag configuration is required'),
				indicator: 'red'
			});
		}
	}
});