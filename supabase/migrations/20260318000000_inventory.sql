-- =========================================================================================
-- INVENTORY MODULE: Product inventory management
-- =========================================================================================

-- Agregar límite de inventario a planes existentes
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_inventory_items INT NOT NULL DEFAULT 200;

-- Actualizar planes existentes
UPDATE plans SET max_inventory_items = 200 WHERE name ILIKE '%básico%' OR name ILIKE '%basic%';
UPDATE plans SET max_inventory_items = 5000 WHERE name ILIKE '%profesional%' OR name ILIKE '%professional%';

-- Tabla inventario
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  sku VARCHAR,
  description TEXT,
  category VARCHAR,
  quantity INT NOT NULL DEFAULT 0,
  min_quantity INT DEFAULT 5,
  price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  unit VARCHAR DEFAULT 'pieza',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_inventory_org_id ON inventory_items(organization_id);
CREATE INDEX idx_inventory_category ON inventory_items(organization_id, category);
CREATE INDEX idx_inventory_low_stock ON inventory_items(organization_id, quantity) 
  WHERE quantity <= min_quantity AND active = true;

-- RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_access" ON inventory_items
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));
