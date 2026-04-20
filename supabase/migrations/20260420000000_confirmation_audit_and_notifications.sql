-- =========================================================================================
-- CONFIRMATION AUDIT & NOTIFICATIONS: Sistema de auditoría y notificaciones
-- =========================================================================================
-- Agrega: confirmation_logs (auditoría), notifications (real-time), columnas en appointments
-- Fecha: 20 Abril 2026

-- =========================================================================================
-- 1. CONFIRMATION_LOGS — Auditoría completa de cada acción
-- =========================================================================================

CREATE TABLE IF NOT EXISTS confirmation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  action VARCHAR(20) NOT NULL CHECK (action IN (
    'created',      -- Empleado marcó "Listo"
    'confirmed',    -- Asistente confirmó + cobró
    'adjusted',     -- Asistente ajustó precio
    'manually_set', -- Asistente marcó manualmente
    'cancelled'     -- Cancelado
  )),
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_role VARCHAR(20) NOT NULL CHECK (performed_by_role IN (
    'employee', 'assistant', 'system'
  )),
  
  price_before NUMERIC(10,0),  -- NULL si no cambió (COP sin decimales)
  price_after NUMERIC(10,0),   -- Precio final cobrado
  payment_method VARCHAR(20),   -- NULL hasta confirmación
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para los patrones de query más frecuentes
CREATE INDEX IF NOT EXISTS idx_confirmation_logs_appointment_id ON confirmation_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_confirmation_logs_org_created ON confirmation_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confirmation_logs_performed_by ON confirmation_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_confirmation_logs_action ON confirmation_logs(action);

-- =========================================================================================
-- 2. NOTIFICATIONS — Notificaciones in-app real-time
-- =========================================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'reminder',           -- 5 min antes del servicio
    'service_ready',      -- Empleado marcó "Listo"
    'unmarked_alert',     -- Cita sin marcar 60 min+
    'auto_completed',     -- Sistema marcó automáticamente
    'confirmation_sent'   -- Cliente recibió confirmación
  )),
  title VARCHAR(100) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices: queries frecuentes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read, created_at DESC) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- =========================================================================================
-- 3. APPOINTMENTS — Nuevas columnas para confirmation_status
-- =========================================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'confirmation_status'
  ) THEN
    ALTER TABLE appointments 
    ADD COLUMN confirmation_status VARCHAR(20) DEFAULT 'scheduled' 
    CHECK (confirmation_status IN ('scheduled', 'completed', 'confirmed', 'needs_review'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'completed_by'
  ) THEN
    ALTER TABLE appointments ADD COLUMN completed_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN confirmed_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'confirmed_by'
  ) THEN
    ALTER TABLE appointments ADD COLUMN confirmed_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'price_adjustment'
  ) THEN
    ALTER TABLE appointments ADD COLUMN price_adjustment NUMERIC(10,0) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE appointments ADD COLUMN payment_method VARCHAR(20);
  END IF;
END $$;

-- =========================================================================================
-- 4. RLS POLICIES — Optimizadas (auth.uid() envuelto en SELECT)
-- =========================================================================================

-- confirmation_logs: acceso por organización
ALTER TABLE confirmation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "confirmation_logs_org_access" ON confirmation_logs;
CREATE POLICY "confirmation_logs_org_access" ON confirmation_logs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = (select auth.uid())
    )
  );

-- notifications: acceso por usuario + broadcast por org
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_user_access" ON notifications;
CREATE POLICY "notifications_user_access" ON notifications
  FOR ALL USING (
    user_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "notifications_org_broadcast" ON notifications;
CREATE POLICY "notifications_org_broadcast" ON notifications
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = (select auth.uid())
    )
  );

-- =========================================================================================
-- 5. ACTUALIZAR appointment_confirmations — Agregar columnas de auditoría
-- =========================================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointment_confirmations' AND column_name = 'confirmation_status'
  ) THEN
    ALTER TABLE appointment_confirmations 
    ADD COLUMN confirmation_status VARCHAR(20) DEFAULT 'pending_employee' 
    CHECK (confirmation_status IN ('pending_employee', 'pending_reception', 'completed', 'no_show', 'not_performed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointment_confirmations' AND column_name = 'adjusted_price'
  ) THEN
    ALTER TABLE appointment_confirmations ADD COLUMN adjusted_price NUMERIC(10,2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointment_confirmations' AND column_name = 'reception_notes'
  ) THEN
    ALTER TABLE appointment_confirmations ADD COLUMN reception_notes TEXT;
  END IF;
END $$;

-- Agregar índice compuesto para queries de pendientes por org
CREATE INDEX IF NOT EXISTS idx_appointment_confirmations_org_status 
  ON appointment_confirmations(organization_id, confirmation_status) 
  WHERE confirmation_status IN ('pending_employee', 'pending_reception');

-- =========================================================================================
-- 6. METADATA INDEX para notifications (metadata JSONB)
-- =========================================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_confirmation_logs_metadata ON confirmation_logs USING GIN (metadata);
