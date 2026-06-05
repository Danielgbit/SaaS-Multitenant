-- ============================================================
-- Sprint 2 — RLS for inventory_movements
-- ============================================================

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "movements_select" ON inventory_movements
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM get_user_organization_ids(auth.uid())
  ));

CREATE POLICY "movements_insert" ON inventory_movements
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM get_user_organization_ids(auth.uid())
  ));

CREATE POLICY "movements_no_update" ON inventory_movements
  FOR UPDATE USING (false);

CREATE POLICY "movements_no_delete" ON inventory_movements
  FOR DELETE USING (false);
