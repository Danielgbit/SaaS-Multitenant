'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const GetEmailLogsSchema = z.object({
  organizationId: z.string().uuid('ID de organización inválido'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
})

export async function getEmailLogs(
  data: z.infer<typeof GetEmailLogsSchema>
): Promise<{
  success: boolean
  data?: Array<{
    id: string
    organization_id: string
    appointment_id: string | null
    client_id: string | null
    email_type: string
    to_email: string
    subject: string
    status: string
    error_message: string | null
    sent_at: string | null
    created_at: string
  }>
  error?: string
}> {
  const validation = GetEmailLogsSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message }
  }

  const { organizationId, limit, offset } = validation.data

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'No autorizado.' }
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single()

  if (!orgMember) {
    return { success: false, error: 'No perteneces a esta organización.' }
  }

  try {
    const { data: logs, error: logsError } = await (supabase as any)
      .from('email_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (logsError) {
      console.error('Error fetching email logs:', logsError)
      return { success: false, error: 'Error al obtener logs.' }
    }

    return { success: true, data: logs || [] }
  } catch (error) {
    console.error('Error in getEmailLogs:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
