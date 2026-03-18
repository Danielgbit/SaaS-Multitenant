'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getInvitationsByEmployee(employeeId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No se encontró organización.' }
  }

  const { data: invitations, error } = await (supabase as any)
    .from('employee_invitations')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('organization_id', orgMember.organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invitations:', error.message)
    return { error: 'No se pudieron obtener las invitaciones.' }
  }

  return { invitations: invitations || [] }
}

export async function getPendingInvitations(organizationId?: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  let orgId = organizationId
  if (!orgId) {
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()
    orgId = orgMember?.organization_id
  }

  if (!orgId) {
    return { error: 'No se encontró organización.' }
  }

  const { data: invitations, error } = await (supabase as any)
    .from('employee_invitations')
    .select('*, employee:employees(name)')
    .eq('organization_id', orgId)
    .eq('status', 'pending')
    .eq('expires_at', new Date().toISOString(), { type: 'gt' })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending invitations:', error.message)
    return { error: 'No se pudieron obtener las invitaciones.' }
  }

  return { invitations: invitations || [] }
}
