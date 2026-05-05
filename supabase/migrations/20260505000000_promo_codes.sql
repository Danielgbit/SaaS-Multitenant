-- =====================================================
-- Migration: promo_codes for promotional code system
-- Created: 2026-05-05
-- =====================================================

-- =====================================================
-- Table: promo_codes
-- =====================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  type VARCHAR(20) NOT NULL CHECK (type IN ('trial_extension', 'grace_period', 'free_month', 'discount')),
  value INTEGER NOT NULL,
  max_uses INTEGER, -- NULL = unlimited
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ, -- when the code expires
  valid_until TIMESTAMPTZ, -- when the code can be used until
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- Table: promo_code_uses
-- =====================================================
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promo_code_id, organization_id)
);

-- =====================================================
-- Indexes (Supabase Postgres Best Practices)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_promo_codes_expires ON promo_codes(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_org ON promo_code_uses(organization_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_code ON promo_code_uses(promo_code_id);

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Admin (owner_saas) can do everything
CREATE POLICY "Admin full access promo_codes" ON promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'owner_saas'
    )
  );

-- Authenticated users can read active promo codes
CREATE POLICY "Read active promo_codes" ON promo_codes
  FOR SELECT USING (
    is_active = true
    AND (valid_until IS NULL OR valid_until > now())
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Promo code uses - admin sees all
CREATE POLICY "Admin read promo_code_uses" ON promo_code_uses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND role = 'owner_saas'
    )
  );

-- Users can read their own promo code uses
CREATE POLICY "Users read own promo_code_uses" ON promo_code_uses
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Users can insert promo code uses (their own org)
CREATE POLICY "Insert promo_code_uses" ON promo_code_uses
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));