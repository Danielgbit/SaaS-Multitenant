-- ============================================================
-- Sprint 2 — Fix F1: inventory_set_stock data quality issue
--
-- DATA QUALITY ISSUE:
-- The previous implementation captured v_before incorrectly.
-- RETURNING quantity returned the NEW value (after UPDATE),
-- so v_before and v_after were identical (both = p_quantity),
-- causing all adjustment movements to register delta = 0.
--
-- FIX: Use CTE with FOR UPDATE to capture the original
-- quantity before the UPDATE, ensuring accurate audit trail.
-- ============================================================

-- ──────────────────────────────────────────────
-- inventory_set_stock (FIXED)
-- For manual adjustments. Sets absolute quantity.
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION inventory_set_stock(
  p_item_id UUID,
  p_quantity INT,
  p_organization_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  error TEXT,
  quantity_before INT,
  quantity_after INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INT;
  v_before INT;
  v_after INT;
BEGIN
  IF p_item_id IS NULL OR p_organization_id IS NULL THEN
    RETURN QUERY SELECT false, 'invalid_params'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id
      AND user_id = auth.uid()
  ) THEN
    RETURN QUERY SELECT false, 'unauthorized'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  IF p_quantity < 0 THEN
    RETURN QUERY SELECT false, 'negative_stock_not_allowed'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- CTE with FOR UPDATE locks the row and captures quantity BEFORE UPDATE
  WITH old_stock AS (
    SELECT quantity
    FROM inventory_items
    WHERE id = p_item_id
      AND organization_id = p_organization_id
    FOR UPDATE
  )
  UPDATE inventory_items
  SET quantity = p_quantity,
      updated_at = NOW()
  FROM old_stock
  WHERE id = p_item_id
    AND organization_id = p_organization_id
  RETURNING old_stock.quantity, quantity
  INTO v_before, v_after;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RETURN QUERY
    SELECT false,
      CASE WHEN NOT EXISTS (SELECT 1 FROM inventory_items WHERE id = p_item_id)
        THEN 'not_found'::TEXT
        ELSE 'organization_mismatch'::TEXT
      END,
      NULL::INT,
      NULL::INT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, NULL::TEXT, v_before, v_after;
END;
$$;
