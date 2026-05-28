'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CloseSessionInput } from '@/types/cash-sessions'

export async function closeSession(input: CloseSessionInput): Promise<{ success: boolean; error?: string; diff?: Record<string, number>; total_diff?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }
  const { data: session } = await (supabase as any).from('cash_sessions').select('organization_id, status, opening_cash').eq('id', input.session_id).single()
  if (!session) return { success: false, error: 'Sesion no encontrada.' }
  if (session.status !== 'open') return { success: false, error: 'Caja ya cerrada.' }
  const { data: orgMember } = await supabase.from('organization_members').select('role').eq('user_id', user.id).eq('organization_id', session.organization_id).single()
  if (!orgMember || !['owner', 'admin', 'staff'].includes(orgMember.role)) return { success: false, error: 'Sin permiso.' }
  const { data: summary } = await (supabase as any).from('cash_session_summary').select('expected_cash, expected_cash_detail').eq('id', input.session_id).single()
  const expectedDetail = summary?.expected_cash_detail ?? { cash: 0, qr: 0, transfer: 0, card: 0 }
  const diff: Record<string, number> = {}; let totalDiff = 0
  for (const m of ['cash', 'qr', 'transfer', 'card'] as const) { const d = (input.real_cash_detail[m] ?? 0) - (expectedDetail[m] ?? 0); diff[m] = d; totalDiff += d }
  await (supabase as any).from('cash_sessions').update({ status: 'closed', closed_by: user.id, closed_at: new Date().toISOString(), real_cash_detail: input.real_cash_detail, notes: input.notes || null }).eq('id', input.session_id)
  revalidatePath('/caja')
  return { success: true, diff, total_diff: totalDiff }
}
