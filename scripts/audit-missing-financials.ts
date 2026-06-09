/**
 * Script de auditoria financiera.
 *
 * Identifica citas completadas que no tienen:
 * - period_commissions (payroll)
 * - financial_events (comision)
 * - operation_entries (caja)
 *
 * Uso: npx tsx scripts/audit-missing-financials.ts
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

type ReportRow = {
  appointment_id: string
  completed_by: string
  completed_at: string | null
  has_payroll: boolean
  has_commission: boolean
  has_cash_entry: boolean
  risk: 'payroll' | 'commission' | 'cash' | 'total' | 'none'
  price: number
}

async function main() {
  console.log('=== AUDITORIA FINANCIERA ===\n')

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, status, confirmation_status, completed_at, completed_by, start_time, employee_id, organization_id, price_adjustment')
    .eq('status', 'completed')

  if (error) {
    console.error('Error fetching appointments:', error)
    process.exit(1)
  }

  if (!appointments || appointments.length === 0) {
    console.log('No hay citas completadas.')
    return
  }

  const report: ReportRow[] = []

  for (const apt of appointments) {
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

    const price = apt.price_adjustment ?? 0

    let risk: ReportRow['risk'] = 'none'
    if (!hasPayroll && !hasCommission && !hasCash) risk = 'total'
    else if (!hasPayroll && !hasCommission) risk = 'payroll'
    else if (!hasCommission) risk = 'commission'
    else if (!hasCash) risk = 'cash'

    report.push({
      appointment_id: apt.id,
      completed_by: apt.completed_by || 'system',
      completed_at: apt.completed_at,
      has_payroll: hasPayroll,
      has_commission: hasCommission,
      has_cash_entry: hasCash,
      risk,
      price,
    })
  }

  const totalCompleted = appointments.length
  const withPayroll = report.filter(r => r.has_payroll).length
  const withCommission = report.filter(r => r.has_commission).length
  const withCash = report.filter(r => r.has_cash_entry).length
  const missingPayroll = report.filter(r => !r.has_payroll)
  const missingCommission = report.filter(r => !r.has_commission)
  const missingCash = report.filter(r => !r.has_cash_entry)
  const atRisk = report.filter(r => r.risk !== 'none')

  console.log(`Total citas completadas: ${totalCompleted}`)
  console.log(`Con payroll: ${withPayroll}`)
  console.log(`Con comision: ${withCommission}`)
  console.log(`Con caja: ${withCash}`)
  console.log(`Sin payroll (BUG): ${missingPayroll.length}`)
  console.log(`Sin comision (BUG): ${missingCommission.length}`)
  console.log(`Sin caja: ${missingCash.length}`)
  console.log(`En riesgo: ${atRisk.length}`)

  const totalAtRiskPrice = atRisk.reduce((s, r) => s + r.price, 0)
  const estimatedCommissionLoss = totalAtRiskPrice * 0.6
  console.log(`\nPrecio total en riesgo: $${totalAtRiskPrice.toLocaleString('es-CO')} COP`)
  console.log(`Comision estimada perdida (60%): $${estimatedCommissionLoss.toLocaleString('es-CO')} COP`)

  console.log('\n=== DETALLE ===')
  for (const r of report) {
    if (r.risk !== 'none') {
      console.log(
        `${r.appointment_id.substring(0, 8)} | by:${r.completed_by} | ` +
        `payroll:${r.has_payroll} | commission:${r.has_commission} | ` +
        `cash:${r.has_cash_entry} | risk:${r.risk} | price:$${r.price}`
      )
    }
  }

  console.log('\n=== RESUMEN POR ORIGEN ===')
  const byOrigin: Record<string, { total: number; missingPayroll: number; missingCommission: number }> = {}
  for (const r of report) {
    if (!byOrigin[r.completed_by]) {
      byOrigin[r.completed_by] = { total: 0, missingPayroll: 0, missingCommission: 0 }
    }
    byOrigin[r.completed_by].total++
    if (!r.has_payroll) byOrigin[r.completed_by].missingPayroll++
    if (!r.has_commission) byOrigin[r.completed_by].missingCommission++
  }
  for (const [origin, stats] of Object.entries(byOrigin)) {
    console.log(`${origin}: ${stats.total} total, ${stats.missingPayroll} sin payroll, ${stats.missingCommission} sin comision`)
  }
}

main().catch(console.error)
