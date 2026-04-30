-- Data Retention Settings
-- Adds auto-purge configuration and invoice_id protection for appointments

-- Add retention settings to booking_settings
ALTER TABLE booking_settings
  ADD COLUMN IF NOT EXISTS auto_retention_days INTEGER DEFAULT 90,
  ADD COLUMN IF NOT EXISTS auto_purge_enabled BOOLEAN DEFAULT false;

-- Add invoice_id to appointments for billing integration
-- This protects appointments that have been invoiced from automatic purge
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Create index for efficient purge queries
CREATE INDEX IF NOT EXISTS idx_appointments_purge_candidate
  ON appointments(organization_id, status, end_time)
  WHERE invoice_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN booking_settings.auto_retention_days IS 'Number of days to retain completed/cancelled/no_show appointments before auto-purge';
COMMENT ON COLUMN booking_settings.auto_purge_enabled IS 'Whether automatic purge of old appointments is enabled';
COMMENT ON COLUMN appointments.invoice_id IS 'Reference to invoice if this appointment has been billed - protected from auto-purge';
