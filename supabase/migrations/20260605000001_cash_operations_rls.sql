-- ============================================================
-- Habilitar RLS en tablas de operaciones de caja
-- Migration: 20260605000001
-- ============================================================

ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_entries ENABLE ROW LEVEL SECURITY;

-- cash_sessions: acceso por organización
CREATE POLICY "cash_sessions_select" ON cash_sessions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "cash_sessions_insert" ON cash_sessions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "cash_sessions_update" ON cash_sessions
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "cash_sessions_no_delete" ON cash_sessions
  FOR DELETE USING (false);

-- operation_entries: acceso a través de cash_session
CREATE POLICY "operation_entries_select" ON operation_entries
  FOR SELECT USING (
    cash_session_id IN (
      SELECT id FROM cash_sessions WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "operation_entries_insert" ON operation_entries
  FOR INSERT WITH CHECK (
    cash_session_id IN (
      SELECT id FROM cash_sessions WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "operation_entries_update" ON operation_entries
  FOR UPDATE USING (
    cash_session_id IN (
      SELECT id FROM cash_sessions WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "operation_entries_no_delete" ON operation_entries
  FOR DELETE USING (false);
