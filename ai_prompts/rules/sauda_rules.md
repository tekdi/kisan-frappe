# Sauda DocType Scripts

Write both Client and Server Scripts for the `Sauda` DocType in the custom app `kisan_warehouse`.

## Objective
Perform automatic calculations and real-time field updates for booking agreements.

## Fields Involved
- **Input Fields:** expected_quantity, rate_per_ton, booking_date, delivery_duration, payment_duration
- **Calculated Fields:** total_amount, delivery_end_date, payment_end_date, pending_quantity, pending_total_amount

## Calculations to Implement
1. total_amount = expected_quantity × rate_per_ton
2. delivery_end_date = booking_date + delivery_duration (days)
3. payment_end_date = booking_date + payment_duration (days)
4. Default pending values:
   - pending_quantity = expected_quantity
   - pending_total_amount = total_amount

## Requirements
- Server-side: Validate and calculate on save
- Client-side: Real-time updates when input fields change
- Validate positive values for quantity, rate, and durations
- Only calculate when required input fields have values

## Reference
Use project context from ai_prompts/kisan_warehouse_project_overview.md
