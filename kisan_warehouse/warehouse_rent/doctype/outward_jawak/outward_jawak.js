// Outward Jawak Client Script
// Auto-population from Inward Aawak using Firm + Inward Lot No and Real-time Calculations

console.log('Outward Jawak client script loaded');

let currentAawak = null;

frappe.ui.form.on('Outward Jawak', {
	onload: function (frm) {
		console.log('Outward Jawak onload event called');

		// Ensure proper field display on form load
		if (frm.doc.storage_customer || (frm.doc.commodities && frm.doc.commodities.length > 0) || frm.doc.godown || frm.doc.floor || frm.doc.chamber) {
			// Refresh fields to show actual names instead of naming series
			frm.refresh_field('storage_customer');
			frm.refresh_field('commodities');
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

		// Apply bold styling to specific field labels
		applyBoldLabels(frm);

		// Auto-populate when Firm and Inward Lot No are already present
		if (frm.doc.firm && frm.doc.inward_lot_no) {
			console.log('Auto-populating from Firm and Inward Lot No on load');
			fetchAawakByFirmAndLot(frm);
		}

		// Load lot options for selected firm on load
		loadLotOptions(frm);
	},

	refresh: function (frm) {
		console.log('Outward Jawak refresh event called');

		// Initialize form using Firm + Inward Lot No
		if (frm.doc.firm && frm.doc.inward_lot_no) {
			console.log('Auto-populating from Firm and Inward Lot No on refresh');
			fetchAawakByFirmAndLot(frm);
		}

		// Refresh lot number options based on firm
		loadLotOptions(frm);

		// Ensure all fields are visible and refreshed with actual names
		console.log('Refreshing all fields');
		frm.refresh_field('storage_customer');
		frm.refresh_field('commodities');
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

		// Apply bold styling to specific field labels
		applyBoldLabels(frm);

		console.log('All fields refreshed');
	},

	firm: function (frm) {
		console.log('firm field changed to:', frm.doc.firm);
		onFirmOrLotChange(frm);
	},

	inward_lot_no: function (frm) {
		console.log('inward_lot_no field changed to:', frm.doc.inward_lot_no);
		onFirmOrLotChange(frm);
	},

	jawak_date: function (frm) {
		console.log('jawak_date changed to:', frm.doc.jawak_date);

		// Validate Jawak date against Aawak date
		validateJawakDate(frm);

		// Recalculate all days and amounts when jawak date changes
		// Use setTimeout to ensure the form value is fully updated
		setTimeout(() => {
			recalculateAllAmounts(frm);
		}, 100);
	},

	additional_charges: function (frm) {
		console.log('additional_charges changed to:', frm.doc.additional_charges);
		calculateNetAmount(frm);
	},

	discount: function (frm) {
		console.log('discount changed to:', frm.doc.discount);
		calculateNetAmount(frm);
	},

	inward_charges: function (frm) {
		console.log('inward_charges changed to:', frm.doc.inward_charges);
		calculateNetAmount(frm);
	},

	payment_method: function (frm) {
		console.log('payment_method changed to:', frm.doc.payment_method);
		// Clear payment reference when payment method changes
		if (frm.doc.payment_method === 'Cash') {
			frm.set_value('payment_reference', '');
		}
	}
});

// Jawak Bag Detail child table events
frappe.ui.form.on('Jawak Bag Detail', {
	release_bags: function (frm, cdt, cdn) {
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

		// Calculate total amount for this row and then update parent
		// Passing true to indicate we want to update parent totals after this row update
		calculateRowAmount(frm, cdt, cdn, true);
	},

	jawak_bag_details_remove: function (frm) {
		console.log('Bag detail row removed');
		calculateParentTotals(frm);
	},

	jawak_bag_details_add: function (frm) {
		console.log('Bag detail row added');
		// Set default release_bags = total_bags for new rows
		let new_row = frm.doc.jawak_bag_details[frm.doc.jawak_bag_details.length - 1];
		if (new_row.total_bags && !new_row.release_bags) {
			frappe.model.set_value('Jawak Bag Detail', new_row.name, 'release_bags', new_row.total_bags);
		}
	}
});

// Helper Functions

function loadLotOptions(frm) {
	// If no firm selected, clear options and value
	if (!frm.doc.firm) {
		frm.set_df_property('inward_lot_no', 'options', []);
		frm.set_value('inward_lot_no', '');
		return;
	}

	const firm = String(frm.doc.firm);

	console.log('Loading lot options for firm:', firm);

	frappe.call({
		method: 'frappe.client.get_list',
		args: {
			doctype: 'Inward Aawak',
			filters: {
				firm: firm
			},
			fields: ['lot_number'],
			order_by: 'lot_number asc',
			limit_page_length: 500
		},
		callback: function (r) {
			if (r.message && r.message.length > 0) {
				// Collect unique lot numbers
				const lots = [...new Set(r.message.map(row => row.lot_number).filter(Boolean))];
				// Set options; ensure string values so they match stored lot_number
				frm.set_df_property('inward_lot_no', 'options', lots);

				// If current lot no is not in options, clear it
				if (frm.doc.inward_lot_no && !lots.includes(frm.doc.inward_lot_no)) {
					frm.set_value('inward_lot_no', '');
				}
			} else {
				frm.set_df_property('inward_lot_no', 'options', []);
				frm.set_value('inward_lot_no', '');
				frappe.msgprint({
					title: __('No Lots Found'),
					message: __('No Inward Aawak records found for Firm {0}.', [firm]),
					indicator: 'orange'
				});
			}
		}
	});
}

function onFirmOrLotChange(frm) {
	// Reset any previously fetched data to avoid stale values
	currentAawak = null;

	// Clear inward_charges first to ensure it doesn't retain old value
	frm.set_value('inward_charges', 0);

	// Clear all auto-populated fields to prevent partial data
	clearForm(frm);

	// Refresh lot options for the selected firm
	loadLotOptions(frm);

	// Only fetch when both Firm and Inward Lot No are present
	if (frm.doc.firm && frm.doc.inward_lot_no) {
		console.log('Attempting fetch using Firm and Inward Lot No');
		fetchAawakByFirmAndLot(frm);
	}
}

function fetchAawakByFirmAndLot(frm) {
	const firm = frm.doc.firm;
	const lotNo = frm.doc.inward_lot_no;

	if (!firm || !lotNo) {
		console.log('Firm or Inward Lot No missing; skipping fetch');
		currentAawak = null;
		return;
	}

	const firmFilter = String(firm);
	const lotFilter = String(lotNo);

	console.log('Fetching Inward Aawak using Firm and Inward Lot No:', firmFilter, lotFilter);

	frappe.call({
		method: 'frappe.client.get_list',
		args: {
			doctype: 'Inward Aawak',
			filters: {
				firm: firmFilter,
				lot_number: lotFilter
			},
			fields: ['name'],
			limit_page_length: 2
		},
		callback: function (r) {
			if (r.message && r.message.length === 1) {
				console.log('Unique Inward Aawak match found:', r.message[0].name);
				fetchAawakRecord(frm, r.message[0].name);
			} else if (r.message && r.message.length === 0) {
				clearForm(frm);
				frappe.msgprint({
					title: __('Inward Aawak Not Found'),
					message: __('No Inward Aawak found for Firm {0} and Inward Lot No {1}.', [firm, lotNo]),
					indicator: 'red'
				});
			} else {
				clearForm(frm);
				frappe.msgprint({
					title: __('Multiple Matches Found'),
					message: __('Multiple Inward Aawak records found for Firm {0} and Inward Lot No {1}. Please resolve duplicates.', [firm, lotNo]),
					indicator: 'red'
				});
			}
		}
	});
}

function fetchAawakRecord(frm, aawakName) {
	frappe.call({
		method: 'frappe.client.get',
		args: {
			doctype: 'Inward Aawak',
			name: aawakName
		},
		callback: function (r) {
			console.log('Inward Aawak data received:', r.message);

			if (r.message) {
				populateFromAawakData(frm, r.message);

				// Validate Jawak date against Aawak date after populating
				validateJawakDate(frm);
			} else {
				clearForm(frm);
				frappe.msgprint({
					title: __('Error'),
					message: __('Could not fetch Inward Aawak details'),
					indicator: 'red'
				});
			}
		}
	});
}

function populateFromAawakData(frm, aawak) {
	if (!aawak) {
		return;
	}

	console.log('Populating Outward Jawak from Inward Aawak:', aawak.name);

	// Reset existing auto-populated data
	clearForm(frm);

	// Keep reference to current Inward Aawak for downstream calculations
	currentAawak = aawak;

	// Populate basic fields
	frm.set_value('storage_customer', aawak.storage_customer);
	frm.set_value('godown', aawak.godown);

	// Get floor and chamber from chamber allocations
	if (aawak.chamber_allocations && aawak.chamber_allocations.length > 0) {
		let allocation = aawak.chamber_allocations[0];
		frm.set_value('floor', allocation.floor);
		frm.set_value('chamber', allocation.chamber);
	}

	// Populate commodities with names (async)
	populateCommodities(frm, aawak.commodities);

	// Populate bag details
	populateBagDetails(frm, aawak);

	// Auto-fetch inward charges
	if (aawak.charges) {
		frm.set_value('inward_charges', aawak.charges);
	}

	// Refresh all fields to ensure visibility and proper display of names
	frm.refresh_field('storage_customer');
	frm.refresh_field('godown');
	frm.refresh_field('floor');
	frm.refresh_field('chamber');
	frm.refresh_field('jawak_bag_details');
	frm.refresh_field('inward_charges');
}

function populateCommodities(frm, inward_commodities) {
	frm.clear_table('commodities');

	if (inward_commodities && inward_commodities.length > 0) {
		let commodity_ids = inward_commodities.map(row => row.commodity);

		// Fetch commodity names to prime the Link Title cache for display
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'Commodity',
				filters: [['name', 'in', commodity_ids]],
				fields: ['name', 'commodity_name']
			},
			callback: function (r) {
				if (r.message) {
					// Prime the link title cache so the UI displays names instead of IDs
					if (!frappe.boot.link_title) frappe.boot.link_title = {};
					if (!frappe.boot.link_title['Commodity']) frappe.boot.link_title['Commodity'] = {};

					r.message.forEach(c => {
						// Update global link title cache
						frappe.boot.link_title['Commodity'][c.name] = c.commodity_name;

						// Also try adding to local link_titles if available (newer Frappe versions)
						if (frappe.utils.add_link_title) {
							frappe.utils.add_link_title('Commodity', c.name, c.commodity_name);
						}
					});

					// Add rows using set_value to trigger UI updates and proper rendering
					inward_commodities.forEach(row => {
						let child = frm.add_child('commodities');
						frappe.model.set_value(child.doctype, child.name, 'commodity', row.commodity);
					});

					frm.refresh_field('commodities');

					// Force grid refresh to ensure titles are picked up
					if (frm.fields_dict['commodities'] && frm.fields_dict['commodities'].grid) {
						frm.fields_dict['commodities'].grid.refresh();
					}

					console.log('Commodities populated and cache primed with names:', r.message);
				}
			}
		});
	} else {
		frm.refresh_field('commodities');
	}
}

function populateBagDetails(frm, aawak) {
	console.log('Populating bag details from Aawak:', aawak);

	// Clear existing bag details
	frm.clear_table('jawak_bag_details');

	if (aawak.bag_details && aawak.bag_details.length > 0) {
		console.log('Found bag details:', aawak.bag_details);

		// Directly use bag details from Inward Aawak
		// This handles multiple commodities and their rates correctly
		aawak.bag_details.forEach(bagDetail => {
			let new_row = frm.add_child('jawak_bag_details');

			// Set bag type as bag weight (e.g., "5" for 5kg bags)
			frappe.model.set_value('Jawak Bag Detail', new_row.name, 'bag_type', bagDetail.bag_weight);
			frappe.model.set_value('Jawak Bag Detail', new_row.name, 'total_bags', bagDetail.number_of_bags);
			frappe.model.set_value('Jawak Bag Detail', new_row.name, 'release_bags', bagDetail.number_of_bags);

			// Auto-populate rate from Inward Aawak's bag details
			// This fixes the "Commodity not found" error and supports multiple commodities
			let rate = bagDetail.rate || 0;
			frappe.model.set_value('Jawak Bag Detail', new_row.name, 'rate', rate);

			console.log('Added bag detail row:', {
				bag_type: bagDetail.bag_weight,
				total_bags: bagDetail.number_of_bags,
				release_bags: bagDetail.number_of_bags,
				rate: rate
			});
		});

		frm.refresh_field('jawak_bag_details');

		// Calculate all amounts after populating bag details
		recalculateAllAmounts(frm);

	} else {
		frappe.msgprint({
			title: __('No Bag Details Found'),
			message: __('No bag details found in selected Aawak reference'),
			indicator: 'orange'
		});
	}
}

function recalculateAllAmounts(frm) {
	if (!frm.doc.jawak_date || !currentAawak || !currentAawak.aawak_date) {
		console.log('Cannot recalculate: missing jawak_date or Inward Aawak context');
		return;
	}

	console.log('Recalculating all amounts for jawak_date:', frm.doc.jawak_date);

	// Fetch settings ONCE to avoid N+1 queries and race conditions
	frappe.call({
		method: 'frappe.client.get',
		args: {
			doctype: 'App Settings',
			name: 'App Settings'
		},
		callback: function (r) {
			if (r.message) {
				let settings = r.message;

				if (frm.doc.jawak_bag_details) {
					// Iterate and calculate synchronously
					frm.doc.jawak_bag_details.forEach(row => {
						performRowCalculation(frm, 'Jawak Bag Detail', row.name, settings);
					});
				}

				// Refresh grid to show updates
				frm.refresh_field('jawak_bag_details');

				// Now calculate parent totals immediately as rows are updated
				calculateParentTotals(frm);
			}
		}
	});
}

function calculateRowAmount(frm, cdt, cdn, updateParent = false) {
	// Fetch settings for single row calculation
	frappe.call({
		method: 'frappe.client.get',
		args: {
			doctype: 'App Settings',
			name: 'App Settings'
		},
		callback: function (r) {
			if (r.message) {
				performRowCalculation(frm, cdt, cdn, r.message);
				if (updateParent) {
					calculateParentTotals(frm);
				}
			}
		}
	});
}

function performRowCalculation(frm, cdt, cdn, settings) {
	let row = locals[cdt][cdn];
	if (!frm.doc.jawak_date || !currentAawak || !currentAawak.aawak_date) return;

	let aawakDate = new Date(currentAawak.aawak_date);
	let jawakDate = new Date(frm.doc.jawak_date);

	let aawakDay = new Date(aawakDate.getFullYear(), aawakDate.getMonth(), aawakDate.getDate());
	let jawakDay = new Date(jawakDate.getFullYear(), jawakDate.getMonth(), jawakDate.getDate());
	let actualDays = Math.round((jawakDay - aawakDay) / (1000 * 60 * 60 * 24));

	let minDays = parseInt(settings.minimum_chargeable_days) || 15;
	let extraDays = parseInt(settings.extra_days_after_minimum) || 2;
	let daysPerMonth = parseInt(settings.days_per_month) || 30;

	// Calculate chargeable days
	let chargeableDays;
	if (actualDays <= minDays) {
		chargeableDays = minDays;
	} else {
		chargeableDays = actualDays + extraDays;
	}

	// Update total days
	frappe.model.set_value(cdt, cdn, 'total_days', chargeableDays);

	// Calculate amount
	if (row.release_bags && row.rate) {
		let dailyRate = row.rate / daysPerMonth;
		let totalAmount = row.release_bags * dailyRate * chargeableDays;
		totalAmount = Math.round(totalAmount * 100) / 100;

		frappe.model.set_value(cdt, cdn, 'total_amount', totalAmount);
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
	let inwardCharges = frm.doc.inward_charges || 0;
	let discount = frm.doc.discount || 0;

	let netAmount = totalAmount + additionalCharges + inwardCharges - discount;
	netAmount = Math.round(netAmount * 100) / 100; // Round to 2 decimal places

	console.log('Net amount calculated:', netAmount, 'from total:', totalAmount, 'plus additional charges:', additionalCharges, 'plus inward charges:', inwardCharges, 'minus discount:', discount);

	frm.set_value('net_amount', netAmount);
}

function clearForm(frm) {
	console.log('Clearing form');

	// Reset cached Inward Aawak context to avoid stale calculations
	currentAawak = null;

	// Clear all auto-populated fields
	frm.set_value('storage_customer', '');
	frm.clear_table('commodities');
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

function validateJawakDate(frm) {
	// Only validate if both dates are present
	if (!frm.doc.jawak_date || !currentAawak || !currentAawak.aawak_date) {
		return;
	}

	console.log('Validating Jawak date against Aawak date');

	let aawakDate = new Date(currentAawak.aawak_date);
	let jawakDate = new Date(frm.doc.jawak_date);

	console.log('Comparing dates - Aawak:', aawakDate, 'Jawak:', jawakDate);

	// Check if Jawak date is after Aawak date
	if (jawakDate <= aawakDate) {
		// Clear the invalid Jawak date
		frm.set_value('jawak_date', '');

		// Show error message
		frappe.msgprint({
			title: __('Invalid Jawak Date'),
			message: __('Jawak Date must be after Aawak Date. Aawak Date is: ' + frappe.datetime.str_to_user(aawakDate) + '. Please enter a later date.'),
			indicator: 'red'
		});

		console.log('Date validation failed - Jawak date cleared');
	} else {
		console.log('Date validation passed');
	}
}

function applyBoldLabels(frm) {
	// Apply bold styling to specific field labels
	const fieldsToBold = ['godown', 'floor', 'chamber'];

	fieldsToBold.forEach(function (fieldname) {
		// Use setTimeout to ensure DOM is ready
		setTimeout(function () {
			// Find the label element for the field
			let fieldWrapper = frm.fields_dict[fieldname].$wrapper;
			if (fieldWrapper && fieldWrapper.length) {
				let labelElement = fieldWrapper.find('label');
				if (labelElement && labelElement.length) {
					labelElement.css('font-weight', 'bold');
					console.log('Applied bold styling to', fieldname, 'label');
				}
			}
		}, 100);
	});
}