-- =====================================================================
-- FIX-006: Rollback transaccional en recordInventoryPurchase / consumeInventory
-- =====================================================================
-- Encapsula UPDATE inventory_items + INSERT inventory_movements +
-- INSERT operation_entries dentro de una función SECURITY DEFINER
-- con manejo de EXCEPTION que garantiza atomicidad.
--
-- Cambios clave:
--   SCOPE-1: auth.uid() check aplicado a AMBOS RPCs
--   SCOPE-2: SQLSTATE mapping aplicado a AMBOS RPCs
--   P3-1:    payment_method whitelist en inventory_record_purchase
--   P1-2:    Server Action select reducido (en código TS, no SQL)
-- =====================================================================

-- ---------------------------------------------------------------------
-- inventory_record_purchase
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION inventory_record_purchase(
  p_item_id         UUID,
  p_quantity        INT,
  p_organization_id UUID,
  p_created_by      UUID,
  p_unit_cost       NUMERIC,
  p_total_cost      NUMERIC,
  p_payment_status  TEXT,
  p_cash_session_id UUID DEFAULT NULL,
  p_notes           TEXT DEFAULT NULL,
  p_payment_method  TEXT DEFAULT NULL
)
RETURNS TABLE (
  success         BOOLEAN,
  error           TEXT,
  quantity_before INT,
  quantity_after  INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows          INT;
  v_before        INT;
  v_after         INT;
  v_item_name     TEXT;
BEGIN
  -- Guard: non-null required params
  IF p_item_id IS NULL OR p_quantity IS NULL OR p_organization_id IS NULL
     OR p_created_by IS NULL OR p_unit_cost IS NULL OR p_total_cost IS NULL
     OR p_payment_status IS NULL
  THEN
    RETURN QUERY SELECT false, 'invalid_params'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Guard: authenticated user
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false, 'unauthorized'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Guard: org membership check (JWT-verified)
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id
      AND user_id = auth.uid()
  ) THEN
    RETURN QUERY SELECT false, 'unauthorized'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Guard: identity check (prevent caller-controlled created_by impersonation)
  IF auth.uid() IS DISTINCT FROM p_created_by THEN
    RETURN QUERY SELECT false, 'identity_mismatch'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Guard: positive values
  IF p_quantity <= 0 OR p_unit_cost <= 0 THEN
    RETURN QUERY SELECT false, 'invalid_quantity'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Guard: payment_method whitelist
  IF p_payment_method IS NOT NULL
     AND p_payment_method NOT IN ('cash','qr','transfer','card')
  THEN
    RETURN QUERY SELECT false, 'invalid_payment_method'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Fetch item name for entry title
  SELECT name INTO v_item_name
  FROM inventory_items
  WHERE id = p_item_id AND organization_id = p_organization_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'item_not_found'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Atomic stock UPDATE + movement INSERT + entry INSERT
  BEGIN
    UPDATE inventory_items
    SET quantity = quantity + p_quantity,
        updated_at = NOW()
    WHERE id = p_item_id
      AND organization_id = p_organization_id
    RETURNING quantity - p_quantity, quantity
    INTO v_before, v_after;

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows = 0 THEN
      RETURN QUERY SELECT false, 'update_failed'::TEXT, NULL::INT, NULL::INT;
      RETURN;
    END IF;

    INSERT INTO inventory_movements (
      organization_id, inventory_item_id, movement_type,
      quantity_change, quantity_before, quantity_after,
      metadata, created_by
    ) VALUES (
      p_organization_id, p_item_id, 'purchase',
      p_quantity, v_before, v_after,
      jsonb_build_object(
        'unit_cost', p_unit_cost,
        'total_cost', p_total_cost,
        'payment_status', p_payment_status
      ),
      p_created_by
    );

    IF p_cash_session_id IS NOT NULL THEN
      INSERT INTO operation_entries (
        cash_session_id, entry_type, entry_group, entry_status,
        created_via, direction, title, description, amount,
        payment_method, source_type, source_id, created_by, metadata
      ) VALUES (
        p_cash_session_id, 'inventory_purchase', 'inventory', 'active',
        'inventory_auto', 'out',
        'Compra: ' || v_item_name || ' x' || p_quantity,
        p_notes, p_total_cost, p_payment_method,
        'inventory', p_item_id, p_created_by,
        jsonb_build_object(
          'quantity', p_quantity,
          'unit_cost', p_unit_cost,
          'payment_status', p_payment_status
        )
      );
    END IF;

    RETURN QUERY SELECT true, NULL::TEXT, v_before, v_after;

  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false,
      CASE
        WHEN SQLSTATE = '23514' THEN 'check_constraint_violation'
        WHEN SQLSTATE = '23503' THEN 'foreign_key_violation'
        WHEN SQLSTATE = '23505' THEN 'unique_violation'
        ELSE SQLERRM
      END::TEXT,
      NULL::INT, NULL::INT;
  END;
END;
$$;

-- ---------------------------------------------------------------------
-- inventory_record_consumption
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION inventory_record_consumption(
  p_item_id         UUID,
  p_quantity        INT,
  p_organization_id UUID,
  p_created_by      UUID,
  p_estimated_cost  NUMERIC DEFAULT NULL,
  p_notes           TEXT DEFAULT NULL,
  p_cash_session_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success         BOOLEAN,
  error           TEXT,
  quantity_before INT,
  quantity_after  INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows          INT;
  v_before        INT;
  v_after         INT;
  v_item_name     TEXT;
  v_has_session   BOOLEAN;
  v_not_found     BOOLEAN;
  v_low_stock     BOOLEAN;
BEGIN
  -- Guard: non-null required params
  IF p_item_id IS NULL OR p_quantity IS NULL OR p_organization_id IS NULL
     OR p_created_by IS NULL
  THEN
    RETURN QUERY SELECT false, 'invalid_params'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Guard: authenticated user
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false, 'unauthorized'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Guard: org membership check (JWT-verified)
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id
      AND user_id = auth.uid()
  ) THEN
    RETURN QUERY SELECT false, 'unauthorized'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Guard: identity check
  IF auth.uid() IS DISTINCT FROM p_created_by THEN
    RETURN QUERY SELECT false, 'identity_mismatch'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Guard: positive quantity
  IF p_quantity <= 0 THEN
    RETURN QUERY SELECT false, 'invalid_quantity'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- Fetch item name
  SELECT name INTO v_item_name
  FROM inventory_items
  WHERE id = p_item_id AND organization_id = p_organization_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'item_not_found'::TEXT, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  v_has_session := (p_cash_session_id IS NOT NULL);

  BEGIN
    -- Atomic decrement with insufficient_stock guard
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
      SELECT EXISTS(SELECT 1 FROM inventory_items WHERE id = p_item_id AND organization_id = p_organization_id AND quantity < p_quantity),
             NOT EXISTS(SELECT 1 FROM inventory_items WHERE id = p_item_id AND organization_id = p_organization_id)
      INTO v_low_stock, v_not_found;

      IF v_not_found THEN
        RETURN QUERY SELECT false, 'item_not_found'::TEXT, NULL::INT, NULL::INT;
      ELSIF v_low_stock THEN
        RETURN QUERY SELECT false, 'insufficient_stock'::TEXT, NULL::INT, NULL::INT;
      ELSE
        RETURN QUERY SELECT false, 'organization_mismatch'::TEXT, NULL::INT, NULL::INT;
      END IF;
      RETURN;
    END IF;

    INSERT INTO inventory_movements (
      organization_id, inventory_item_id, movement_type,
      quantity_change, quantity_before, quantity_after,
      reason, metadata, created_by
    ) VALUES (
      p_organization_id, p_item_id, 'consumption',
      -p_quantity, v_before, v_after,
      p_notes,
      jsonb_build_object('estimated_cost', p_estimated_cost),
      p_created_by
    );

    IF v_has_session THEN
      INSERT INTO operation_entries (
        cash_session_id, entry_type, entry_group, entry_status,
        created_via, direction, title, description, amount,
        source_type, source_id, created_by, metadata
      ) VALUES (
        p_cash_session_id, 'inventory_out', 'inventory', 'active',
        'inventory_auto', NULL,
        'Consumo: ' || v_item_name || ' x' || p_quantity,
        p_notes, 0,
        'inventory', p_item_id, p_created_by,
        jsonb_build_object(
          'quantity', p_quantity,
          'estimated_cost', p_estimated_cost,
          'remaining_stock', v_after
        )
      );
    END IF;

    RETURN QUERY SELECT true, NULL::TEXT, v_before, v_after;

  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false,
      CASE
        WHEN SQLSTATE = '23514' THEN 'check_constraint_violation'
        WHEN SQLSTATE = '23503' THEN 'foreign_key_violation'
        WHEN SQLSTATE = '23505' THEN 'unique_violation'
        ELSE SQLERRM
      END::TEXT,
      NULL::INT, NULL::INT;
  END;
END;
$$;

-- ---------------------------------------------------------------------
-- Grants: explícitos para authenticated role
-- ---------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION inventory_record_purchase(
  UUID, INT, UUID, UUID, NUMERIC, NUMERIC, TEXT, UUID, TEXT, TEXT
) TO authenticated;

GRANT EXECUTE ON FUNCTION inventory_record_consumption(
  UUID, INT, UUID, UUID, NUMERIC, TEXT, UUID
) TO authenticated;
