import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export type IntegrationFixtures = {
  supabase: SupabaseClient
  orgId: string
  empId: string
  svcId: string
  clientId: string
  aptId: string
  aptSvcId: string
  payrollPeriodId: string
  payrollItemId: string
}

export async function createFixtures(): Promise<IntegrationFixtures> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const orgId = randomUUID()
  const empId = randomUUID()
  const svcId = randomUUID()
  const clientId = randomUUID()
  const aptId = randomUUID()
  const aptSvcId = randomUUID()
  const now = new Date().toISOString()
  const today = now.split('T')[0]

  const { error: orgErr } = await supabase.from('organizations').insert({
    id: orgId, name: `TEST-${orgId.slice(0, 8)}`,
    slug: `test-${orgId.slice(0, 8)}`, created_at: now,
  })
  if (orgErr) throw new Error(`create org: ${orgErr.message}`)

  const { error: empErr } = await supabase.from('employees').insert({
    id: empId, organization_id: orgId, name: 'Test Employee',
    percentage: 60, active: true,
    payment_type: 'porcentaje',
  })
  if (empErr) throw new Error(`create emp: ${empErr.message}`)

  const { error: svcErr } = await supabase.from('services').insert({
    id: svcId, name: 'Test Service', price: 50000,
    has_commission: true, active: true, organization_id: orgId,
    duration: 60,
  })
  if (svcErr) throw new Error(`create svc: ${svcErr.message}`)

  const { error: cliErr } = await supabase.from('clients').insert({
    id: clientId, name: 'Test Client', phone: '0000000000',
    organization_id: orgId,
  })
  if (cliErr) throw new Error(`create client: ${cliErr.message}`)

  const { error: aptErr } = await supabase.from('appointments').insert({
    id: aptId, organization_id: orgId, employee_id: empId,
    client_id: clientId, status: 'completed',
    confirmation_status: 'completed',
    is_commissionable: true, price_adjustment: 0,
    start_time: now, end_time: now,
  })
  if (aptErr) throw new Error(`create apt: ${aptErr.message}`)

  const { error: asErr } = await supabase.from('appointment_services').insert({
    id: aptSvcId, appointment_id: aptId, service_id: svcId,
  })
  if (asErr) throw new Error(`create apt_svc: ${asErr.message}`)

  const { data: period, error: ppErr } = await supabase
    .from('payroll_periods')
    .insert({
      organization_id: orgId, period: '2026-06',
      status: 'draft', total_employees: 0, total_gross_pay: 0, total_net_pay: 0,
    })
    .select('id')
    .single()
  if (ppErr) throw new Error(`create payroll_period: ${ppErr.message}`)

  const { data: item, error: piErr } = await supabase
    .from('payroll_items')
    .insert({
      payroll_period_id: period.id, employee_id: empId,
      contract_type: 'prestacion', payment_type: 'porcentaje',
      total_services: 0, gross_commission: 0, gross_pay: 0, net_pay: 0,
    })
    .select('id')
    .single()
  if (piErr) throw new Error(`create payroll_item: ${piErr.message}`)

  return {
    supabase, orgId, empId, svcId, clientId, aptId, aptSvcId,
    payrollPeriodId: period.id,
    payrollItemId: item.id,
  }
}

export async function destroyFixtures(f: IntegrationFixtures): Promise<void> {
  const { supabase, aptId, svcId, empId, orgId, clientId, payrollPeriodId } = f

  await supabase.from('period_commissions').delete().eq('appointment_id', aptId)
  await supabase.from('financial_events').delete().eq('entity_id', aptId)
  await supabase.from('payroll_items').delete().eq('payroll_period_id', payrollPeriodId)
  await supabase.from('payroll_periods').delete().eq('id', payrollPeriodId)
  await supabase.from('appointment_services').delete().eq('appointment_id', aptId)
  await supabase.from('appointments').delete().eq('id', aptId)
  await supabase.from('clients').delete().eq('id', clientId)
  await supabase.from('services').delete().eq('id', svcId)
  await supabase.from('employees').delete().eq('id', empId)
  await supabase.from('organizations').delete().eq('id', orgId)
}
