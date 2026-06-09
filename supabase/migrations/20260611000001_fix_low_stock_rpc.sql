-- ============================================================
-- Fix: low stock filter now uses an explicit RPC instead of
--      Supabase's .filter() which cannot compare column-to-column.
--
-- Regla de negocio:
-- Los productos con min_quantity = 0 se consideran sin umbral
-- de alerta y NO participan en low stock por defecto.
-- Se puede incluir pasando p_include_zero_min = true.
--
-- Uso desde getInventoryItems:
--   supabase.rpc('get_low_stock_items', {
--     p_organization_id: orgId,
--     p_include_zero_min: false,
--   })
-- ============================================================

CREATE OR REPLACE FUNCTION get_low_stock_items(
  p_organization_id UUID,
  p_include_zero_min BOOLEAN DEFAULT false
)
RETURNS SETOF inventory_items
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM inventory_items
  WHERE organization_id = p_organization_id
    AND active = true
    AND quantity <= min_quantity
    AND (p_include_zero_min OR min_quantity > 0)
  ORDER BY
    CASE
      WHEN min_quantity <= 0 THEN NULL
      ELSE quantity::float / min_quantity::float
    END ASC NULLS LAST;
$$;

-- Revoke public access, grant only to authenticated
REVOKE ALL ON FUNCTION get_low_stock_items(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_low_stock_items(UUID, BOOLEAN) TO authenticated;
