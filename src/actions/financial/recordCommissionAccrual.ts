'use server'

import { createClient } from '@/lib/supabase/server'
import { assertValidSign } from '@/lib/financial/sign-utils'
import { appLog } from '@/lib/app-logger'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
const InputSchema = z.object({
  appointmentId: z.string().uuid(),
  organizationId: z.string().uuid(),
  idempotencyKey: z.string().optional(),
})

export async function recordCommissionAccrual(input: z.infer<typeof InputSchema>) {
  const parsed = InputSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Datos inválidos' }
  }

  const { appointmentId, organizationId, idempotencyKey } = parsed.data
  const supabase = await createClient()

  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, employee_id, is_commissionable')
    .eq('id', appointmentId)
    .single()

  if (!appointment || !appointment.is_commissionable || !appointment.employee_id) {
    return { error: 'Cita no comisionable o sin empleado' }
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('percentage')
    .eq('id', appointment.employee_id)
    .single()

  type ServiceJoinRow = {
    id: string
    service_id: string
    services: { id: string; name: string; price: number; has_commission: boolean } | null
  }

  const { data: services } = await supabase
    .from('appointment_services')
    .select(`
      id,
      service_id,
      services ( id, name, price, has_commission )
    `)
    .eq('appointment_id', appointmentId)

  const serviceRows: ServiceJoinRow[] = (services || []) as ServiceJoinRow[]
  const defaultRate = employee?.percentage ?? 60

  for (const row of serviceRows) {
    const svc = row.services
    if (!svc?.has_commission) continue

    const { data: override } = await supabase
      .from('employee_services')
      .select('commission_rate')
      .eq('employee_id', appointment.employee_id)
      .eq('service_id', svc.id)
      .single()

    const rate = override?.commission_rate ?? defaultRate
    const amount = Number(((svc.price * rate) / 100).toFixed(2)) * -1

    assertValidSign('commission_accrued', amount)

    const eventKey = idempotencyKey
      ? `${idempotencyKey}_${row.id}`
      : `comm_accrued_manual_${row.id}`

    const { error: txError } = await supabase
      .from('financial_events')
      .insert({
        organization_id: organizationId,
        event_type: 'commission_accrued',
        source_table: 'appointment_services',
        source_id: row.id,
        entity_type: 'appointment',
        entity_id: appointmentId,
        occurred_by_type: 'system',
        amount,
        currency: 'COP',
        idempotency_key: eventKey,
        status: 'settled',
        metadata: {
          service_id: svc.id,
          service_name: svc.name,
          service_price: svc.price,
          commission_rate: rate,
        },
        occurred_at: new Date().toISOString(),
      })

    if (txError) {
      appLog('error', '[recordCommissionAccrual] insert failed', {
        appointmentId,
        serviceId: svc.id,
        error: txError.message,
      })
      return { error: `Error al registrar comisión para ${svc.name}` }
    }
  }

  revalidatePath('/payroll')
  revalidatePath(`/payroll/${appointment.employee_id}`)

  return { success: true }
}
