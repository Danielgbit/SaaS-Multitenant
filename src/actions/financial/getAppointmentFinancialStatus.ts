'use server'

import { createClient } from '@/lib/supabase/server'
import type { FinancialEvent, FinancialEventStatus } from '@/types/financial'

export interface AppointmentFinancialStatus {
  appointmentId: string
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded' | 'credited'
  totalAmount: number
  amountPaid: number
  amountPending: number
  events: FinancialEvent[]
}

export async function getAppointmentFinancialStatus(
  appointmentId: string,
  organizationId: string
): Promise<AppointmentFinancialStatus> {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('financial_events')
    .select('*')
    .eq('entity_type', 'appointment')
    .eq('entity_id', appointmentId)
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: false })
    .limit(50)

  const financialEvents = (events || []) as unknown as FinancialEvent[]

  const payments = financialEvents.filter(
    e => e.event_type === 'payment_received' && e.status === 'settled'
  )
  const refunds = financialEvents.filter(
    e => e.event_type === 'refund_processed' && e.status === 'settled'
  )

  const amountPaid = payments.reduce((sum, e) => sum + e.amount, 0)
  const amountRefunded = refunds.reduce((sum, e) => sum + Math.abs(e.amount), 0)

  const { data: appointment } = await supabase
    .from('appointments')
    .select('payment_status')
    .eq('id', appointmentId)
    .single()

  const totalAmount = Math.max(
    amountPaid,
    ...financialEvents
      .filter(e => e.event_type === 'adjustment_applied')
      .map(e => Math.abs(e.amount))
  )

  return {
    appointmentId,
    paymentStatus: (appointment?.payment_status as AppointmentFinancialStatus['paymentStatus']) || 'unpaid',
    totalAmount,
    amountPaid: amountPaid - amountRefunded,
    amountPending: Math.max(0, totalAmount - (amountPaid - amountRefunded)),
    events: financialEvents,
  }
}
