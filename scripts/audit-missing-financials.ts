/**
 * Script de auditoría financiera.
 *
 * Identifica citas completadas que carecen de:
 * - period_commissions (payroll)
 * - financial_events (commission_accrued)
 * - operation_entries (cash entry)
 *
 * Uso:
 *   npx tsx scripts/audit-missing-financials.ts
 */

import { createClient } from '@/lib/supabase/server'

type ReportRow = {
  appointment_id: string
  completed_by: string
  completed_at: string | null
  start_time: string
  has_payroll: boolean
  has_commission: boolean
  has_cash_entry: boolean
  risk: 'payroll' | 'commission' | 'cash' | 'total' | 'none'
}

async function audit() {
  const supabase = await createClient()

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, status, confirmation_status, completed_at, completed_by, start_time, employee_id, organization_id')
    .eq('status', 'completed')

  if (error) {
    console.error('Error fetching appointments:', error)
    process.exit(1)
  }

  const report: ReportRow[] = []

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

    const { count: cashCount } = await supabase
      .from('operation_entries')
      .select('*', { count: 'exact', head: true })
      .eq('source_id', apt.id)
      .eq('source_type', 'appointment')

    const hasPayroll = (payrollCount ?? 0) > 0
    const hasCommission = (commissionCount ?? 0) > 0
    const hasCash = (cashCount ?? 0) > 0

    let risk: ReportRow['risk'] = 'none'
    if (!hasPayroll && !hasCommission && !hasCash) risk = 'total'
    else if (!hasPayroll) risk = 'payroll'
    else if (!hasCommission) risk = 'commission'
    else if (!hasCash) risk = 'cash'

    report.push({
      appointment_id: apt.id,
      completed_by: apt.completed_by || 'system',
      completed_at: apt.completed_at,
      start_time: apt.start_time,
      has_payroll: hasPayroll,
      has_commission: hasCommission,
      has_cash_entry: hasCash,
      risk,
    })
  }

  const totalAppointments = (appointments || []).length
  const withPayroll = report.filter(r => r.has_payroll).length
  const withCommission = report.filter(r => r.has_commission).length
  const withCash = report.filter(r => r.has_cash_entry).length
  const missingPayroll = report.filter(r => !r.has_payroll).length
  const missingCommission = report.filter(r => !r.has_commission).length
  const missingCash = report.filter(r => !r.has_cash_entry).length

  console.log('=== AUDITORÍA FINANCIERA DE CITAS COMPLETADAS ===\n')
  console.log(`Total citas completadas: ${totalAppointments}`)
  console.log(`Con payroll: ${withPayroll}`)
  console.log(`Con comisión: ${withCommission}`)
  console.log(`Con caja: ${withCash}`)
  console.log('')
  console.log(`⚠️  Sin payroll: ${missingPayroll}`)
  console.log(`⚠️  Sin comisión: ${missingCommission}`)
  console.log(`⚠️  Sin caja: ${missingCash}`)
  console.log('')
  console.log('=== DETALLE DE CITAS CON RIESGO ===\n')

  const atRisk = report.filter(r => r.risk !== 'none')
  if (atRisk.length === 0) {
    console.log('✅ Todas las citas completadas tienen payroll, comisión y caja registrados.')
  } else {
    for (const r of atRisk) {
      console.log(`${r.appointment_id}`)
      console.log(`  completed_by: ${r.completed_by}`)
      console.log(`  completed_at: ${r.completed_at || 'N/A'}`)
      console.log(`  payroll: ${r.has_payroll ? '✅' : '❌'}`)
      console.log(`  commission: ${r.has_commission ? '✅' : '❌'}`)
      console.log(`  cash_entry: ${r.has_cash_entry ? '✅' : '❌'}`)
      console.log(`  risk: ${r.risk}`)
      console.log('')
    }
  }

  console.log('=== RESUMEN POR RIESGO ===\n')
  const riskCounts = report.reduce((acc, r) => {
    acc[r.risk] = (acc[r.risk] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  for (const [risk, count] of Object.entries(riskCounts)) {
    console.log(`${risk}: ${count}`)
  }
}

audit().catch((e) => {
  console.error('Audit failed:', e)
  process.exit(1)
})
