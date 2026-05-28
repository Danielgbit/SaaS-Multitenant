'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateColombia } from '@/lib/utils/colombia-dates'
import type { OpenSessionInput } from '@/types/cash-sessions'

export async function openSession(input: OpenSessionInput): Promise<{ success: boolean; error?: string; session_id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }
  const { data: orgMember } = await supabase.from('organization_members').select('role').eq('user_id', user.id).eq('organization_id', input.organization_id).single()
  if (!orgMember) return { success: false, error: 'No perteneces.' }
  if (!['owner', 'admin', 'staff'].includes(orgMember.role)) return { success: false, error: 'Sin permiso.' }
  const today = getTodayDateColombia()
  const { data: existing } = await (supabase as any).from('cash_sessions').select('id').eq('organization_id', input.organization_id).eq('session_date', today).eq('status', 'open').maybeSingle()
  if (existing) return { success: false, error: 'Ya hay caja abierta.' }
  const { data: session, error } = await (supabase as any).from('cash_sessions').insert({ organization_id: input.organization_id, session_date: today, opened_by: user.id, opening_cash: input.opening_cash, notes: input.notes || null }).select('id').single()
  if (error) return { success: false, error: 'Error al abrir.' }
  revalidatePath('/caja')
  return { success: true, session_id: session.id }
}
