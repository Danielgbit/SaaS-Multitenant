import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuthContext {
  userId: string
  organizationId: string
  role: string
}

export type AuthResult =
  | { success: true; context: AuthContext }
  | { success: false; error: string }

/**
 * Verifica autenticación + membresía en una organización conocida.
 * Acepta supabase client opcional para reutilizar conexión existente.
 *
 * Uso:
 *   const access = await requireOrgAccess(orgId, ['owner', 'admin'])
 *   if (!access.success) return access
 *   // access.context.userId, access.context.role
 *
 * TODO: Cuando el perfil de rendimiento lo requiera, agregar
 * requireOrgAccessFromUser(userId, orgId, roles, supabase)
 * para evitar doble consulta a auth.getUser() en acciones
 * que ya tienen el userId disponible.
 */
export async function requireOrgAccess(
  organizationId: string,
  requiredRoles?: string[],
  supabase?: SupabaseClient
): Promise<AuthResult> {
  const client = supabase ?? await createClient()

  const { data: { user } } = await client.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }

  const { data: member } = await client
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single()

  if (!member) return { success: false, error: 'No perteneces a esta organización.' }

  if (requiredRoles && !requiredRoles.includes(member.role)) {
    return { success: false, error: 'Sin permiso para esta operación.' }
  }

  return {
    success: true,
    context: { userId: user.id, organizationId, role: member.role },
  }
}

/**
 * Obtiene la primera organización del usuario actual.
 * Útil en páginas/dashboards donde el org context se descubre, no se conoce.
 *
 * Uso:
 *   const access = await requireCurrentOrganization()
 *   if (!access.success) redirect('/login')
 *   // access.context.organizationId, access.context.role
 */
export async function requireCurrentOrganization(
  requiredRoles?: string[],
  supabase?: SupabaseClient
): Promise<AuthResult> {
  const client = supabase ?? await createClient()

  const { data: { user } } = await client.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }

  const { data: member } = await client
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!member) return { success: false, error: 'No perteneces a ninguna organización.' }

  if (requiredRoles && !requiredRoles.includes(member.role)) {
    return { success: false, error: 'Sin permiso para esta operación.' }
  }

  return {
    success: true,
    context: { userId: user.id, organizationId: member.organization_id, role: member.role },
  }
}
