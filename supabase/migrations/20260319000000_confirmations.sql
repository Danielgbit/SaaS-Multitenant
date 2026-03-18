-- =========================================================================================
-- CONFIRMATIONS: Sistema de confirmación de servicios
-- =========================================================================================

-- Tabla de confirmaciones
CREATE TABLE IF NOT EXISTS appointment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  
  services JSONB DEFAULT '[]',
  total_amount NUMERIC(10,2) DEFAULT 0,
  
  confirmation_type VARCHAR DEFAULT 'scheduled',
  
  status VARCHAR DEFAULT 'pending_employee',
  
  employee_confirmed_at TIMESTAMPTZ,
  reception_confirmed_at TIMESTAMPTZ,
  
  payment_method VARCHAR,
  client_name VARCHAR,
  client_phone VARCHAR,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_confirmations_status ON appointment_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_confirmations_org ON appointment_confirmations(organization_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_employee ON appointment_confirmations(employee_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_type ON appointment_confirmations(confirmation_type);
CREATE INDEX IF NOT EXISTS idx_confirmations_appointment ON appointment_confirmations(appointment_id) WHERE appointment_id IS NOT NULL;

-- RLS
ALTER TABLE appointment_confirmations ENABLE ROW LEVEL SECURITY;

-- Política de acceso
CREATE POLICY "confirmations_access" ON appointment_confirmations
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));
