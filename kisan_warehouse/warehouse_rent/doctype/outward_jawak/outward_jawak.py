# Copyright (c) 2025, Kisan Warehouse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.model.naming import make_autoname


class OutwardJawak(Document):
	def autoname(self):
		"""
		Custom naming to support firm-wise sequences, matching Inward Aawak pattern.
		
		Each firm gets its own independent sequence.
		Format: JAWAK-{firm_sequence}-YYYY-####
		
		Where:
		- firm_sequence is the firm's auto-generated number (e.g., FIRM-0001 -> 0001)
		- YYYY is the year
		- #### is the sequence number for that firm
		
		Example: JAWAK-0001-2025-0001 (Firm FIRM-0001, first jawak of 2025)
		         JAWAK-0002-2025-0001 (Firm FIRM-0002, first jawak of 2025)
		"""
		if self.firm:
			# Get the firm's sequence number from its name
			# Firm name format is FIRM-0001, FIRM-0002, etc.
			firm_parts = self.firm.split('-')
			if len(firm_parts) >= 2:
				firm_seq = firm_parts[-1]  # Extract the numeric part (e.g., "0001")
			else:
				# Fallback if firm name doesn't follow expected format
				firm_seq = self.firm.replace('FIRM-', '').replace('FIRM', '')[:4].zfill(4)
			
			# Create firm-specific series key
			# This ensures each firm has its own sequence counter
			series_key = f"JAWAK-.{self.firm}-.YYYY.-.####"
			
			# Get next number from firm-specific series
			full_name = make_autoname(series_key)
			
			# Extract year and sequence number from the generated name
			# Format will be: JAWAK-FIRM-0001-2025-0001
			parts = full_name.split('-')
			
			if len(parts) >= 2:
				year = parts[-2]
				sequence = parts[-1]
				# Create final name with firm sequence included
				self.name = f"JAWAK-{firm_seq}-{year}-{sequence}"
				# Set lot number (sequence only) for printing/receipts
				self.lot_number = sequence
			else:
				# Fallback in case of unexpected format
				self.name = full_name
		else:
			# Fallback for legacy records or if firm is not set
			# This maintains backward compatibility
			self.name = make_autoname("JAWAK-.YYYY.-.####")
			self.lot_number = self.name.split('-')[-1] if '-' in self.name else ""
	
	def validate(self):
		pass