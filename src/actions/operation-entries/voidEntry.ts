'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const VoidEntrySchema = z.object({
  entry_id: z.string().uuid(),
  reason: z.string().min(1, 'Motivo requerido').max(500),
})

export async function voidEntry(input: { entry_id: string; reason: string }) {
  const parsed = VoidEntrySchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }

  const { data: entry } = await supabase.from('operation_entries').select('id, cash_session_id, entry_status, source_type').eq('id', parsed.data.entry_id).single()
  if (!entry) return { error: 'Movimiento no encontrado.' }
  if (entry.entry_status !== 'active') return { error: 'Ya anulado.' }

  const { data: session } = await supabase.from('cash_sessions').select('organization_id, status').eq('id', entry.cash_session_id).single()
  if (!session) return { error: 'Sesion no encontrada.' }
  if (session.status !== 'open') return { error: 'No en caja cerrada.' }

  const { data: member } = await supabase.from('organization_members').select('role').eq('user_id', user.id).eq('organization_id', session.organization_id).single()
  if (!member || !['owner', 'admin'].includes(member.role)) return { error: 'Sin permiso.' }
  if (entry.source_type !== 'manual' && member.role !== 'owner') return { error: 'Solo owner.' }

  await supabase.from('operation_entries').update({
    entry_status: 'voided', voided_by: user.id, voided_at: new Date().toISOString(), void_reason: parsed.data.reason,
  }).eq('id', parsed.data.entry_id)
  revalidatePath('/caja')
  return {}
}
