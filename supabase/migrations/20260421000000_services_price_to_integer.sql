-- ========================================================
-- Migration: convert_services_price_to_integer
-- Date: 2026-04-21
-- Description: Convert services.price and employee_services.price_override
--              from NUMERIC(10,2) decimal to NUMERIC(10,0) integer
--              Values are multiplied by 1000 to preserve COP semantics
--              (e.g., $20.000 COP stored as 20000, not 20.00)
-- ========================================================

-- 1. Convert services.price: 20.00 -> 20000
ALTER TABLE services 
ALTER COLUMN price TYPE NUMERIC(10,0) 
USING (price * 1000)::numeric;

-- 2. Convert employee_services.price_override: 20.00 -> 20000
ALTER TABLE employee_services 
ALTER COLUMN price_override TYPE NUMERIC(10,0) 
USING (price_override * 1000)::numeric;

-- 3. Verification (uncomment to check)
-- SELECT id, name, price, price::text FROM services;
-- SELECT id, employee_id, service_id, price_override, price_override::text FROM employee_services;