'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function voidEntry(input: { entry_id: string; reason: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }
  const { data: entry } = await (supabase as any).from('operation_entries').select('id, cash_session_id, entry_status, source_type').eq('id', input.entry_id).single()
  if (!entry) return { error: 'Movimiento no encontrado.' }
  if (entry.entry_status !== 'active') return { error: 'Ya anulado.' }
  const { data: session } = await (supabase as any).from('cash_sessions').select('organization_id, status').eq('id', entry.cash_session_id).single()
  if (!session) return { error: 'Sesion no encontrada.' }
  if (session.status !== 'open') return { error: 'No en caja cerrada.' }
  const { data: member } = await supabase.from('organization_members').select('role').eq('user_id', user.id).eq('organization_id', session.organization_id).single()
  if (!member || !['owner', 'admin'].includes(member.role)) return { error: 'Sin permiso.' }
  if (entry.source_type !== 'manual' && member.role !== 'owner') return { error: 'Solo owner.' }
  await (supabase as any).from('operation_entries').update({
    entry_status: 'voided', voided_by: user.id, voided_at: new Date().toISOString(), void_reason: input.reason,
  }).eq('id', input.entry_id)
  revalidatePath('/caja')
  return {}
}
