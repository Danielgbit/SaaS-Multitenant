'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const GetLogsSchema = z.object({
  organizationId: z.string().uuid(),
  status: z.enum(['all', 'sent', 'failed', 'pending']).optional().default('all'),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
})

export async function getWhatsAppLogs(
  input: z.infer<typeof GetLogsSchema>
): Promise<{
  success: boolean
  data?: Array<{
    id: string
    phone_number: string
    message_type: string
    status: string
    error_message: string | null
    sent_at: string | null
    created_at: string
    appointment_id: string | null
    clients: { name: string } | null
    appointments: { start_time: string; services: { name: string } | null } | null
  }>
  total?: number
  error?: string
}> {
  const validation = GetLogsSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: 'Parámetros inválidos' }
  }

  const { organizationId, status, limit, offset } = validation.data
  const supabase = await createClient()

  try {
    let query = (supabase as any)
      .from('whatsapp_logs')
      .select(`
        id,
        phone_number,
        message_type,
        status,
        error_message,
        sent_at,
        created_at,
        appointment_id,
        clients!inner(name),
        appointments!inner(start_time, services!inner(name))
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching WhatsApp logs:', error)
      return { success: false, error: 'Error al obtener historial' }
    }

    const { count } = await (supabase as any)
      .from('whatsapp_logs')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    return {
      success: true,
      data: data as any,
      total: count || 0,
    }
  } catch (error) {
    console.error('Error in getWhatsAppLogs:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
