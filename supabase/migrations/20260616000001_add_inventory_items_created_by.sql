-- =====================================================================
-- Sprint 4 — Add created_by column to inventory_items
-- =====================================================================
-- Esta columna ya es referenciada por inventory_create_item_with_limit_check
-- pero no fue incluida en la definición original de la tabla.
-- =====================================================================

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_inventory_items_created_by
ON inventory_items(created_by);
