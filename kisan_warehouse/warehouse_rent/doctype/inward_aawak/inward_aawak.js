// Copyright (c) 2025, Kisan Warehouse and contributors
// For license information, please see license.txt

frappe.ui.form.on('Inward Aawak', {
	refresh: function(frm) {
		// Set default values
		if (frm.is_new()) {
			frm.set_value('status', 'Draft');
		}
		
		// Set up dynamic filtering for Godown → Floor → Chamber hierarchy
		setupHierarchyFiltering(frm);
		
		// Initialize bag details if commodity is already selected
		if (frm.doc.commodity && frm.doc.bag_details.length === 0) {
			populateBagWeights(frm);
		}
		
		// Ensure naming series is properly displayed
		if (frm.doc.naming_series && frm.doc.naming_series.includes('YYYY')) {
			// This is a pattern, not the actual name - refresh to get the real name
			frm.refresh_field('naming_series');
		}
	},

	validate: function(frm) {
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

		if (!frm.doc.commodity) {
			frappe.msgprint({
				title: __('Required Field Missing'),
				message: __('Commodity is required'),
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
		frm.doc.bag_details.forEach(function(row, index) {
			if (!row.bag_weight) {
				frappe.msgprint({
					title: __('Bag Details Error'),
					message: __('Row ' + (index + 1) + ': Please select bag weight'),
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

			frm.doc.chamber_allocations.forEach(function(allocation, index) {
				// Validate required fields
				if (!allocation.floor) {
					frappe.msgprint({
						title: __('Chamber Allocation Error'),
						message: __('Floor is required for allocation ' + (index + 1)),
						indicator: 'red'
					});
					frappe.validated = false;
					return;
				}

				if (!allocation.chamber) {
					frappe.msgprint({
						title: __('Chamber Allocation Error'),
						message: __('Chamber is required for allocation ' + (index + 1)),
						indicator: 'red'
					});
					frappe.validated = false;
					return;
				}

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
	commodity: function(frm) {
		// Clear bag details and reset totals when commodity changes
		frm.clear_table('bag_details');
		frm.set_value('total_bags', 0);
		frm.set_value('total_weight', 0);
		frm.refresh_field('bag_details');
		
		// Populate bag weights for selected commodity
		if (frm.doc.commodity) {
			populateBagWeights(frm);
		}
	},

	godown: function(frm) {
		// Clear chamber allocations when godown changes
		frm.clear_table('chamber_allocations');
		frm.refresh_field('chamber_allocations');
	}
});

// Bag Details child table validations
frappe.ui.form.on('Bag Details', {
	bag_weight: function(frm, cdt, cdn) {
		calculateRowTotal(frm, cdt, cdn);
		calculateGrandTotals(frm);
	},

	number_of_bags: function(frm, cdt, cdn) {
		calculateRowTotal(frm, cdt, cdn);
		calculateGrandTotals(frm);
	},

	bag_details_remove: function(frm) {
		calculateGrandTotals(frm);
	},

	bag_details_add: function(frm) {
		// Set default values for new row
		let new_row = frm.doc.bag_details[frm.doc.bag_details.length - 1];
		if (new_row) {
			frappe.model.set_value('Bag Details', new_row.name, 'number_of_bags', 0);
			frappe.model.set_value('Bag Details', new_row.name, 'total_weight', 0);
		}
	}
});

// Chamber Allocation child table validations
frappe.ui.form.on('Chamber Allocation', {
	floor: function(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		
		// Clear chamber when floor changes
		frappe.model.set_value(cdt, cdn, 'chamber', '');
	},

	chamber: function(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		
		// Get chamber capacity for validation
		if (row.chamber) {
			frappe.call({
				method: 'frappe.client.get_value',
				args: {
					doctype: 'Floor Chamber',
					filters: {
						'name': row.chamber
					},
					fieldname: 'max_capacity'
				},
				callback: function(r) {
					if (r.message && r.message.max_capacity) {
						// Store max capacity for validation
						row.max_capacity = r.message.max_capacity;
					}
				}
			});
		}
	},

	bags_allocated: function(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		
		// Validate against chamber capacity
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

	chamber_allocations_remove: function(frm) {
		validateChamberAllocations(frm);
	},

	chamber_allocations_add: function(frm) {
		// Set default allocation date
		let new_row = frm.doc.chamber_allocations[frm.doc.chamber_allocations.length - 1];
		if (new_row && !new_row.allocation_date) {
			frappe.model.set_value('Chamber Allocation', new_row.name, 'allocation_date', frappe.datetime.get_today());
		}
	}
});

// Helper functions
function populateBagWeights(frm) {
	if (!frm.doc.commodity) {
		frappe.msgprint({
			title: __('Commodity Required'),
			message: __('Please select commodity first'),
			indicator: 'red'
		});
		return;
	}

	// Get commodity details with bag configurations
	frappe.call({
		method: 'frappe.client.get',
		args: {
			doctype: 'Commodity',
			name: frm.doc.commodity
		},
		callback: function(r) {
			if (r.message && r.message.bag_configurations && r.message.bag_configurations.length > 0) {
				// Extract bag weights from commodity's bag configurations
				let bagWeights = r.message.bag_configurations.map(config => config.bag_weight);
				bagWeights.sort((a, b) => a - b); // Sort numerically
				let optionsString = bagWeights.join('\n');
				
				// Update bag_weight field options in child table
				frm.fields_dict.bag_details.grid.update_docfield_property('bag_weight', 'options', optionsString);
				
				// Clear existing rows
				frm.clear_table('bag_details');
				
				// Create a row for EACH bag configuration
				r.message.bag_configurations.forEach(function(config, index) {
					let new_row = frm.add_child('bag_details');
					
					// Pre-fill with bag weight from configuration
					frappe.model.set_value('Bag Details', new_row.name, 'bag_weight', config.bag_weight);
					frappe.model.set_value('Bag Details', new_row.name, 'number_of_bags', 0);
					frappe.model.set_value('Bag Details', new_row.name, 'total_weight', 0);
				});
				
				frm.refresh_field('bag_details');
				
				// Show success message
				frappe.msgprint({
					title: __('Bag Configurations Loaded'),
					message: __('Pre-filled ' + r.message.bag_configurations.length + ' bag detail rows with weights: ' + bagWeights.join(', ') + ' kg'),
					indicator: 'green'
				});
			} else {
				frappe.msgprint({
					title: __('No Bag Weights Found'),
					message: __('Please configure bag weights for commodity: ' + frm.doc.commodity),
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
			// Round to 2 decimal places
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
		frm.doc.bag_details.forEach(function(row) {
			if (row.number_of_bags) {
				totalBags += parseInt(row.number_of_bags) || 0;
			}
			if (row.total_weight) {
				totalWeight += parseFloat(row.total_weight) || 0;
			}
		});
	}
	
	// Round total weight to 2 decimal places
	totalWeight = Math.round(totalWeight * 100) / 100;
	
	frm.set_value('total_bags', totalBags);
	frm.set_value('total_weight', totalWeight);
	
	// Update chamber allocation validation
	validateChamberAllocations(frm);
}

function validateChamberAllocations(frm) {
	if (frm.doc.chamber_allocations && frm.doc.chamber_allocations.length > 0) {
		let total_allocated = 0;
		frm.doc.chamber_allocations.forEach(function(allocation) {
			if (allocation.bags_allocated) {
				total_allocated += allocation.bags_allocated;
			}
		});
		
		// Show validation message if allocation doesn't match total bags
		if (frm.doc.total_bags && total_allocated !== frm.doc.total_bags) {
			frm.dashboard.add_comment(
				'Allocation Status',
				'Total allocated: ' + total_allocated + ' / Total bags: ' + frm.doc.total_bags,
				'orange'
			);
		} else {
			frm.dashboard.clear_comment();
		}
	}
}

// Generic function to set up Godown → Floor → Chamber filtering
function setupHierarchyFiltering(frm) {
	// Filter floors by selected godown
	frm.set_query("floor", "chamber_allocations", function() {
		return {
			filters: {
				godown: frm.doc.godown,
				status: "Active"
			}
		};
	});

	// Filter chambers by selected floor
	frm.set_query("chamber", "chamber_allocations", function(doc, cdt, cdn) {
		let row = locals[cdt][cdn];
		return {
			filters: {
				floor: row.floor,
				status: "Available"
			}
		};
	});
}
