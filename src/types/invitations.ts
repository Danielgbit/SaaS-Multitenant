export interface Invitation {
  id: string
  organization_id: string
  employee_id: string
  email: string | null
  token: string
  role: string
  status: string
  expires_at: string
  accepted_at: string | null
  resend_count: number
  last_resend_at: string | null
  created_at: string
  created_by: string | null
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

// NOTE:
// 'empleado' existe en TypeScript pero actualmente no forma parte
// del ENUM role_type de Supabase. Mantener sincronizados ambos dominios.
export type MemberRole = 'owner' | 'admin' | 'staff' | 'empleado'

export type CreateInvitationInput = {
  employeeId: string
  email?: string
  role?: MemberRole
  sendEmail?: boolean
}

export type ResendInvitationInput = {
  invitationId: string
}

export type CancelInvitationInput = {
  invitationId: string
}

export type VerifyInvitationInput = {
  token: string
}

export type AcceptInvitationInput = {
  token: string
}

export type RevokeAccessInput = {
  employeeId: string
}

export type UpdateMemberRoleInput = {
  memberId: string
  role: MemberRole
}

export type InvitationWithDetails = Invitation & {
  employee_name?: string
  organization_name?: string
}

export type LinkUserToEmployeeInput = {
  userId: string
  employeeId: string
  organizationId?: string
}

export type LinkUserToEmployeeErrorType =
  | 'invalid_input'
  | 'employee_not_found'
  | 'user_not_found'
  | 'already_linked'
  | 'different_organization'
  | 'link_failed'
  | 'member_creation_failed'
  | 'employee_belongs_to_different_org'

export interface LinkedEmployee {
  id: string
  name: string
  user_id: string | null
  organization_id: string
}
