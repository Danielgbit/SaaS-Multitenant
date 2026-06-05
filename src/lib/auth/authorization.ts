import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/../types/supabase'
import type { OrganizationStatus, OrganizationAccess } from '@/lib/admin/types'

/**
 * @deprecated No usar en Server Actions.
 * Lanza excepción en vez de retornar { success, error }.
 * Usar require-org-access.ts en su lugar.
 */
export async function requireRole(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  allowedRoles: string[]
): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single()

  if (!member || !allowedRoles.includes(member.role)) {
    throw new Error('Not authorized')
  }
}

/**
 * @deprecated Usar require-org-access.ts en su lugar.
 */
export async function requireOrganizationAccess(
  supabase: SupabaseClient<Database>,
  organizationId: string
): Promise<OrganizationAccess> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const [memberResult, orgResult] = await Promise.all([
    supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single(),
    supabase
      .from('organizations')
      .select('status')
      .eq('id', organizationId)
      .single(),
  ])

  if (!memberResult.data) throw new Error('Not authorized')
  if (!orgResult.data) throw new Error('Organization not found')

  return {
    userId: user.id,
    role: memberResult.data.role,
    organizationStatus: orgResult.data.status as OrganizationStatus,
  }
}

/**
 * @deprecated Usar require-org-access.ts en su lugar.
 */
export async function requireActiveOrganization(
  supabase: SupabaseClient<Database>,
  organizationId: string
): Promise<OrganizationAccess> {
  const access = await requireOrganizationAccess(supabase, organizationId)
  if (access.organizationStatus !== 'active') {
    throw new Error('Organization is suspended or inactive')
  }
  return access
}
