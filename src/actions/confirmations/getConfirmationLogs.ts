'use server'

import { createClient } from '@/lib/supabase/server'
import { GetConfirmationLogsSchema } from './schemas'
import type { ConfirmationLog } from '@/types/confirmations'

export async function getConfirmationLogs(
  appointmentId: string
): Promise<ConfirmationLog[]> {
  const parsed = GetConfirmationLogsSchema.safeParse({ appointmentId })

  if (!parsed.success) {
    console.error('[getConfirmationLogs] Invalid input:', parsed.error)
    return []
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return []
  }

  const { data: appointment, error: apptError } = await (supabase as any)
    .from('appointments')
    .select('organization_id')
    .eq('id', appointmentId)
    .single()

  if (apptError || !appointment) {
    return []
  }

  const { data: logs, error: logsError } = await (supabase as any)
    .from('confirmation_logs')
    .select('*')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: true })

  if (logsError) {
    console.error('[getConfirmationLogs] Error:', logsError)
    return []
  }

  return (logs as ConfirmationLog[]) || []
}
