'use server'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateColombia } from '@/lib/utils/colombia-dates'
import type { CashSessionSummary, OperationEntry } from '@/types/cash-sessions'

export async function getTodaySession(organizationId: string): Promise<{ success: boolean; session?: CashSessionSummary | null; entries?: OperationEntry[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }
  const today = getTodayDateColombia()
  const { data: session } = await (supabase as any).from('cash_session_summary').select('*').eq('organization_id', organizationId).eq('session_date', today).maybeSingle()
  if (!session) return { success: true, session: null, entries: [] }
  const { data: entries } = await (supabase as any).from('operation_entries').select('*').eq('cash_session_id', session.id).order('created_at', { ascending: true })
  return { success: true, session: session as unknown as CashSessionSummary, entries: entries as unknown as OperationEntry[] }
}
