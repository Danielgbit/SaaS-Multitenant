'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireOrgAccess, requireCurrentOrganization } from '@/lib/auth/require-org-access'

export async function getInvitationsByEmployee(employeeId: string) {
  const supabase = await createClient()

  const access = await requireCurrentOrganization()
  if (!access.success) return { error: access.error }

  const { data: invitations, error } = await supabase
    .from('employee_invitations')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('organization_id', access.context.organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invitations:', error.message)
    return { error: 'No se pudieron obtener las invitaciones.' }
  }

  return { invitations: invitations || [] }
}

export async function getPendingInvitations(organizationId?: string) {
  const supabase = await createClient()

  const access = organizationId
    ? await requireOrgAccess(organizationId)
    : await requireCurrentOrganization()
  if (!access.success) return { error: access.error }

  const orgId = access.context.organizationId

  const { data: invitations, error } = await supabase
    .from('employee_invitations')
    .select('*, employee:employees(name)')
    .eq('organization_id', orgId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending invitations:', error.message)
    return { error: 'No se pudieron obtener las invitaciones.' }
  }

  return { invitations: invitations || [] }
}
