'use server'

import { createClient } from '@/lib/supabase/server'
import { getTodayDateColombia } from '@/lib/utils/colombia-dates'
import { ENTRY_GROUP_MAP } from '@/types/cash-sessions'
import type { EntryType, PaymentMethod, SourceType, CreatedVia } from '@/types/cash-sessions'

interface CreateEntryFromSourceInput {
  organization_id: string
  source_type: SourceType
  source_id?: string | null
  entry_type: EntryType
  direction: 'in' | 'out'
  amount: number
  payment_method?: PaymentMethod
  title?: string
  created_by?: string
  created_via?: CreatedVia
}

export async function createEntryFromSource(input: CreateEntryFromSourceInput) {
  const supabase = await createClient()

  const { data: session } = await (supabase as any)
    .from('cash_sessions')
    .select('id')
    .eq('organization_id', input.organization_id)
    .eq('session_date', getTodayDateColombia())
    .eq('status', 'open')
    .maybeSingle()

  if (!session) {
    console.warn('[createEntryFromSource] No hay caja abierta hoy')
    return { success: false, error: 'No hay caja abierta hoy' }
  }

  const { data, error } = await (supabase as any)
    .from('operation_entries')
    .insert({
      cash_session_id: session.id,
      entry_type: input.entry_type,
      entry_group: ENTRY_GROUP_MAP[input.entry_type] ?? null,
      direction: input.direction,
      title: input.title ?? '',
      amount: input.amount,
      payment_method: input.payment_method ?? null,
      source_type: input.source_type,
      source_id: input.source_id ?? null,
      created_via: input.created_via ?? 'manual',
      created_by: input.created_by ?? null,
      entry_status: 'active',
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}
