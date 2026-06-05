'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { coercePositiveNumber } from '@/schemas/common'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

const ManualEntrySchema = z.object({
  cash_session_id: z.string().uuid(),
  entry_type: z.enum(['expense', 'note', 'break', 'adjustment']),
  created_via: z.enum(['manual', 'system', 'payroll']).default('manual'),
  direction: z.enum(['in', 'out']),
  title: z.string().min(1, 'Título requerido').max(200),
  description: z.string().max(500).optional().nullable(),
  amount: coercePositiveNumber({ message: 'Monto debe ser > 0' }),
  payment_method: z.string().max(50).optional().nullable(),
})

export async function createManualEntry(input: { cash_session_id: string; entry_type: string; created_via?: string; direction: string; title: string; description?: string | null; amount: number; payment_method?: string | null }) {
  const parsed = ManualEntrySchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const supabase = await createClient()

  const { data: session } = await supabase.from('cash_sessions').select('organization_id, status').eq('id', parsed.data.cash_session_id).single()
  if (!session) return { error: 'Sesion no encontrada.' }
  if (session.status !== 'open') return { error: 'Caja cerrada.' }

  const access = await requireOrgAccess(session.organization_id, ['owner', 'admin', 'staff'])
  if (!access.success) return { error: access.error }

  const { cash_session_id, entry_type, created_via, direction, title, description, amount, payment_method } = parsed.data
  const { data: entry, error } = await supabase.from('operation_entries').insert({
    cash_session_id, entry_type, entry_status: 'active',
    created_via, direction, title,
    description: description || null, amount, payment_method: payment_method || null,
    source_type: 'manual', created_by: access.context.userId,
  }).select('id').single()
  if (error) return { error: 'Error al registrar.' }
  revalidatePath('/caja')
  return { entry_id: entry.id }
}
