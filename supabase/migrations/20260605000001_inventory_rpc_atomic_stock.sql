-- ============================================================
-- Sprint 1 — Atomic stock operations
-- Replaces read-then-write pattern with atomic UPDATE ... RETURNING
-- SECURITY DEFINER + auth.uid() org membership check
-- ============================================================

-- ──────────────────────────────────────────────
-- inventory_decrement_stock
-- Guarantees: quantity never goes negative.
-- PostgreSQL serializes writes per row, so two
-- concurrent calls cannot both read stale quantity.
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION inventory_decrement_stock(
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
  -- Guard: non-null params
  IF p_item_id IS NULL OR p_organization_id IS NULL THEN
    RETURN QUERY SELECT false, 'invalid_params'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Guard: caller must belong to org
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id
      AND user_id = auth.uid()
  ) THEN
    RETURN QUERY SELECT false, 'unauthorized'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Guard: quantity must be positive
  IF p_quantity <= 0 THEN
    RETURN QUERY SELECT false, 'invalid_quantity'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Atomic decrement: single UPDATE with WHERE guard.
  -- If quantity < p_quantity, no rows match → ROW_COUNT = 0.
  UPDATE inventory_items
  SET quantity = quantity - p_quantity,
      updated_at = NOW()
  WHERE id = p_item_id
    AND organization_id = p_organization_id
    AND quantity >= p_quantity
  RETURNING quantity + p_quantity, quantity
  INTO v_before, v_after;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RETURN QUERY
    SELECT false,
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM inventory_items WHERE id = p_item_id)
          THEN 'not_found'::TEXT
        WHEN EXISTS (
          SELECT 1 FROM inventory_items
          WHERE id = p_item_id
            AND organization_id = p_organization_id
            AND quantity < p_quantity
        ) THEN 'insufficient_stock'::TEXT
        ELSE 'organization_mismatch'::TEXT
      END,
      NULL::INT,
      NULL::INT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, NULL::TEXT, v_before, v_after;
END;
$$;

-- ──────────────────────────────────────────────
-- inventory_increment_stock
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION inventory_increment_stock(
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

  IF p_quantity <= 0 THEN
    RETURN QUERY SELECT false, 'invalid_quantity'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  UPDATE inventory_items
  SET quantity = quantity + p_quantity,
      updated_at = NOW()
  WHERE id = p_item_id
    AND organization_id = p_organization_id
  RETURNING quantity - p_quantity, quantity
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

-- ──────────────────────────────────────────────
-- inventory_set_stock
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

  UPDATE inventory_items
  SET quantity = p_quantity,
      updated_at = NOW()
  WHERE id = p_item_id
    AND organization_id = p_organization_id
  RETURNING quantity, p_quantity
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
