-- ============================================================
-- Sprint 3 — Reconciliation query (manual)
-- Detecta divergencias entre inventory_items.quantity y
-- el último inventory_movements.quantity_after
--
-- Uso: copiar y ejecutar en SQL Editor de Supabase
-- ============================================================

SELECT
  i.id,
  i.name,
  i.organization_id,
  i.quantity AS current_stock,
  m.quantity_after AS ledger_stock,
  i.quantity - COALESCE(m.quantity_after, 0) AS delta,
  CASE
    WHEN m.quantity_after IS NULL THEN 'no_movements'
    WHEN i.quantity IS DISTINCT FROM m.quantity_after THEN 'diverged'
    ELSE 'ok'
  END AS status,
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
WHERE i.active = true
  AND (i.quantity IS DISTINCT FROM m.quantity_after OR m.quantity_after IS NULL)
ORDER BY ABS(i.quantity - COALESCE(m.quantity_after, 0)) DESC, i.name;
