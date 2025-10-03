// Outward Jawak Client Script
// Auto-population from Aawak Reference and Real-time Calculations

console.log('Outward Jawak client script loaded');

frappe.ui.form.on('Outward Jawak', {
	onload: function(frm) {
		console.log('Outward Jawak onload event called');
		
		// Ensure proper field display on form load
		if (frm.doc.storage_customer || frm.doc.commodity || frm.doc.godown || frm.doc.floor || frm.doc.chamber) {
			// Refresh fields to show actual names instead of naming series
			frm.refresh_field('storage_customer');
			frm.refresh_field('commodity');
			frm.refresh_field('godown');
			frm.refresh_field('floor');
			frm.refresh_field('chamber');
		}
		
		// If form has data but amounts are not calculated, trigger calculation
		if (frm.doc.jawak_bag_details && frm.doc.jawak_bag_details.length > 0 && 
			(!frm.doc.total_amount || frm.doc.total_amount === 0)) {
			console.log('Triggering calculation on form load');
			recalculateAllAmounts(frm);
		}
	},

	refresh: function(frm) {
		console.log('Outward Jawak refresh event called');
		
		// Initialize form
		if (frm.doc.aawak_reference && !frm.doc.storage_customer) {
			console.log('Auto-populating from Aawak reference');
			populateFromAawak(frm);
		}
		
		// Ensure all fields are visible and refreshed with actual names
		console.log('Refreshing all fields');
		frm.refresh_field('storage_customer');
		frm.refresh_field('commodity');
		frm.refresh_field('godown');
		frm.refresh_field('floor');
		frm.refresh_field('chamber');
		frm.refresh_field('jawak_bag_details');
		frm.refresh_field('total_bags');
		frm.refresh_field('released_bags');
		frm.refresh_field('total_weight');
		frm.refresh_field('released_bag_weight');
		frm.refresh_field('total_amount');
		frm.refresh_field('additional_charges');
		frm.refresh_field('discount');
		frm.refresh_field('net_amount');
		frm.refresh_field('payment_method');
		frm.refresh_field('payment_reference');
		frm.refresh_field('notes');
		frm.refresh_field('status');
		
		// If form has data but amounts are not calculated, trigger calculation
		if (frm.doc.jawak_bag_details && frm.doc.jawak_bag_details.length > 0 && 
			(!frm.doc.total_amount || frm.doc.total_amount === 0)) {
			console.log('Triggering calculation for existing data');
			recalculateAllAmounts(frm);
		}
		
		console.log('All fields refreshed');
	},

	aawak_reference: function(frm) {
		console.log('aawak_reference field changed to:', frm.doc.aawak_reference);
		if (frm.doc.aawak_reference) {
			console.log('Calling populateFromAawak');
			populateFromAawak(frm);
		} else {
			console.log('Calling clearForm');
			clearForm(frm);
		}
	},

	jawak_date: function(frm) {
		console.log('jawak_date changed to:', frm.doc.jawak_date);
		// Recalculate all days and amounts when jawak date changes
		recalculateAllAmounts(frm);
	},

	additional_charges: function(frm) {
		console.log('additional_charges changed to:', frm.doc.additional_charges);
		calculateNetAmount(frm);
	},

	discount: function(frm) {
		console.log('discount changed to:', frm.doc.discount);
		calculateNetAmount(frm);
	},

	payment_method: function(frm) {
		console.log('payment_method changed to:', frm.doc.payment_method);
		// Clear payment reference when payment method changes
		if (frm.doc.payment_method === 'Cash') {
			frm.set_value('payment_reference', '');
		}
	}
});

// Jawak Bag Detail child table events
frappe.ui.form.on('Jawak Bag Detail', {
	release_bags: function(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		console.log('release_bags changed to:', row.release_bags, 'for row:', row.name);
		
		// Validate release bags cannot exceed total bags
		if (row.release_bags > row.total_bags) {
			frappe.msgprint({
				title: __('Invalid Release Quantity'),
				message: __('Release bags cannot exceed total bags'),
				indicator: 'red'
			});
			frappe.model.set_value(cdt, cdn, 'release_bags', row.total_bags);
			return;
		}
		
		// Calculate total amount for this row
		calculateRowAmount(frm, cdt, cdn);
		
		// Recalculate parent totals
		calculateParentTotals(frm);
	},

	jawak_bag_details_remove: function(frm) {
		console.log('Bag detail row removed');
		calculateParentTotals(frm);
	},

	jawak_bag_details_add: function(frm) {
		console.log('Bag detail row added');
		// Set default release_bags = total_bags for new rows
		let new_row = frm.doc.jawak_bag_details[frm.doc.jawak_bag_details.length - 1];
		if (new_row.total_bags && !new_row.release_bags) {
			frappe.model.set_value('Jawak Bag Detail', new_row.name, 'release_bags', new_row.total_bags);
		}
	}
});

// Helper Functions

function populateFromAawak(frm) {
	if (!frm.doc.aawak_reference) {
		return;
	}

	console.log('Fetching Aawak details for:', frm.doc.aawak_reference);

	frappe.call({
		method: 'frappe.client.get',
		args: {
			doctype: 'Inward Aawak',
			name: frm.doc.aawak_reference
		},
		callback: function(r) {
			console.log('Aawak data received:', r.message);
			
			if (r.message) {
				let aawak = r.message;
				
				// Populate basic fields
				frm.set_value('storage_customer', aawak.storage_customer);
				frm.set_value('commodity', aawak.commodity);
				frm.set_value('godown', aawak.godown);
				
				// Get floor and chamber from chamber allocations
				if (aawak.chamber_allocations && aawak.chamber_allocations.length > 0) {
					let allocation = aawak.chamber_allocations[0];
					frm.set_value('floor', allocation.floor);
					frm.set_value('chamber', allocation.chamber);
				}
				
				// Populate bag details
				populateBagDetails(frm, aawak);
				
				// Refresh all fields to ensure visibility and proper display of names
				frm.refresh_field('storage_customer');
				frm.refresh_field('commodity');
				frm.refresh_field('godown');
				frm.refresh_field('floor');
				frm.refresh_field('chamber');
				frm.refresh_field('jawak_bag_details');
				
				frappe.msgprint({
					title: __('Aawak Details Loaded'),
					message: __('Form populated with Aawak details'),
					indicator: 'green'
				});
			} else {
				frappe.msgprint({
					title: __('Error'),
					message: __('Could not fetch Aawak details'),
					indicator: 'red'
				});
			}
		}
	});
}

function populateBagDetails(frm, aawak) {
	console.log('Populating bag details from Aawak:', aawak);
	
	// Clear existing bag details
	frm.clear_table('jawak_bag_details');
	
	if (aawak.bag_details && aawak.bag_details.length > 0) {
		console.log('Found bag details:', aawak.bag_details);
		// Get commodity rates
		frappe.call({
			method: 'frappe.client.get',
			args: {
				doctype: 'Commodity',
				name: aawak.commodity
			},
			callback: function(r) {
				if (r.message && r.message.bag_configurations) {
					let commodity = r.message;
					let rateMap = {};
					
					// Create rate map
					commodity.bag_configurations.forEach(config => {
						rateMap[config.bag_weight] = config.rate_per_bag_per_day || 0;
					});
					
					console.log('Rate map created:', rateMap);
					
					// Populate bag details
					aawak.bag_details.forEach(bagDetail => {
						let new_row = frm.add_child('jawak_bag_details');
						
						// Set bag type as bag weight from inward (e.g., "5" for 5kg bags)
						frappe.model.set_value('Jawak Bag Detail', new_row.name, 'bag_type', bagDetail.bag_weight);
						frappe.model.set_value('Jawak Bag Detail', new_row.name, 'total_bags', bagDetail.number_of_bags);
						frappe.model.set_value('Jawak Bag Detail', new_row.name, 'release_bags', bagDetail.number_of_bags);
						frappe.model.set_value('Jawak Bag Detail', new_row.name, 'rate', rateMap[bagDetail.bag_weight] || 0);
						
						console.log('Added bag detail row:', {
							bag_type: bagDetail.bag_weight,
							total_bags: bagDetail.number_of_bags,
							release_bags: bagDetail.number_of_bags,
							rate: rateMap[bagDetail.bag_weight] || 0
						});
					});
					
					frm.refresh_field('jawak_bag_details');
					
					// Calculate all amounts after populating bag details
					recalculateAllAmounts(frm);
					
					frappe.msgprint({
						title: __('Bag Details Loaded'),
						message: __('Bag details populated from Aawak reference'),
						indicator: 'green'
					});
				} else {
					frappe.msgprint({
						title: __('No Commodity Configuration'),
						message: __('Please configure bag rates for commodity: ' + aawak.commodity),
						indicator: 'orange'
					});
				}
			}
		});
	} else {
		frappe.msgprint({
			title: __('No Bag Details Found'),
			message: __('No bag details found in selected Aawak reference'),
			indicator: 'orange'
		});
	}
}

function recalculateAllAmounts(frm) {
	if (!frm.doc.jawak_date || !frm.doc.aawak_reference) {
		console.log('Cannot recalculate: missing jawak_date or aawak_reference');
		return;
	}
	
	console.log('Recalculating all amounts for jawak_date:', frm.doc.jawak_date);
	
	// Get aawak date for calculation
	frappe.call({
		method: 'frappe.client.get_value',
		args: {
			doctype: 'Inward Aawak',
			filters: { name: frm.doc.aawak_reference },
			fieldname: 'aawak_date'
		},
		callback: function(r) {
			if (r.message && r.message.aawak_date) {
				let aawakDate = new Date(r.message.aawak_date);
				let jawakDate = new Date(frm.doc.jawak_date);
				
				// Calculate total days (round up)
				let timeDiff = jawakDate.getTime() - aawakDate.getTime();
				let totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
				
				console.log('Calculated total days:', totalDays, 'from', aawakDate, 'to', jawakDate);
				
				// Update all bag detail rows
				frm.doc.jawak_bag_details.forEach(row => {
					frappe.model.set_value('Jawak Bag Detail', row.name, 'total_days', totalDays);
					calculateRowAmount(frm, 'Jawak Bag Detail', row.name);
				});
				
				calculateParentTotals(frm);
			}
		}
	});
}

function calculateRowAmount(frm, cdt, cdn) {
	let row = locals[cdt][cdn];
	console.log('Calculating row amount for:', row.name, 'with data:', row);
	
	// Calculate total days if not already set
	if (frm.doc.jawak_date && frm.doc.aawak_reference && !row.total_days) {
		frappe.call({
			method: 'frappe.client.get_value',
			args: {
				doctype: 'Inward Aawak',
				filters: { name: frm.doc.aawak_reference },
				fieldname: 'aawak_date'
			},
			callback: function(r) {
				if (r.message && r.message.aawak_date) {
					let aawakDate = new Date(r.message.aawak_date);
					let jawakDate = new Date(frm.doc.jawak_date);
					
					// Calculate total days (round up)
					let timeDiff = jawakDate.getTime() - aawakDate.getTime();
					let totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
					
					frappe.model.set_value(cdt, cdn, 'total_days', totalDays);
					
					// Now calculate amount
					if (row.release_bags && row.rate) {
						let totalAmount = row.release_bags * row.rate * totalDays;
						totalAmount = Math.round(totalAmount * 100) / 100; // Round to 2 decimal places
						frappe.model.set_value(cdt, cdn, 'total_amount', totalAmount);
						console.log('Calculated amount:', totalAmount, 'for', row.release_bags, 'bags at', row.rate, 'for', totalDays, 'days');
					}
				}
			}
		});
	} else if (row.release_bags && row.rate && row.total_days) {
		let totalAmount = row.release_bags * row.rate * row.total_days;
		totalAmount = Math.round(totalAmount * 100) / 100; // Round to 2 decimal places
		
		frappe.model.set_value(cdt, cdn, 'total_amount', totalAmount);
		console.log('Calculated amount:', totalAmount, 'for', row.release_bags, 'bags at', row.rate, 'for', row.total_days, 'days');
	}
}

function calculateParentTotals(frm) {
	console.log('Calculating parent totals');
	
	let totalBags = 0;
	let releasedBags = 0;
	let totalWeight = 0;
	let releasedWeight = 0;
	let totalAmount = 0;
	
	if (frm.doc.jawak_bag_details) {
		frm.doc.jawak_bag_details.forEach(row => {
			totalBags += row.total_bags || 0;
			releasedBags += row.release_bags || 0;
			
			// bag_type contains the bag weight (e.g., "5" for 5kg bags)
			let bagWeight = parseFloat(row.bag_type) || 0;
			totalWeight += (row.total_bags || 0) * bagWeight;
			releasedWeight += (row.release_bags || 0) * bagWeight;
			totalAmount += row.total_amount || 0;
			
			console.log('Row totals:', {
				totalBags: row.total_bags,
				releasedBags: row.release_bags,
				bagWeight: bagWeight,
				totalAmount: row.total_amount
			});
		});
	}
	
	// Round weights to 2 decimal places
	totalWeight = Math.round(totalWeight * 100) / 100;
	releasedWeight = Math.round(releasedWeight * 100) / 100;
	totalAmount = Math.round(totalAmount * 100) / 100;
	
	console.log('Parent totals calculated:', {
		totalBags,
		releasedBags,
		totalWeight,
		releasedWeight,
		totalAmount
	});
	
	frm.set_value('total_bags', totalBags);
	frm.set_value('released_bags', releasedBags);
	frm.set_value('total_weight', totalWeight);
	frm.set_value('released_bag_weight', releasedWeight);
	frm.set_value('total_amount', totalAmount);
	
	calculateNetAmount(frm);
}

function calculateNetAmount(frm) {
	let totalAmount = frm.doc.total_amount || 0;
	let additionalCharges = frm.doc.additional_charges || 0;
	let discount = frm.doc.discount || 0;
	
	let netAmount = totalAmount + additionalCharges - discount;
	netAmount = Math.round(netAmount * 100) / 100; // Round to 2 decimal places
	
	console.log('Net amount calculated:', netAmount, 'from total:', totalAmount, 'plus charges:', additionalCharges, 'minus discount:', discount);
	
	frm.set_value('net_amount', netAmount);
}

function clearForm(frm) {
	console.log('Clearing form');
	
	// Clear all auto-populated fields
	frm.set_value('storage_customer', '');
	frm.set_value('commodity', '');
	frm.set_value('godown', '');
	frm.set_value('floor', '');
	frm.set_value('chamber', '');
	
	// Clear bag details
	frm.clear_table('jawak_bag_details');
	
	// Reset totals
	frm.set_value('total_bags', 0);
	frm.set_value('released_bags', 0);
	frm.set_value('total_weight', 0);
	frm.set_value('released_bag_weight', 0);
	frm.set_value('total_amount', 0);
	frm.set_value('net_amount', 0);
}