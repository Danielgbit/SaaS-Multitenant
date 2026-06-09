/**
 * Script de reparacion financiera (backfill).
 *
 * Genera payroll y comision faltantes para citas completadas.
 *
 * Uso:
 *   npx tsx scripts/backfill-missing-payroll.ts --dry-run   (solo reporta)
 *   npx tsx scripts/backfill-missing-payroll.ts --apply     (ejecuta)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
const envLines = fs.readFileSync(envPath, 'utf8').split('\n').filter(l => l.trim() && !l.startsWith('#'))
const env: Record<string, string> = {}
for (const line of envLines) {
  const eq = line.indexOf('=')
  if (eq > 0) env[line.substring(0, eq).trim()] = line.substring(eq + 1).trim()
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)

const args = process.argv.slice(2)
const isDryRun = !args.includes('--apply')

async function addAppointmentToPayroll(appointmentId: string) {
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

  if (aptErr || !appointment) return { success: false, error: 'Cita no encontrada' }
  const apt = appointment as any
  if (apt.status !== 'completed') return { success: false, error: 'No completada' }
  if (!apt.employee_id) return { success: false, error: 'Sin empleado' }

  const orgId = apt.organization_id as string
  const employeeId = apt.employee_id as string
  const d = new Date(apt.start_time)
  const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

  const serviceSupabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)

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

    if (periodErr) return { success: false, error: periodErr.message }
    periodRecord = newPeriod
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single()

  const emp = employee as unknown as { default_commission_rate: number | null; contract_type: string | null; payment_type: string | null }
  const defaultRate = emp?.default_commission_rate ?? 60

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

    if (itemErr) return { success: false, error: itemErr.message }
    item = newItem
  }

  let added = 0
  const appointmentServices = (apt.appointment_services ?? []) as any[]

  for (const as_ of appointmentServices) {
    const svc = as_.service
    if (!svc || !svc.has_commission) continue

    const price = svc.price ?? 0
    const { data: override } = await supabase
      .from('employee_services')
      .select('commission_rate')
      .eq('employee_id', employeeId)
      .eq('service_id', svc.id)
      .single()

    const rate = override?.commission_rate ?? defaultRate
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

  if (added === 0) return { success: true, data: { period_id: periodRecord.id, payroll_item_id: item.id, services_added: 0 } }

  const { data: rows } = await serviceSupabase
    .from('period_commissions')
    .select('commission_amount')
    .eq('payroll_item_id', item.id)

  const count = rows?.length ?? 0
  const grossCommission = rows?.reduce((sum: number, r: any) => sum + (r.commission_amount ?? 0), 0) ?? 0

  const { data: pItem } = await serviceSupabase
    .from('payroll_items')
    .select('base_salary, total_deductions, transport_subsidy_amount, loans_deducted')
    .eq('id', item.id)
    .single()

  const baseSalary = pItem?.base_salary ?? 0
  const deductions = pItem?.total_deductions ?? 0
  const transport = pItem?.transport_subsidy_amount ?? 0
  const loans = pItem?.loans_deducted ?? 0
  const grossPay = grossCommission + baseSalary + transport
  const netPay = grossPay - deductions - loans

  await serviceSupabase
    .from('payroll_items')
    .update({
      total_services: count,
      gross_commission: grossCommission,
      gross_pay: grossPay,
      net_pay: netPay,
      updated_at: new Date().toISOString(),
    })
    .eq('id', item.id)

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

  return { success: true, data: { period_id: periodRecord.id, payroll_item_id: item.id, services_added: added } }
}

async function recordCommissionAccrual(appointmentId: string, organizationId: string, idempotencyKey: string) {
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, employee_id, is_commissionable')
    .eq('id', appointmentId)
    .single()

  if (!appointment || !appointment.is_commissionable || !appointment.employee_id) {
    return { error: 'Cita no comisionable o sin empleado' }
  }

  const { data: services } = await supabase
    .from('appointment_services')
    .select(`id, service_id, services ( id, name, price, has_commission )`)
    .eq('appointment_id', appointmentId)

  const serviceRows = (services || []) as any[]
  const { data: employee } = await supabase
    .from('employees')
    .select('percentage')
    .eq('id', appointment.employee_id)
    .single()

  const defaultRate = (employee as any)?.percentage ?? 60

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

    const eventKey = `${idempotencyKey}_${row.id}`

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

    if (txError) return { error: `Error al registrar comision para ${svc.name}` }
  }

  return { success: true }
}

async function main() {
  console.log(`=== BACKFINANCIAL ${isDryRun ? 'DRY-RUN' : 'APPLY'} ===\n`)

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, status, confirmation_status, completed_at, completed_by, start_time, employee_id, organization_id, price_adjustment')
    .eq('status', 'completed')

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  const toFix: any[] = []

  for (const apt of appointments || []) {
    const { count: payrollCount } = await supabase
      .from('period_commissions')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_id', apt.id)

    const { count: commissionCount } = await supabase
      .from('financial_events')
      .select('*', { count: 'exact', head: true })
      .eq('entity_id', apt.id)
      .eq('event_type', 'commission_accrued')

    if ((payrollCount ?? 0) === 0 || (commissionCount ?? 0) === 0) {
      toFix.push({
        ...apt,
        needsPayroll: (payrollCount ?? 0) === 0,
        needsCommission: (commissionCount ?? 0) === 0,
      })
    }
  }

  if (toFix.length === 0) {
    console.log('No hay citas que reparar.')
    return
  }

  console.log(`Citas a reparar: ${toFix.length}\n`)

  for (const apt of toFix) {
    console.log(`[${isDryRun ? 'DRY-RUN' : 'APPLY'}] ${apt.id.substring(0, 8)} | by:${apt.completed_by || 'system'} | payroll:${apt.needsPayroll} | commission:${apt.needsCommission}`)

    if (isDryRun) continue

    if (apt.needsPayroll && apt.employee_id) {
      const result = await addAppointmentToPayroll(apt.id)
      console.log(`  Payroll: ${result.success ? 'OK' : `FAIL (${result.error})`}`)
    }

    if (apt.needsCommission) {
      const result = await recordCommissionAccrual(
        apt.id,
        apt.organization_id,
        `backfill_${apt.id}`
      )
      console.log(`  Commission: ${('success' in result) ? 'OK' : `FAIL (${result.error})`}`)
    }

    console.log('')
  }

  if (isDryRun) {
    console.log('\nEste fue un DRY-RUN. Para aplicar cambios:')
    console.log('  npx tsx scripts/backfill-missing-payroll.ts --apply')
  } else {
    console.log('\nBackfill completado.')
  }
}

main().catch(console.error)
