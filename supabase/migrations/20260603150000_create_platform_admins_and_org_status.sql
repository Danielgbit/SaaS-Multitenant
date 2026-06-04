-- =====================================================
-- Create platform_admins table + organization_status
-- Fecha: 2026-06-03
-- Descripción: Crea la tabla de administradores de plataforma,
-- el ENUM organization_status, y columnas de estado en organizations.
-- =====================================================

-- =====================================================
-- 1. PLATFORM ADMINS
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform admins can view themselves"
  ON platform_admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. ORGANIZATION STATUS ENUM
-- =====================================================
CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'maintenance');

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS status organization_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at);

-- =====================================================
-- 3. ADMIN AUDIT LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES platform_admins(user_id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_logs(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_logs(action, created_at DESC);
