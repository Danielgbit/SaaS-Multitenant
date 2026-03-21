-- =========================================================================================
-- REBRAND PLANS TO COP - March 2026
-- Updates: 2 plans (Basic/Premium), COP currency, new limits
-- =========================================================================================

-- =========================================================================================
-- 1. ADD CURRENCY COLUMN IF NOT EXISTS
-- =========================================================================================
ALTER TABLE plans ADD COLUMN IF NOT EXISTS currency VARCHAR DEFAULT 'cop';

-- =========================================================================================
-- 2. UPDATE BASIC PLAN
-- =========================================================================================
UPDATE plans SET 
  price = 39900,
  currency = 'cop',
  max_employees = 8,
  max_services = 30,
  max_inventory_items = 200,
  whatsapp_enabled = true,
  stripe_price_id = 'price_basic_monthly_cop',
  description = 'Ideal para profesionales independientes',
  features = '["8 empleados", "30 servicios", "200 productos inventario", "WhatsApp Premium", "Analytics completo", "Email confirmaciones", "Calendario inteligente"]'
WHERE name = 'Básico';

-- =========================================================================================
-- 3. UPDATE PREMIUM PLAN (formerly Profesional)
-- =========================================================================================
UPDATE plans SET 
  price = 79900,
  currency = 'cop',
  max_employees = -1,
  max_services = -1,
  max_inventory_items = 2000,
  whatsapp_enabled = true,
  stripe_price_id = 'price_premium_monthly_cop',
  description = 'Para negocios en crecimiento',
  features = '["Empleados ilimitados", "Servicios ilimitados", "2000 productos inventario", "WhatsApp Premium", "Analytics completo", "Soporte prioritario"]'
WHERE name = 'Profesional';

-- =========================================================================================
-- 4. DELETE ENTERPRISE PLAN (if exists)
-- =========================================================================================
DELETE FROM plans WHERE name = 'Enterprise';

-- =========================================================================================
-- 5. VERIFY CHANGES
-- =========================================================================================
-- SELECT * FROM plans ORDER BY price;
