'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateManualEntryInput, EntryType } from '@/types/cash-sessions'

const VALID_TYPES: EntryType[] = ['expense', 'note', 'break', 'adjustment']

export async function createManualEntry(input: CreateManualEntryInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }
  const { data: session } = await (supabase as any).from('cash_sessions').select('organization_id, status').eq('id', input.cash_session_id).single()
  if (!session) return { error: 'Sesion no encontrada.' }
  if (session.status !== 'open') return { error: 'Caja cerrada.' }
  const { data: member } = await supabase.from('organization_members').select('role').eq('user_id', user.id).eq('organization_id', session.organization_id).single()
  if (!member || !['owner', 'admin', 'staff'].includes(member.role)) return { error: 'Sin permiso.' }
  if (!VALID_TYPES.includes(input.entry_type)) return { error: 'Tipo invalido.' }
  const { data: entry, error } = await (supabase as any).from('operation_entries').insert({
    cash_session_id: input.cash_session_id, entry_type: input.entry_type, entry_status: 'active',
    created_via: input.created_via || 'manual', direction: input.direction, title: input.title,
    description: input.description || null, amount: input.amount, payment_method: input.payment_method || null,
    source_type: 'manual', created_by: user.id,
  }).select('id').single()
  if (error) return { error: 'Error al registrar.' }
  revalidatePath('/caja')
  return { entry_id: entry.id }
}
