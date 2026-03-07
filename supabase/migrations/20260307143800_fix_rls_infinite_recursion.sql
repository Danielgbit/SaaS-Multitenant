-- =========================================================================================
-- FIX: Recursión infinita en la política RLS de organization_members
--
-- PROBLEMA:
--   La política original tenía una subconsulta que volvía a consultar la misma tabla:
--     organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
--   Esto causa que Postgres entre en un bucle infinito al evaluar la política RLS.
--
-- SOLUCIÓN:
--   1. Crear una función SECURITY DEFINER que evalúa la membresía sin pasar por RLS.
--   2. Reemplazar la política de organization_members con una condición simple:
--      solo user_id = auth.uid() (el usuario solo accede a sus propios registros).
--   3. Las demás tablas siguen usando la función helper para verificar membresía.
-- =========================================================================================

-- ==========================================
-- PASO 1: Eliminar la política problemática
-- ==========================================
DROP POLICY IF EXISTS "Users can access their organization members" ON organization_members;

-- ==========================================
-- PASO 2: Función SECURITY DEFINER helper
--   Corre como el propietario de la BD,
--   saltando RLS al consultar organization_members.
-- ==========================================
CREATE OR REPLACE FUNCTION get_user_organization_ids(p_user_id uuid)
RETURNS TABLE (organization_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = p_user_id;
$$;

-- Revocar acceso público a la función, solo puede ser llamada internamente
REVOKE ALL ON FUNCTION get_user_organization_ids(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_organization_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organization_ids(uuid) TO service_role;

-- ==========================================
-- PASO 3: Nueva política para organization_members
--   Sin recursión: solo accede a sus propias filas o
--   a filas de su misma organización usando la función helper.
-- ==========================================
CREATE POLICY "Users can access their organization members"
ON organization_members
FOR ALL
USING (
  -- El usuario accede a sus propias filas directamente (sin consultar la tabla de nuevo)
  user_id = auth.uid()
  OR
  -- O accede a filas de sus organizaciones usando la función SECURITY DEFINER
  organization_id IN (SELECT organization_id FROM get_user_organization_ids(auth.uid()))
);

-- ==========================================
-- PASO 4: Eliminar y recrear la política de organizations
--   Usando la función helper para evitar posibles problemas.
-- ==========================================
DROP POLICY IF EXISTS "Users can access their organizations" ON organizations;

CREATE POLICY "Users can access their organizations"
ON organizations
FOR ALL
USING (
  id IN (SELECT organization_id FROM get_user_organization_ids(auth.uid()))
);
