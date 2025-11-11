# Copyright (c) 2025, Your Company and contributors
# For license information, please see license.txt
import frappe
import requests
from frappe import _
from frappe.utils import today
import uuid

@frappe.whitelist()
def verify_pan_api(pan_number, first_name=None, last_name=None, customer_type=None):
    """
    Verify PAN number using Cashfree Advanced API
    """
    if not pan_number:
        frappe.msgprint(_("Please enter a PAN number"), alert=True)
        return {"status": "failed", "message": "PAN not provided"}
    
    # Validate PAN format (10 characters: 5 letters, 4 digits, 1 letter)
    # if len(pan_number) != 10 or not pan_number[:5].isalpha() or not pan_number[5:9].isdigit() or not pan_number[9].isalpha():
    #     return {"status": "failed", "message": "Invalid PAN format. PAN should be 10 characters (e.g., ABCDE1234F)"}
    
    # Use advanced API endpoint
    url = "https://sandbox.cashfree.com/verification/pan/advance"
    headers = {
        "x-client-id": "CF10840950D48MQSKJBPUC73ATLG8G",
        "x-client-secret": "cfsk_ma_test_3fdaa4ac6522d31e5d18c0965f31c679_40963f41",
        "Content-Type": "application/json"
    }
    
    # Generate unique verification ID
    verification_id = f"pan_verify_{uuid.uuid4().hex[:16]}"
    
    # Build payload with required parameters
    payload = {
        "pan": pan_number.upper(),
        "verification_id": verification_id
    }
    
    # Add optional name parameter if available
    if customer_type == "Individual / Farmer":
        # Combine first_name and last_name for Individual/Farmer
        name_parts = []
        if first_name:
            name_parts.append(first_name.strip())
        if last_name:
            name_parts.append(last_name.strip())
        if name_parts:
            payload["name"] = " ".join(name_parts).upper()
    else:
        # For Company/Trader, use only first_name
        if first_name:
            payload["name"] = first_name.strip().upper()
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        if response.status_code != 200:
            return {
                "status": "failed", 
                "message": "PAN Verification Failed",
            }
        
        data = response.json()
        
        # Check if PAN is valid (VALID status from advanced API)
        if data.get("status") == "VALID":
            registered_name = (data.get("registered_name") or "").strip().lower()
            name_provided = (data.get("name_provided") or "").strip().lower()
            
            # Parse registered name for Individual/Farmer
            parsed_names = {}
            if customer_type == "Individual / Farmer" and registered_name:
                name_parts = registered_name.split()
                if len(name_parts) >= 2:
                    parsed_names["first_name"] = name_parts[0].title()
                    parsed_names["last_name"] = name_parts[-1].title()
                    if len(name_parts) > 2:
                        parsed_names["middle_name"] = " ".join(name_parts[1:-1]).title()
                elif len(name_parts) == 1:
                    parsed_names["first_name"] = name_parts[0].title()
            
            # Extract address information
            address_data = {}
            if data.get("address"):
                addr = data.get("address")
                address_data = {
                    "address": (addr.get("full_address") or addr.get("street") or "").title(),
                    "city": (addr.get("city") or "").title(),
                    "state": (addr.get("state") or "").title(),
                    "zip": str(addr.get("pincode") or addr.get("zip") or "")
                }
            
            # If name was provided in the request, verify name match
            if "name" in payload and registered_name:
                entered_name = payload["name"].strip().lower()
                
                # Normalize spaces and check if names match
                registered_name_normalized = " ".join(registered_name.split())
                entered_name_normalized = " ".join(entered_name.split())
                
                # Check if names match (either exact or one contains the other)
                if (registered_name_normalized == entered_name_normalized or 
                    entered_name_normalized in registered_name_normalized or 
                    registered_name_normalized in entered_name_normalized):
                    # Name matches - successful verification
                    return {
                        "status": "success",
                        "message": _("PAN verified successfully"),
                        "pan_verified": 1,
                        "pan_verified_date": today(),
                        "verification_id": data.get("verification_id"),
                        "reference_id": data.get("reference_id"),
                        "registered_name": data.get("registered_name"),
                        "parsed_names": parsed_names,
                        "address_data": address_data,
                        "data": data
                    }
                else:
                    # Name doesn't match
                    return {
                        "status": "warning",
                        "message": _("PAN verification failed: Name mismatch"),
                        "pan_verified": 0,
                        "registered_name": data.get("registered_name"),
                        "name_provided": data.get("name_provided"),
                        "parsed_names": parsed_names,
                        "address_data": address_data
                    }
            
            # If no name provided, PAN is still valid
            return {
                "status": "success",
                "message": _("PAN verified successfully"),
                "pan_verified": 1,
                "pan_verified_date": today(),
                "verification_id": data.get("verification_id"),
                "reference_id": data.get("reference_id"),
                "registered_name": data.get("registered_name"),
                "parsed_names": parsed_names,
                "address_data": address_data,
                "data": data
            }
        elif data.get("status") == "INVALID":
            return {
                "status": "failed",
                "pan_verified": 0,
                "message": _("Invalid PAN or PAN not found"),
                "api_message": data.get("message")
            }
        else:
            return {
                "status": "failed",
                "pan_verified": 0,
                "message": data.get("message", "PAN verification failed")
            }
            
    except requests.exceptions.Timeout:
        return {"status": "failed", "pan_verified": 0, "message": "Request timeout. Please try again."}
    except requests.exceptions.RequestException as e:
        frappe.log_error(f"PAN verification error: {str(e)}", "PAN Verification")
        return {"status": "failed", "pan_verified": 0, "message": "Network error. Please try again."}
    except Exception as e:
        frappe.log_error(f"PAN verification error: {str(e)}", "PAN Verification")
        return {"status": "failed", "pan_verified": 0, "message": "Verification failed. Please try again."}

@frappe.whitelist()
def verify_gstin_api(gstin, first_name=None):
    """
    Verify GSTIN number using Cashfree API
    Returns verification status and auto-populates business name
    """
    if not gstin:
        frappe.msgprint(_("Please enter a GSTIN number"), alert=True)
        return {"status": "failed", "message": "GSTIN not provided"}
    
    # Validate GSTIN format (15 characters)
    if len(gstin) != 15:
        return {"status": "failed", "message": "Invalid GSTIN format. GSTIN should be 15 characters"}
    
    url = "https://sandbox.cashfree.com/verification/gstin"
    headers = {
        "x-client-id": "CF10840950D48MQSKJBPUC73ATLG8G",
        "x-client-secret": "cfsk_ma_test_3fdaa4ac6522d31e5d18c0965f31c679_40963f41",
        "Content-Type": "application/json"
    }
    payload = {"gstin": gstin}
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        if response.status_code != 200:
            return {
                "status": "failed", 
                "message": "GSTIN Verification Failed",
                "gstin_verified": 0
            }
        
        data = response.json()
        
        if data.get("valid") or data.get("legal_name_of_business"):
            legal_name = (data.get("legal_name_of_business") or "").strip()
            trade_name = (data.get("trade_name_of_business") or "").strip()
            
            # Use legal_name as primary, fallback to trade_name
            business_name = legal_name if legal_name else trade_name
            
            # Successful verification
            return {
                "status": "success",
                "message": _("GSTIN verified successfully"),
                "gstin_verified": 1,
                "gstin_verified_date": today(),
                "first_name": business_name,  # Auto-populate business name
                "legal_name": legal_name,
                "trade_name": trade_name,
                "data": data
            }
        else:
            return {
                "status": "failed", 
                "message": _("Invalid GSTIN or GSTIN not found"),
                "gstin_verified": 0,
                "gstin_verified_date": None
            }
            
    except requests.exceptions.Timeout:
        return {
            "status": "failed", 
            "message": "Request timeout. Please try again.",
            "gstin_verified": 0
        }
    except requests.exceptions.RequestException as e:
        frappe.log_error(f"GSTIN verification error: {str(e)}", "GSTIN Verification")
        return {
            "status": "failed", 
            "message": "Network error. Please try again.",
            "gstin_verified": 0
        }
    except Exception as e:
        frappe.log_error(f"GSTIN verification error: {str(e)}", "GSTIN Verification")
        return {
            "status": "failed", 
            "message": "Verification failed. Please try again.",
            "gstin_verified": 0
        }