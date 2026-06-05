'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

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

  const { data: entry } = await supabase.from('operation_entries').select('id, cash_session_id, entry_status, source_type').eq('id', parsed.data.entry_id).single()
  if (!entry) return { error: 'Movimiento no encontrado.' }
  if (entry.entry_status !== 'active') return { error: 'Ya anulado.' }

  const { data: session } = await supabase.from('cash_sessions').select('organization_id, status').eq('id', entry.cash_session_id).single()
  if (!session) return { error: 'Sesion no encontrada.' }
  if (session.status !== 'open') return { error: 'No en caja cerrada.' }

  const access = await requireOrgAccess(session.organization_id, ['owner', 'admin'])
  if (!access.success) return { error: access.error }

  // Owner-only para entries automáticas, admin+owner para manuales
  const isAutomaticEntry = entry.source_type !== 'manual'
  if (isAutomaticEntry && access.context.role !== 'owner') {
    return { error: 'Solo owner.' }
  }

  await supabase.from('operation_entries').update({
    entry_status: 'voided', voided_by: access.context.userId, voided_at: new Date().toISOString(), void_reason: parsed.data.reason,
  }).eq('id', parsed.data.entry_id)
  revalidatePath('/caja')
  return {}
}
