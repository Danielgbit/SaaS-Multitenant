'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

interface AddToPayrollResult {
  success: boolean
  data?: {
    period_id: string
    payroll_item_id: string
    services_added: number
  }
  error?: string
}

async function getCommissionRate(
  supabase: any,
  employeeId: string,
  serviceId: string,
  defaultRate: number
): Promise<number> {
  const { data: override } = await supabase
    .from('employee_services')
    .select('commission_rate')
    .eq('employee_id', employeeId)
    .eq('service_id', serviceId)
    .single()

  return override?.commission_rate ?? defaultRate ?? 60
}

async function recalcPayrollItemTotals(supabase: any, itemId: string) {
  const { data: rows } = await supabase
    .from('period_commissions')
    .select('commission_amount')
    .eq('payroll_item_id', itemId)

  const count = rows?.length ?? 0
  const grossCommission =
    rows?.reduce((sum: number, r: any) => sum + (r.commission_amount ?? 0), 0) ?? 0

  const { data: item } = await supabase
    .from('payroll_items')
    .select('base_salary, total_deductions, transport_subsidy_amount, loans_deducted')
    .eq('id', itemId)
    .single()

  const baseSalary = item?.base_salary ?? 0
  const deductions = item?.total_deductions ?? 0
  const transport = item?.transport_subsidy_amount ?? 0
  const loans = item?.loans_deducted ?? 0
  const grossPay = grossCommission + baseSalary + transport
  const netPay = grossPay - deductions - loans

  await supabase
    .from('payroll_items')
    .update({
      total_services: count,
      gross_commission: grossCommission,
      gross_pay: grossPay,
      net_pay: netPay,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path)
  } catch {
    // noop
  }
}

export async function addAppointmentToPayroll(
  appointmentId: string
): Promise<AddToPayrollResult> {
  const parsed = z.string().uuid().safeParse(appointmentId)
  if (!parsed.success) {
    return { success: false, error: 'ID de cita inválido' }
  }

  const supabase = await createClient()

  const { data: appointment, error: aptErr } = await supabase
    .from('appointments')
    .select(`
      id, organization_id, employee_id, start_time, is_commissionable, status,
      appointment_services (
        id, service_id,
        service:services (
          id, name, price, has_commission
        )
      )
    `)
    .eq('id', appointmentId)
    .single()

  if (aptErr || !appointment) {
    return { success: false, error: 'Cita no encontrada' }
  }

  const apt = appointment as any

  if (apt.status !== 'completed') {
    return { success: false, error: 'La cita no está completada' }
  }
  if (!apt.employee_id) {
    return { success: false, error: 'Cita sin empleado asignado' }
  }
  if (!apt.is_commissionable) {
    return { success: false, error: 'Cita no es comisionable' }
  }

  const orgId = apt.organization_id as string
  const employeeId = apt.employee_id as string

  // ── Período YYYY-MM desde start_time ────────────────
  const d = new Date(apt.start_time)
  const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

  // Service role client para bypass RLS en escrituras
  const serviceSupabase = await createServiceRoleClient()

  // ── UPSERT payroll_period ───────────────────────────
  let { data: periodRecord } = await serviceSupabase
    .from('payroll_periods')
    .select('id, status')
    .eq('organization_id', orgId)
    .eq('period', period)
    .single()

  if (!periodRecord) {
    const { data: newPeriod, error: periodErr } = await serviceSupabase
      .from('payroll_periods')
      .insert({
        organization_id: orgId,
        period,
        status: 'draft',
        total_employees: 0,
        total_gross_pay: 0,
        total_net_pay: 0,
      })
      .select('id, status')
      .single()

    if (periodErr) {
      return { success: false, error: periodErr.message }
    }
    periodRecord = newPeriod
  }

  // ── Datos del empleado ──────────────────────────────
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single()

  const emp = employee as unknown as { default_commission_rate: number | null; contract_type: string | null; payment_type: string | null }
  const defaultRate = emp?.default_commission_rate ?? 60

  // ── UPSERT payroll_item ─────────────────────────────
  let { data: item } = await serviceSupabase
    .from('payroll_items')
    .select('id')
    .eq('payroll_period_id', periodRecord.id)
    .eq('employee_id', employeeId)
    .single()

  if (!item) {
    const { data: newItem, error: itemErr } = await serviceSupabase
      .from('payroll_items')
      .insert({
        payroll_period_id: periodRecord.id,
        employee_id: employeeId,
        contract_type: emp?.contract_type ?? 'prestacion',
        payment_type: emp?.payment_type ?? 'porcentaje',
        total_services: 0,
        gross_commission: 0,
        gross_pay: 0,
        net_pay: 0,
      })
      .select('id')
      .single()

    if (itemErr) {
      return { success: false, error: itemErr.message }
    }
    item = newItem
  }

  // ── Insertar period_commissions por cada servicio ───
  let added = 0
  const appointmentServices = (apt.appointment_services ?? []) as any[]

  for (const as_ of appointmentServices) {
    const svc = as_.service
    if (!svc || !svc.has_commission) continue

    const price = svc.price ?? 0
    const rate = await getCommissionRate(supabase, employeeId, svc.id, defaultRate)
    const commissionAmount = Number((price * (rate / 100)).toFixed(2))

    const { error: insertErr } = await serviceSupabase
      .from('period_commissions')
      .upsert(
        {
          payroll_item_id: item.id,
          appointment_id: appointmentId,
          appointment_service_id: as_.id,
          service_id: svc.id,
          service_date: d.toISOString().split('T')[0],
          service_name: svc.name,
          service_value: price,
          percentage_applied: rate,
          commission_amount: commissionAmount,
        },
        {
          onConflict: 'payroll_item_id, appointment_id, service_id',
          ignoreDuplicates: true,
        }
      )

    if (!insertErr) added++
  }

  if (added === 0) {
    return {
      success: true,
      data: { period_id: periodRecord.id, payroll_item_id: item.id, services_added: 0 },
    }
  }

  // ── Recalcular payroll_item ─────────────────────────
  await recalcPayrollItemTotals(serviceSupabase, item.id)

  // ── Recalcular payroll_period ───────────────────────
  const { data: items } = await serviceSupabase
    .from('payroll_items')
    .select('gross_pay, net_pay, total_deductions, transport_subsidy_amount')
    .eq('payroll_period_id', periodRecord.id)

  const totalEmployees = items?.length ?? 0
  const totalGross = items?.reduce((s: number, i: any) => s + (i.gross_pay ?? 0), 0) ?? 0
  const totalNet = items?.reduce((s: number, i: any) => s + (i.net_pay ?? 0), 0) ?? 0
  const totalDed = items?.reduce((s: number, i: any) => s + (i.total_deductions ?? 0), 0) ?? 0
  const totalTrans = items?.reduce((s: number, i: any) => s + (i.transport_subsidy_amount ?? 0), 0) ?? 0

  await serviceSupabase
    .from('payroll_periods')
    .update({
      total_employees: totalEmployees,
      total_gross_pay: totalGross,
      total_deductions: totalDed,
      total_transport_subsidy: totalTrans,
      total_net_pay: totalNet,
    })
    .eq('id', periodRecord.id)

  safeRevalidate('/payroll')

  return {
    success: true,
    data: { period_id: periodRecord.id, payroll_item_id: item.id, services_added: added },
  }
}
