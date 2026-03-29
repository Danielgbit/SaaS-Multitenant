-- Migration: Make employee_id nullable and add deleted_employee_name to preserve history
-- This enables permanent deletion of employees while preserving appointment history

-- 1. Make appointments.employee_id nullable
ALTER TABLE appointments ALTER COLUMN employee_id DROP NOT NULL;

-- 2. Add deleted_employee_name column to preserve employee name in historical records
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deleted_employee_name VARCHAR;

-- 3. Add deleted_employee_name column to appointment_confirmations
ALTER TABLE appointment_confirmations ADD COLUMN IF NOT EXISTS deleted_employee_name VARCHAR;

-- 4. Drop existing FK constraint on appointments
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_employee_id_fkey;

-- 5. Add new FK with SET NULL (preserves appointments, just removes link)
ALTER TABLE appointments ADD CONSTRAINT appointments_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- 6. Drop existing FK constraint on appointment_confirmations
ALTER TABLE appointment_confirmations DROP CONSTRAINT IF EXISTS appointment_confirmations_employee_id_fkey;

-- 7. Add new FK with SET NULL
ALTER TABLE appointment_confirmations ADD CONSTRAINT appointment_confirmations_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- 8. Create indexes on employee_id for better cascade performance (best practice)
CREATE INDEX IF NOT EXISTS idx_appointments_employee_id ON appointments(employee_id);
CREATE INDEX IF NOT EXISTS idx_appointment_confirmations_employee_id ON appointment_confirmations(employee_id);
