# Copyright (c) 2025, Your Company and contributors
# For license information, please see license.txt
import frappe
import requests
from frappe import _
from frappe.utils import today
import uuid
import re

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

## ==================== AADHAAR VERIFICATION FUNCTIONS ====================

@frappe.whitelist()
def send_aadhaar_otp(aadhaar_number):
    """
    Send OTP to Aadhaar number
    Step 1: Generate OTP
    """
    if not aadhaar_number:
        return {
            "status": "failed",
            "message": _("Please enter Aadhaar number")
        }
    
    # Validate Aadhaar format (12 digits only)
    aadhaar_clean = re.sub(r'\s+', '', aadhaar_number)
    if not re.match(r'^\d{12}$', aadhaar_clean):
        return {
            "status": "failed",
            "message": _("Invalid Aadhaar format. Must be 12 digits")
        }
    
    url = "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp"
    
    headers = {
        "accept": "application/json",
        "authorization": "eyJ0eXAiOiJKV1MiLCJhbGciOiJSU0FTU0FfUFNTX1NIQV81MTIiLCJraWQiOiIwYzYwMGUzMS01MDAwLTRkYTItYjM3YS01ODdkYTA0ZTk4NTEifQ.eyJ3b3Jrc3BhY2VfaWQiOiI0ZmI3ODEwYi0yMzBlLTQzNjEtYTVhMC04NjFlNGI4YmI1MmEiLCJzdWIiOiJrZXlfdGVzdF82Yjg0NmNiZmQ1YzI0ZTFmYjRiNjgxZWM5Y2FjZTIxNyIsImFwaV9rZXkiOiJrZXlfdGVzdF82Yjg0NmNiZmQ1YzI0ZTFmYjRiNjgxZWM5Y2FjZTIxNyIsImF1ZCI6IkFQSSIsImludGVudCI6IkFDQ0VTU19UT0tFTiIsImlzcyI6InByb2QxLWFwaS5zYW5kYm94LmNvLmluIiwiaWF0IjoxNzYzMDI1OTI2LCJleHAiOjE3NjMxMTIzMjZ9.XMB-ucjZnOo4eigCuNUcmDkmj8LgEBgXU5m9cMbgm_hLGNfLaYGnt54gDZjFsuNwLMDbHXhjeqwmO_3iIudrD5vC9O9B6o4mRojSXMSL5g_-0ZSf5KVD8XBc4cp5ab5zm1P2XaZuSj0W_TmTl7dunEYSPV67o_xFxF3i7A-SInDP1tZChexAaxZ1b7AX85ApeJZUWjTfrKGmjLtjaIqzSxUebhVY3wR3r17OdqsiGpSLMur8gvBqGJjkd1G5SEXUZvcongnvvyOWOzst-Qj5hgkjItqUUCGrm973Rexl4vycfiwl_0vt2NpLy2lU-8oRZq_54mSJY9crnmyEWY37Sg",
        "x-api-key": "key_test_6b846cbfd5c24e1fb4b681ec9cace217",
        "x-api-version": "2.0",
        "content-type": "application/json"
    }
    
    payload = {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        "aadhaar_number": aadhaar_clean,
        "consent": "y",
        "reason": "For KYC"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return {
                "status": "failed",
                "message": _("Failed to send OTP. Please try again.")
            }
        
        data = response.json()
        
        if data.get("code") == 200 and data.get("data"):
            reference_id = data["data"].get("reference_id")
            
            if not reference_id:
                return {
                    "status": "failed",
                    "message": _("Failed to get reference ID")
                }
            
            return {
                "status": "success",
                "message": _("OTP sent successfully to registered mobile"),
                "reference_id": reference_id,
                "transaction_id": data.get("transaction_id")
            }
        else:
            return {
                "status": "failed",
                "message": data.get("data", {}).get("message", _("Failed to send OTP"))
            }
            
    except requests.exceptions.Timeout:
        return {
            "status": "failed",
            "message": _("Request timeout. Please try again.")
        }
    except requests.exceptions.RequestException as e:
        frappe.log_error(f"Aadhaar OTP error: {str(e)}", "Aadhaar OTP")
        return {
            "status": "failed",
            "message": _("Network error. Please try again.")
        }
    except Exception as e:
        frappe.log_error(f"Aadhaar OTP error: {str(e)}", "Aadhaar OTP")
        return {
            "status": "failed",
            "message": _("An error occurred. Please try again.")
        }


@frappe.whitelist()
def verify_aadhaar_otp(reference_id, otp):
    """
    Verify Aadhaar OTP
    Step 2: Verify OTP and get Aadhaar details
    """
    if not reference_id:
        return {
            "status": "failed",
            "message": _("Reference ID not found. Please send OTP first.")
        }
    
    if not otp:
        return {
            "status": "failed",
            "message": _("Please enter OTP")
        }
    
    # Validate OTP format (6 digits)
    otp_clean = re.sub(r'\s+', '', otp)
    if not re.match(r'^\d{6}$', otp_clean):
        return {
            "status": "failed",
            "message": _("Invalid OTP format. Must be 6 digits")
        }
    
    url = "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp/verify"
    
    headers = {
        "accept": "application/json",
        "authorization": "eyJ0eXAiOiJKV1MiLCJhbGciOiJSU0FTU0FfUFNTX1NIQV81MTIiLCJraWQiOiIwYzYwMGUzMS01MDAwLTRkYTItYjM3YS01ODdkYTA0ZTk4NTEifQ.eyJ3b3Jrc3BhY2VfaWQiOiI0ZmI3ODEwYi0yMzBlLTQzNjEtYTVhMC04NjFlNGI4YmI1MmEiLCJzdWIiOiJrZXlfdGVzdF82Yjg0NmNiZmQ1YzI0ZTFmYjRiNjgxZWM5Y2FjZTIxNyIsImFwaV9rZXkiOiJrZXlfdGVzdF82Yjg0NmNiZmQ1YzI0ZTFmYjRiNjgxZWM5Y2FjZTIxNyIsImF1ZCI6IkFQSSIsImludGVudCI6IkFDQ0VTU19UT0tFTiIsImlzcyI6InByb2QxLWFwaS5zYW5kYm94LmNvLmluIiwiaWF0IjoxNzYzMDI1OTI2LCJleHAiOjE3NjMxMTIzMjZ9.XMB-ucjZnOo4eigCuNUcmDkmj8LgEBgXU5m9cMbgm_hLGNfLaYGnt54gDZjFsuNwLMDbHXhjeqwmO_3iIudrD5vC9O9B6o4mRojSXMSL5g_-0ZSf5KVD8XBc4cp5ab5zm1P2XaZuSj0W_TmTl7dunEYSPV67o_xFxF3i7A-SInDP1tZChexAaxZ1b7AX85ApeJZUWjTfrKGmjLtjaIqzSxUebhVY3wR3r17OdqsiGpSLMur8gvBqGJjkd1G5SEXUZvcongnvvyOWOzst-Qj5hgkjItqUUCGrm973Rexl4vycfiwl_0vt2NpLy2lU-8oRZq_54mSJY9crnmyEWY37Sg",
        "x-api-key": "key_test_6b846cbfd5c24e1fb4b681ec9cace217",
        "x-api-version": "2.0",
        "content-type": "application/json"
    }
    
    payload = {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        "reference_id": str(reference_id),  # Ensure it's a string
        "otp": otp_clean
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        # Log complete request and response for debugging
        frappe.log_error(
            f"Aadhaar Verification Debug:\n"
            f"URL: {url}\n"
            f"Reference ID: {reference_id}\n"
            f"OTP: {otp_clean}\n"
            f"Status Code: {response.status_code}\n"
            f"Response: {response.text}",
            "Aadhaar Verification Debug"
        )
        
        # Parse response
        try:
            data = response.json()
        except ValueError as e:
            frappe.log_error(f"JSON Parse Error: {str(e)}\nRaw Response: {response.text}", "Aadhaar JSON Parse Error")
            return {
                "status": "failed",
                "message": _("Invalid response from verification service")
            }
        
        # SUCCESS CASE: Check for code 200 and data.status VALID
        # Based on API docs, successful response structure is:
        # { "code": 200, "data": { "status": "VALID", ... } }
        if data.get("code") == 200 and data.get("data"):
            aadhaar_data = data.get("data", {})
            
            # Check if status is VALID inside data object
            if aadhaar_data.get("status") == "VALID":
                # Parse name from Aadhaar response
                full_name = aadhaar_data.get("name", "")
                parsed_names = parse_full_name(full_name)
                
                # Parse address from Aadhaar response
                address_obj = aadhaar_data.get("address", {})
                address_data = {
                    "address": aadhaar_data.get("full_address", ""),
                    "city": address_obj.get("district", "") if isinstance(address_obj, dict) else "",
                    "state": address_obj.get("state", "") if isinstance(address_obj, dict) else "",
                    "zip": str(address_obj.get("pincode", "")) if isinstance(address_obj, dict) else ""
                }
                
                return {
                    "status": "success",
                    "message": _("Aadhaar verified successfully"),
                    "aadhar_verified": 1,
                    "aadhar_verified_date": today(),
                    "parsed_names": parsed_names,
                    "address_data": address_data,
                    "gender": aadhaar_data.get("gender", ""),
                    "date_of_birth": aadhaar_data.get("date_of_birth", ""),
                    "photo": aadhaar_data.get("photo", ""),
                    "full_data": aadhaar_data
                }
            else:
                # Data exists but status is not VALID
                return {
                    "status": "failed",
                    "message": aadhaar_data.get("message", _("Aadhaar verification failed"))
                }
        
        # ERROR CASE 1: Invalid OTP (code 422)
        elif data.get("code") == 422:
            error_msg = data.get("message", _("Invalid OTP. Please try again."))
            if data.get("data") and isinstance(data.get("data"), dict):
                error_msg = data["data"].get("message", error_msg)
            return {
                "status": "failed",
                "message": error_msg
            }
        
        # ERROR CASE 2: OTP Expired (code 410)
        elif data.get("code") == 410:
            return {
                "status": "failed",
                "message": _("OTP has expired. Please request a new OTP.")
            }
        
        # ERROR CASE 3: Other errors
        else:
            error_message = data.get("message", _("Verification failed"))
            if data.get("data") and isinstance(data.get("data"), dict):
                error_message = data["data"].get("message", error_message)
            
            return {
                "status": "failed",
                "message": error_message
            }
            
    except requests.exceptions.Timeout:
        return {
            "status": "failed",
            "message": _("Request timeout. Please try again.")
        }
    except requests.exceptions.RequestException as e:
        frappe.log_error(f"Aadhaar verification network error: {str(e)}", "Aadhaar Verification Error")
        return {
            "status": "failed",
            "message": _("Network error. Please try again.")
        }
    except Exception as e:
        frappe.log_error(f"Aadhaar verification unexpected error: {str(e)}", "Aadhaar Verification Error")
        return {
            "status": "failed",
            "message": _("An error occurred. Please try again.")
        }


def parse_full_name(full_name):
    """
    Parse full name into first, middle, and last name
    Example: "Vineet Rajanikant Jadhav" -> first: Vineet, middle: Rajanikant, last: Jadhav
    """
    if not full_name:
        return {}
    
    name_parts = full_name.strip().split()
    
    parsed = {}
    if len(name_parts) >= 3:
        parsed["first_name"] = name_parts[0].title()
        parsed["middle_name"] = " ".join(name_parts[1:-1]).title()
        parsed["last_name"] = name_parts[-1].title()
    elif len(name_parts) == 2:
        parsed["first_name"] = name_parts[0].title()
        parsed["last_name"] = name_parts[1].title()
    elif len(name_parts) == 1:
        parsed["first_name"] = name_parts[0].title()
    
    return parsed