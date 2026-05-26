-- =====================================================
-- FIX: Cross-org RLS en employee_availability_overrides
-- Fecha: 2026-05-27
-- Descripción:
--   Las policies admin no scopedan al organization_id
--   del empleado → posible fuga/alteración cross-tenant
--
--   Antes: solo checkeaba rol global (cualquier org)
--   Ahora: verifica que employee_id pertenece a la
--          misma org donde el usuario tiene rol admin
-- =====================================================

-- =====================================================
-- Empleados pueden ver sus propios overrides
-- (sin cambios, ya scoped correctamente)
-- =====================================================
-- POLICY "employees_can_view_own_overrides" (OK)

-- =====================================================
-- Admin: SELECT - scopeado por org del empleado
-- =====================================================
DROP POLICY IF EXISTS "admins_can_view_all_overrides" ON employee_availability_overrides;

CREATE POLICY "admins_can_view_all_overrides" ON employee_availability_overrides
  FOR SELECT
  USING (
    employee_id IN (
      SELECT e.id FROM employees e
      WHERE e.organization_id IN (
        SELECT organization_id FROM get_user_organization_ids(auth.uid())
      )
    )
    AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'assistant')
    )
  );

-- =====================================================
-- Admin: INSERT - scopeado por org del empleado
-- =====================================================
DROP POLICY IF EXISTS "admins_can_create_overrides" ON employee_availability_overrides;

CREATE POLICY "admins_can_create_overrides" ON employee_availability_overrides
  FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM employees e
      WHERE e.organization_id IN (
        SELECT organization_id FROM get_user_organization_ids(auth.uid())
      )
    )
    AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'assistant')
    )
  );

-- =====================================================
-- Admin: UPDATE - scopeado por org del empleado
-- =====================================================
DROP POLICY IF EXISTS "admins_can_update_overrides" ON employee_availability_overrides;

CREATE POLICY "admins_can_update_overrides" ON employee_availability_overrides
  FOR UPDATE
  USING (
    employee_id IN (
      SELECT e.id FROM employees e
      WHERE e.organization_id IN (
        SELECT organization_id FROM get_user_organization_ids(auth.uid())
      )
    )
    AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'assistant')
    )
  );

-- =====================================================
-- Admin: DELETE - scopeado por org del empleado
-- =====================================================
DROP POLICY IF EXISTS "admins_can_delete_overrides" ON employee_availability_overrides;

CREATE POLICY "admins_can_delete_overrides" ON employee_availability_overrides
  FOR DELETE
  USING (
    employee_id IN (
      SELECT e.id FROM employees e
      WHERE e.organization_id IN (
        SELECT organization_id FROM get_user_organization_ids(auth.uid())
      )
    )
    AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'assistant')
    )
  );
