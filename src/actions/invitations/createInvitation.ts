'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { clientEnv } from '@/lib/env/client'
import { z } from 'zod'
import { createInvitationLimiter } from '@/lib/rate-limiter'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'
import { headers } from 'next/headers'
import { getClientIp } from '@/lib/network/get-client-ip'
import type { CreateInvitationInput, MemberRole } from '@/types/invitations'

const CreateInvitationSchema = z.object({
  employeeId: z.string().uuid('ID de empleado inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  role: z.enum(['staff', 'admin', 'empleado']).optional().default('staff'),
  sendEmail: z.boolean().optional().default(true),
})

const INVITATION_EXPIRY_DAYS = 7

export async function createInvitation(
  input: CreateInvitationInput
): Promise<{ success?: boolean; invitationUrl?: string; emailSent?: boolean; error?: string }> {
  const supabase = await createClient()

  const validation = CreateInvitationSchema.safeParse(input)
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message }
  }

  const { employeeId, email, role, sendEmail } = validation.data
  const emailValue = email || null
  const shouldSendEmail = sendEmail && emailValue

  const access = await requireCurrentOrganization(['owner', 'admin'])
  if (!access.success) return { error: access.error }

  const headerStore = await headers()
  const ip = getClientIp(headerStore)
  const rateKey = `createInvitation:${access.context.organizationId}:${access.context.userId}`
  const rateCheck = createInvitationLimiter.check(rateKey)
  if (!rateCheck.allowed) {
    createInvitationLimiter.hit(rateKey, { ip, route: 'createInvitation', userId: access.context.userId, organizationId: access.context.organizationId })
    return { error: 'Demasiados intentos. Intenta nuevamente en unos minutos.' }
  }
  createInvitationLimiter.hit(rateKey, { ip, route: 'createInvitation', userId: access.context.userId, organizationId: access.context.organizationId })

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, name, user_id')
    .eq('id', employeeId)
    .eq('organization_id', access.context.organizationId)
    .single()

  if (employeeError || !employee) {
    return { error: 'Empleado no encontrado.' }
  }

  if (employee.user_id) {
    return { error: 'Este empleado ya tiene acceso al sistema.' }
  }

  if (emailValue) {
    const { data: existingInvite } = await supabase
      .from('employee_invitations')
      .select('id, status')
      .eq('organization_id', access.context.organizationId)
      .eq('email', emailValue)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return { error: 'Ya existe una invitación pendiente para este email.' }
    }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan:plans(max_employees)')
    .eq('organization_id', access.context.organizationId)
    .eq('status', 'active')
    .single()

  const { data: currentEmployees } = await supabase
    .from('employees')
    .select('id', { count: 'exact' })
    .eq('organization_id', access.context.organizationId)

  const employeeCount = currentEmployees?.length || 0
  const maxEmployees = subscription?.plan?.max_employees || 0

  if (maxEmployees > 0 && employeeCount >= maxEmployees) {
    return { error: `Has alcanzado el límite de empleados de tu plan (${maxEmployees}).` }
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS)

  const { data: invitation, error: inviteError } = await supabase
    .from('employee_invitations')
    .insert({
      organization_id: access.context.organizationId,
      employee_id: employeeId,
      email: emailValue,
      token,
      role: role as MemberRole,
      expires_at: expiresAt.toISOString(),
      created_by: access.context.userId,
    })
    .select()
    .single()

  if (inviteError) {
    console.error('Error creating invitation:', inviteError.message)
    return { error: 'No se pudo crear la invitación.' }
  }

  const baseUrl = clientEnv?.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const invitationUrl = `${baseUrl}/invitar/${token}`

  let emailSent = false
  if (shouldSendEmail) {
    emailSent = await sendInvitationEmail(emailValue, employee.name, access.context.organizationId, invitationUrl, role as string)
  }

  revalidatePath('/employees')
  return { success: true, invitationUrl, emailSent }
}

async function sendInvitationEmail(
  to: string,
  employeeName: string,
  organizationId: string,
  invitationUrl: string,
  role: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single()

  const orgName = organization?.name || 'la organización'

  try {
    const { getEmailTemplate } = await import('@/lib/email/templates')
    const { subject, html } = getEmailTemplate('employee_invitation', {
      businessName: orgName,
      employeeName,
      invitationUrl,
      role,
    })

    const { sendEmail } = await import('@/lib/resend')
    const result = await sendEmail({ to, subject, html })
    return result.success
  } catch (error) {
    console.error('Error sending invitation email:', error)
    return false
  }
}
