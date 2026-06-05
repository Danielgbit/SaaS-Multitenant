-- ============================================================
-- Sprint 3 — Inventory reconciliation (detection only)
-- ============================================================

CREATE OR REPLACE VIEW inventory_reconciliation_view AS
SELECT
  i.id,
  i.name,
  i.organization_id,
  i.quantity AS current_stock,
  m.quantity_after AS ledger_stock,
  i.quantity - COALESCE(m.quantity_after, 0) AS delta,
  m.id AS last_movement_id,
  m.created_at AS last_movement_created_at
FROM inventory_items i
LEFT JOIN LATERAL (
  SELECT quantity_after, id, created_at
  FROM inventory_movements
  WHERE inventory_item_id = i.id
  ORDER BY created_at DESC, id DESC
  LIMIT 1
) m ON TRUE
WHERE i.active = true;

CREATE OR REPLACE FUNCTION get_inventory_divergences()
RETURNS TABLE (
  id UUID,
  name TEXT,
  organization_id UUID,
  current_stock INT,
  ledger_stock INT,
  delta INT,
  last_movement_id UUID,
  last_movement_created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id, i.name, i.organization_id,
    i.quantity, m.quantity_after,
    i.quantity - m.quantity_after,
    m.id, m.created_at
  FROM inventory_items i
  INNER JOIN LATERAL (
    SELECT quantity_after, id, created_at
    FROM inventory_movements
    WHERE inventory_item_id = i.id
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  ) m ON TRUE
  WHERE i.active = true
    AND i.quantity IS DISTINCT FROM m.quantity_after;
$$;

CREATE TABLE inventory_divergences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  current_stock INT NOT NULL,
  ledger_stock INT NOT NULL,
  delta INT NOT NULL,

  last_movement_id UUID,
  last_movement_created_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'ignored')),

  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  resolved_current_stock INT,
  resolved_ledger_stock INT,

  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_open_divergence_per_item
  ON inventory_divergences (inventory_item_id)
  WHERE status = 'open';

CREATE INDEX idx_inv_div_org   ON inventory_divergences(organization_id, status);
CREATE INDEX idx_inv_div_item  ON inventory_divergences(inventory_item_id);
