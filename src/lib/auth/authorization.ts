import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/../types/supabase'

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

export async function requireOrganizationAccess(
  supabase: SupabaseClient<Database>,
  organizationId: string
): Promise<{ userId: string; role: string }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single()

  if (!member) throw new Error('Not authorized')

  return { userId: user.id, role: member.role }
}
