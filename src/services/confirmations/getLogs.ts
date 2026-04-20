import { createClient } from '@/lib/supabase/server'
import type { ConfirmationLog } from '@/types/confirmations'

export async function getLogsForAppointment(
  appointmentId: string
): Promise<ConfirmationLog[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('confirmation_logs')
    .select('*')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getLogsForAppointment] Error:', error)
    return []
  }

  return (data as ConfirmationLog[]) || []
}
