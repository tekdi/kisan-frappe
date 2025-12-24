// Helper function to setup read-only for Bag Details rate field
function setupBagDetailsReadOnly(frm) {
	if (!frm.fields_dict['bag_details'] || !frm.fields_dict['bag_details'].grid) {
		return;
	}

	const grid = frm.fields_dict['bag_details'].grid;

	// Iterate through all visible grid rows
	grid.grid_rows.forEach(grid_row => {
		if (grid_row.doc && grid_row.doc.name) {
			const row = grid_row.doc;
			const is_auto = row.is_auto_populated ? 1 : 0;

			// Store initial rate as effective old rate for protection logic
			if (row.rate !== undefined && row.rate !== null) {
				row.__old_rate = row.rate;
			}

			// 1. Update docfield property (Effective for interactions like TAB navigation)
			const rate_field = grid_row.docfields.find(df => df.fieldname === 'rate');
			if (rate_field) {
				rate_field.read_only = is_auto ? 1 : 0;
			}

			// 2. Visual Cue & Click Block
			if (grid_row.wrapper) {
				const cell = grid_row.wrapper.find('[data-fieldname="rate"]');
				if (is_auto) {
					cell.css('background-color', '#f2f2f2'); // Lighter grey
					cell.css('cursor', 'not-allowed');
					cell.attr('title', 'Auto-populated rate cannot be edited');

					// CRITICAL: Block all mouse events so user cannot click to edit
					cell.css('pointer-events', 'none');

					// Also disable inputs if any
					cell.find('input').prop('disabled', true);
				} else {
					cell.css('background-color', '');
					cell.css('cursor', '');
					cell.attr('title', '');
					cell.css('pointer-events', '');
					cell.find('input').prop('disabled', false);
				}
			}

			// 3. Try native toggle if available (for robustness)
			if (grid_row.toggle_editable) {
				grid_row.toggle_editable('rate', !is_auto);
			}

			// 4. Update Grid Form (Popup) if open
			if (grid_row.grid_form && grid_row.grid_form.fields_dict && grid_row.grid_form.fields_dict['rate']) {
				grid_row.grid_form.fields_dict['rate'].df.read_only = is_auto ? 1 : 0;
				grid_row.grid_form.fields_dict['rate'].refresh();
			}
		}
	});

	console.log('Bag Details read-only logic applied');
}

// Copyright (c) 2025, Kisan Warehouse and contributors
// For license information, please see license.txt

frappe.ui.form.on('Inward Aawak', {
	refresh: function (frm) {
		// Set default Aawak date if not set
		if (!frm.doc.aawak_date) {
			frm.set_value('aawak_date', frappe.datetime.now_datetime());
		}

		// Set default status
		if (!frm.doc.status) {
			frm.set_value('status', 'Draft');
		}

		// Auto-populate Bag Configurations if the form is new and bag_details is empty or has default row
		if (frm.is_new()) {
			let is_empty = !frm.doc.bag_details || frm.doc.bag_details.length === 0;
			let is_default_row = frm.doc.bag_details && frm.doc.bag_details.length === 1 && !frm.doc.bag_details[0].bag_weight;

			if (is_empty || is_default_row) {
				populateBagConfigurations(frm);
			}
		}

		// Setup hierarchy filtering
		setupHierarchyFiltering(frm);

		// Setup read-only for Bag Details Rate field (with delay to ensure grid is rendered)
		setTimeout(() => setupBagDetailsReadOnly(frm), 500);

		// Ensure Validation Date is set for all allocations (e.g. default rows)
		if (frm.doc.chamber_allocations) {
			frm.doc.chamber_allocations.forEach(function (row) {
				if (row.allocation_date && !row.valid_to) {
					let valid_to = frappe.datetime.add_months(row.allocation_date, 6);
					frappe.model.set_value('Chamber Allocation', row.name, 'valid_to', valid_to);
				}
			});
		}

		// Ensure naming series is properly displayed to pattern
		if (frm.doc.naming_series && frm.doc.naming_series.includes('YYYY')) {
			frm.refresh_field('naming_series');
		}
	},

	validate: function (frm) {
		// Validate required fields
		if (!frm.doc.storage_customer) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Storage Customer is required'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		if (!frm.doc.commodities || frm.doc.commodities.length === 0) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Please select at least one Commodity'),
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

		// Validate bag details
		if (!frm.doc.bag_details || frm.doc.bag_details.length === 0) {
			frappe.msgprint({
				title: __('Bag Details Required'),
				message: __('Please add at least one bag detail entry'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}

		// Validate each bag detail row
		let hasValidRows = false;
		frm.doc.bag_details.forEach(function (row, index) {
			if (!row.bag_weight) {
				frappe.msgprint({
					title: __('Bag Details Error'),
					message: __('Row ' + (index + 1) + ': Bag weight is missing'),
					indicator: 'red'
				});
				frappe.validated = false;
				return;
			}

			if (!row.number_of_bags || row.number_of_bags <= 0) {
				frappe.msgprint({
					title: __('Bag Details Error'),
					message: __('Row ' + (index + 1) + ': Number of bags must be greater than 0'),
					indicator: 'red'
				});
				frappe.validated = false;
				return;
			}
			hasValidRows = true;
		});

		if (!hasValidRows) {
			frappe.validated = false;
			return;
		}

		// Validate chamber allocations
		if (frm.doc.chamber_allocations && frm.doc.chamber_allocations.length > 0) {
			let total_allocated = 0;
			let chamber_codes = [];
			let duplicate_chambers = [];

			frm.doc.chamber_allocations.forEach(function (allocation, index) {
				if (!allocation.bags_allocated || allocation.bags_allocated <= 0) {
					frappe.msgprint({
						title: __('Chamber Allocation Error'),
						message: __('Bags Allocated must be greater than 0 for allocation ' + (index + 1)),
						indicator: 'red'
					});
					frappe.validated = false;
					return;
				}

				// Check for duplicate chambers
				if (chamber_codes.includes(allocation.chamber)) {
					duplicate_chambers.push(allocation.chamber);
				} else {
					chamber_codes.push(allocation.chamber);
				}

				total_allocated += allocation.bags_allocated;
			});

			if (duplicate_chambers.length > 0) {
				frappe.msgprint({
					title: __('Duplicate Chamber Allocation'),
					message: __('Duplicate chambers found: ' + duplicate_chambers.join(', ') + '. Each chamber can only be allocated once.'),
					indicator: 'red'
				});
				frappe.validated = false;
				return;
			}

			// Validate total allocation equals total bags
			if (total_allocated !== frm.doc.total_bags) {
				frappe.msgprint({
					title: __('Allocation Mismatch'),
					message: __('Total allocated bags (' + total_allocated + ') must equal total bags (' + frm.doc.total_bags + ')'),
					indicator: 'red'
				});
				frappe.validated = false;
				return;
			}
		} else {
			frappe.msgprint({
				title: __('Chamber Allocation Required'),
				message: __('At least one chamber allocation is required'),
				indicator: 'red'
			});
			frappe.validated = false;
			return;
		}
	},

	// Field change handlers
	commodities: function (frm) {
		// Triggered when the table changes
	},

	firm: function (frm) {
		// Clear godown and chamber allocations when firm changes
		if (frm.doc.godown) {
			frm.set_value('godown', '');
			frm.clear_table('chamber_allocations');
			frm.refresh_field('chamber_allocations');
		}
	},

	godown: function (frm) {
		// Clear chamber allocations when godown changes
		frm.clear_table('chamber_allocations');
		frm.refresh_field('chamber_allocations');
	}
});

// Inward Commodity child table triggers
frappe.ui.form.on('Inward Commodity', {
	// Triggers removed as bag details are independent
});

// Bag Details child table validations
frappe.ui.form.on('Bag Details', {
	bag_weight: function (frm, cdt, cdn) {
		calculateRowTotal(frm, cdt, cdn);
		calculateGrandTotals(frm);
	},

	number_of_bags: function (frm, cdt, cdn) {
		calculateRowTotal(frm, cdt, cdn);
		calculateGrandTotals(frm);
	},

	bag_details_remove: function (frm) {
		calculateGrandTotals(frm);
	},

	bag_details_add: function (frm, cdt, cdn) {
		// Set default values for new row
		let row = locals[cdt][cdn];
		if (row) {
			// Ensure defaults
			if (row.number_of_bags === undefined) frappe.model.set_value(cdt, cdn, 'number_of_bags', 0);
			if (row.total_weight === undefined) frappe.model.set_value(cdt, cdn, 'total_weight', 0);

			// MANUALLY added rows are always Editable and NOT auto-populated
			frappe.model.set_value(cdt, cdn, 'is_auto_populated', 0);

			// Ensure rate is editable by checking toggle status
			// (New rows are editable by default, but we can enforce)
			// No logic needed here as toggle_editable defaults to true/enabled unless disabled
		}
	},

	rate: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];

		// Protection: prevent changes on auto-populated rows
		if (row.is_auto_populated == 1) {
			// If we have an old rate, revert to it
			if (row.__old_rate !== undefined && row.__old_rate !== null) {
				if (row.rate != row.__old_rate) {
					frappe.model.set_value(cdt, cdn, 'rate', row.__old_rate);
					frappe.msgprint({
						title: __('Cannot Edit'),
						message: __('Rate cannot be changed for auto-populated rows from Bag Configuration.'),
						indicator: 'orange'
					});
				}
			} else {
				// Edge case: no old rate captured? 
				// Just let it be or warn? 
				// Ideally setupBagDetailsReadOnly captured it.
			}
		} else {
			// For manual rows, update the old rate tracker
			row.__old_rate = row.rate;
		}
	}
});

// Chamber Allocation child table validations
frappe.ui.form.on('Chamber Allocation', {
	floor: function (frm, cdt, cdn) {
		// Clear chamber when floor changes
		frappe.model.set_value(cdt, cdn, 'chamber', '');
	},

	chamber: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		// Get chamber capacity for validation
		if (row.chamber) {
			frappe.call({
				method: 'frappe.client.get_value',
				args: {
					doctype: 'Floor Chamber',
					filters: { 'name': row.chamber },
					fieldname: 'max_capacity'
				},
				callback: function (r) {
					if (r.message && r.message.max_capacity) {
						row.max_capacity = r.message.max_capacity;
					}
				}
			});
		}
	},

	bags_allocated: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		if (row.bags_allocated && row.max_capacity && row.bags_allocated > row.max_capacity) {
			frappe.msgprint({
				title: __('Capacity Exceeded'),
				message: __('Bags allocated (' + row.bags_allocated + ') cannot exceed chamber capacity (' + row.max_capacity + ')'),
				indicator: 'red'
			});
			frappe.set_value(cdt, cdn, 'bags_allocated', '');
		}
		validateChamberAllocations(frm);
	},

	allocation_date: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		if (row.allocation_date) {
			let valid_to = frappe.datetime.add_months(row.allocation_date, 6);
			frappe.model.set_value(cdt, cdn, 'valid_to', valid_to);
		} else {
			frappe.model.set_value(cdt, cdn, 'valid_to', null);
		}
	},

	chamber_allocations_remove: function (frm) {
		validateChamberAllocations(frm);
	},

	chamber_allocations_add: function (frm) {
		let new_row = frm.doc.chamber_allocations[frm.doc.chamber_allocations.length - 1];
		if (new_row) {
			let ref_date = new_row.allocation_date || frappe.datetime.get_today();
			if (!new_row.allocation_date) {
				frappe.model.set_value('Chamber Allocation', new_row.name, 'allocation_date', ref_date);
			}
			let valid_to = frappe.datetime.add_months(ref_date, 6);
			frappe.model.set_value('Chamber Allocation', new_row.name, 'valid_to', valid_to);

			if (frm.doc.total_bags) {
				frappe.model.set_value('Chamber Allocation', new_row.name, 'bags_allocated', frm.doc.total_bags);
			}
		}
	}
});

// Helper functions
function populateBagConfigurations(frm) {
	frappe.call({
		method: 'frappe.client.get_list',
		args: {
			doctype: 'Bag Configuration',
			fields: ['name', 'bag_weight', 'rate_per_bag_per_day'],
			limit_page_length: 100
		},
		callback: function (r) {
			if (r.message && r.message.length > 0) {
				frm.clear_table('bag_details');

				r.message.forEach(function (config) {
					let new_row = frm.add_child('bag_details');
					frappe.model.set_value('Bag Details', new_row.name, 'bag_weight', config.bag_weight);
					frappe.model.set_value('Bag Details', new_row.name, 'rate', config.rate_per_bag_per_day);
					frappe.model.set_value('Bag Details', new_row.name, 'number_of_bags', 0);
					frappe.model.set_value('Bag Details', new_row.name, 'total_weight', 0);
					frappe.model.set_value('Bag Details', new_row.name, 'is_auto_populated', 1);
				});

				frm.refresh_field('bag_details');
				setTimeout(() => setupBagDetailsReadOnly(frm), 500);
			} else {
				frappe.msgprint({
					title: __('No Bag Configurations'),
					message: __('No Bag Configurations found. Please create them in the Bag Configuration master to proceed.'),
					indicator: 'orange'
				});
			}
		}
	});
}

function calculateRowTotal(frm, cdt, cdn) {
	let row = locals[cdt][cdn];
	if (row.bag_weight && row.number_of_bags) {
		let bagWeight = parseFloat(row.bag_weight);
		let numberOfBags = parseInt(row.number_of_bags);
		if (!isNaN(bagWeight) && !isNaN(numberOfBags)) {
			let totalWeight = bagWeight * numberOfBags;
			totalWeight = Math.round(totalWeight * 100) / 100;
			frappe.model.set_value(cdt, cdn, 'total_weight', totalWeight);
		}
	} else {
		frappe.model.set_value(cdt, cdn, 'total_weight', 0);
	}
}

function calculateGrandTotals(frm) {
	let totalBags = 0;
	let totalWeight = 0;
	if (frm.doc.bag_details) {
		frm.doc.bag_details.forEach(function (row) {
			if (row.number_of_bags) totalBags += parseInt(row.number_of_bags) || 0;
			if (row.total_weight) totalWeight += parseFloat(row.total_weight) || 0;
		});
	}
	totalWeight = Math.round(totalWeight * 100) / 100;
	frm.set_value('total_bags', totalBags);
	frm.set_value('total_weight', totalWeight);
	validateChamberAllocations(frm);
}

function validateChamberAllocations(frm) {
	if (frm.doc.chamber_allocations && frm.doc.chamber_allocations.length > 0) {
		let total_allocated = 0;
		frm.doc.chamber_allocations.forEach(function (allocation) {
			if (allocation.bags_allocated) total_allocated += allocation.bags_allocated;
		});

		if (frm.doc.total_bags && total_allocated !== frm.doc.total_bags) {
			frm.dashboard.add_comment('Allocation Status', 'Total allocated: ' + total_allocated + ' / Total bags: ' + frm.doc.total_bags, 'orange');
		} else {
			frm.dashboard.clear_comment();
		}
	}
}

function setupHierarchyFiltering(frm) {
	frm.set_query("godown", function () {
		return { filters: { status: "Active", firm: frm.doc.firm } };
	});
	frm.set_query("floor", "chamber_allocations", function () {
		return { filters: { godown: frm.doc.godown, status: "Active" } };
	});
	frm.set_query("chamber", "chamber_allocations", function (doc, cdt, cdn) {
		let row = locals[cdt][cdn];
		return { filters: { floor: row.floor, status: "Available" } };
	});
}
