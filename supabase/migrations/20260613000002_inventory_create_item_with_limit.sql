-- ============================================================
-- Sprint 4 — Atomic inventory item creation with limit check
-- ============================================================

CREATE OR REPLACE FUNCTION inventory_create_item_with_limit_check(
  p_organization_id UUID,
  p_name TEXT,
  p_sku TEXT,
  p_description TEXT,
  p_category TEXT,
  p_quantity INTEGER,
  p_min_quantity INTEGER,
  p_price NUMERIC,
  p_cost_price NUMERIC,
  p_unit TEXT,
  p_created_by UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit INTEGER;
  v_current_count INTEGER;
  v_result JSONB;
BEGIN
  SELECT COALESCE(plans.max_inventory_items, 200)
  INTO v_limit
  FROM subscriptions
  JOIN plans ON plans.id = subscriptions.plan_id
  WHERE subscriptions.organization_id = p_organization_id;

  IF v_limit IS NULL THEN
    v_limit := 200;
  END IF;

  SELECT COUNT(*)
  INTO v_current_count
  FROM inventory_items
  WHERE organization_id = p_organization_id AND active = true;

  IF v_current_count >= v_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'limit_exceeded',
      'message', 'Límite alcanzado. Máximo ' || v_limit || ' productos en tu plan.'
    );
  END IF;

  INSERT INTO inventory_items (
    organization_id,
    name,
    sku,
    description,
    category,
    quantity,
    min_quantity,
    price,
    cost_price,
    unit,
    active,
    created_by
  ) VALUES (
    p_organization_id,
    p_name,
    p_sku,
    p_description,
    p_category,
    p_quantity,
    p_min_quantity,
    p_price,
    p_cost_price,
    p_unit,
    true,
    p_created_by
  )
  RETURNING jsonb_build_object(
    'success', true,
    'id', id
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION inventory_create_item_with_limit_check TO authenticated;