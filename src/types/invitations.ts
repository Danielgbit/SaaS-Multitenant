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

export type MemberRole = 'staff' | 'admin' | 'owner'

export type CreateInvitationInput = {
  employeeId: string
  email?: string
  role?: MemberRole
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
