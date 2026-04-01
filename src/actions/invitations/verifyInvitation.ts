'use server'

import { createClient } from '@/lib/supabase/server'
import type { InvitationWithDetails } from '@/types/invitations'

export type InvitationErrorType = 
  | 'invalid_token'
  | 'not_found'
  | 'already_accepted'
  | 'cancelled'
  | 'expired'

interface VerifyInvitationResult {
  invitation?: InvitationWithDetails
  error?: string
  errorType?: InvitationErrorType
}

export async function verifyInvitation(token: string): Promise<VerifyInvitationResult> {
  if (!token || typeof token !== 'string') {
    return { error: 'Esta invitación no es válida.', errorType: 'invalid_token' }
  }

  const supabase = await createClient()

  const { data: invitation, error } = await (supabase as any)
    .from('employee_invitations')
    .select('*, employees(name), organizations(name)')
    .eq('token', token)
    .single()

  if (error || !invitation) {
    return { error: 'Esta invitación no fue encontrada.', errorType: 'not_found' }
  }

  if (invitation.status === 'accepted') {
    return { error: 'Esta invitación ya fue aceptada.', errorType: 'already_accepted' }
  }

  if (invitation.status === 'cancelled') {
    return { error: 'Esta invitación fue cancelada.', errorType: 'cancelled' }
  }

  const expiresAt = new Date(invitation.expires_at)
  if (expiresAt < new Date()) {
    return { error: 'Esta invitación ha expirado.', errorType: 'expired' }
  }

  return {
    invitation: {
      id: invitation.id,
      organization_id: invitation.organization_id,
      employee_id: invitation.employee_id,
      email: invitation.email,
      token: invitation.token,
      role: invitation.role,
      status: invitation.status,
      expires_at: invitation.expires_at,
      accepted_at: invitation.accepted_at,
      resend_count: invitation.resend_count,
      last_resend_at: invitation.last_resend_at,
      created_at: invitation.created_at,
      created_by: invitation.created_by,
      employee_name: invitation.employees?.name,
      organization_name: invitation.organizations?.name,
    }
  }
}
