-- ============================================================
-- Sprint 5 — RLS by role for inventory tables
-- ============================================================

-- Helper generico: el usuario actual tiene algun rol de la lista?
CREATE OR REPLACE FUNCTION has_org_role(
  p_org_id UUID,
  p_roles TEXT[]
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND role = ANY(p_roles)
  );
$$;

REVOKE ALL ON FUNCTION has_org_role(UUID, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION has_org_role(UUID, TEXT[]) TO authenticated;

-- ── inventory_items ──────────────────────────────────────────
DROP POLICY IF EXISTS "inventory_access" ON inventory_items;

CREATE POLICY "inv_items_select" ON inventory_items
  FOR SELECT USING (has_org_role(organization_id, ARRAY['owner','admin','staff']));

CREATE POLICY "inv_items_insert" ON inventory_items
  FOR INSERT WITH CHECK (has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY "inv_items_update" ON inventory_items
  FOR UPDATE
  USING (has_org_role(organization_id, ARRAY['owner','admin']))
  WITH CHECK (has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY "inv_items_delete" ON inventory_items
  FOR DELETE USING (has_org_role(organization_id, ARRAY['owner']));

-- ── inventory_movements (ledger inmutable) ───────────────────
DROP POLICY IF EXISTS "movements_select" ON inventory_movements;
DROP POLICY IF EXISTS "movements_insert" ON inventory_movements;
DROP POLICY IF EXISTS "movements_no_update" ON inventory_movements;
DROP POLICY IF EXISTS "movements_no_delete" ON inventory_movements;

CREATE POLICY "inv_mov_select" ON inventory_movements
  FOR SELECT USING (has_org_role(organization_id, ARRAY['owner','admin','staff']));

CREATE POLICY "inv_mov_insert" ON inventory_movements
  FOR INSERT WITH CHECK (has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY "inv_mov_no_update" ON inventory_movements
  FOR UPDATE USING (false) WITH CHECK (false);

CREATE POLICY "inv_mov_no_delete" ON inventory_movements
  FOR DELETE USING (false);

-- ── inventory_divergences (cron-managed) ─────────────────────
ALTER TABLE inventory_divergences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_div_select" ON inventory_divergences
  FOR SELECT USING (has_org_role(organization_id, ARRAY['owner','admin','staff']));

CREATE POLICY "inv_div_insert" ON inventory_divergences
  FOR INSERT WITH CHECK (false);

CREATE POLICY "inv_div_update" ON inventory_divergences
  FOR UPDATE
  USING (has_org_role(organization_id, ARRAY['owner','admin']))
  WITH CHECK (has_org_role(organization_id, ARRAY['owner','admin']));

CREATE POLICY "inv_div_delete" ON inventory_divergences
  FOR DELETE USING (false);
