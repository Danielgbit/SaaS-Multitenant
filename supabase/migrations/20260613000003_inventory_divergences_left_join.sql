-- ============================================================
-- Sprint 4 — Fix get_inventory_divergences to use LEFT JOIN LATERAL
-- ============================================================

CREATE OR REPLACE FUNCTION get_inventory_divergences()
RETURNS TABLE (
  id UUID,
  inventory_item_id UUID,
  name TEXT,
  organization_id UUID,
  current_stock BIGINT,
  ledger_stock BIGINT,
  delta BIGINT,
  last_movement_id UUID,
  last_movement_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.id AS inventory_item_id,
    i.name,
    i.organization_id,
    i.quantity AS current_stock,
    COALESCE(m.quantity_after, 0) AS ledger_stock,
    i.quantity - COALESCE(m.quantity_after, 0) AS delta,
    m.id AS last_movement_id,
    m.created_at AS last_movement_created_at
  FROM inventory_items i
  LEFT JOIN LATERAL (
    SELECT
      im.quantity_after,
      im.id,
      im.created_at
    FROM inventory_movements im
    WHERE im.inventory_item_id = i.id
    ORDER BY im.created_at DESC
    LIMIT 1
  ) m ON TRUE
  WHERE i.active = true
    AND (
      i.quantity != COALESCE(m.quantity_after, 0)
      OR m.quantity_after IS NULL
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_inventory_divergences TO authenticated;