'use server'
import { createClient } from '@/lib/supabase/server'
import type { CashSessionSummary } from '@/types/cash-sessions'

export async function getSessionHistory(organizationId: string, limit: number = 30): Promise<{ success: boolean; sessions?: CashSessionSummary[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }
  const { data: sessions, error } = await (supabase as any).from('cash_session_summary').select('*').eq('organization_id', organizationId).order('session_date', { ascending: false }).limit(limit)
  if (error) return { success: false, error: error.message }
  return { success: true, sessions: sessions as unknown as CashSessionSummary[] }
}
