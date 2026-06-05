'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateColombia } from '@/lib/utils/colombia-dates'
import { z } from 'zod'
import { coerceMinNumber } from '@/schemas/common'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

const OpenSessionSchema = z.object({
  organization_id: z.string().uuid(),
  opening_cash: coerceMinNumber(0, { message: 'Monto inicial >= 0' }),
  notes: z.string().max(500).optional().nullable(),
})

export async function openSession(input: { organization_id: string; opening_cash: number; notes?: string | null }): Promise<{ success: boolean; error?: string; session_id?: string }> {
  const parsed = OpenSessionSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const supabase = await createClient()

  const access = await requireOrgAccess(parsed.data.organization_id, ['owner', 'admin', 'staff'])
  if (!access.success) return access

  const today = getTodayDateColombia()
  const { data: existing } = await supabase.from('cash_sessions').select('id').eq('organization_id', parsed.data.organization_id).eq('session_date', today).eq('status', 'open').maybeSingle()
  if (existing) return { success: false, error: 'Ya hay caja abierta.' }

  const { opening_cash, notes } = parsed.data
  const { data: session, error } = await supabase.from('cash_sessions').insert({ organization_id: parsed.data.organization_id, session_date: today, opened_by: access.context.userId, opening_cash, notes: notes || null }).select('id').single()
  if (error) return { success: false, error: 'Error al abrir.' }
  revalidatePath('/caja')
  return { success: true, session_id: session.id }
}
