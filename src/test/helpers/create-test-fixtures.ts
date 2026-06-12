import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export type IntegrationFixtures = {
  supabase: SupabaseClient
  orgId: string
  empId: string
  svcId: string
  svc2Id: string
  clientId: string
  aptId: string
  pendingAptId: string
  confirmedAptId: string
  cancelledAptId: string
  noShowAptId: string
  aptSvcId: string
  invItemId1: string
  invItemId2: string
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
  const svc2Id = randomUUID()
  const pendingAptId = randomUUID()
  const confirmedAptId = randomUUID()
  const cancelledAptId = randomUUID()
  const noShowAptId = randomUUID()
  const invItemId1 = randomUUID()
  const invItemId2 = randomUUID()
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

  const { error: svc2Err } = await supabase.from('services').insert({
    id: svc2Id, name: 'Test Service 2', price: 75000,
    has_commission: true, active: true, organization_id: orgId,
    duration: 45,
  })
  if (svc2Err) throw new Error(`create svc2: ${svc2Err.message}`)

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

  const { error: pendingAptErr } = await supabase.from('appointments').insert({
    id: pendingAptId, organization_id: orgId, employee_id: empId,
    client_id: clientId, status: 'pending',
    confirmation_status: 'scheduled',
    is_commissionable: true, price_adjustment: 0,
    start_time: now, end_time: now,
  })
  if (pendingAptErr) throw new Error(`create pendingApt: ${pendingAptErr.message}`)

  const { error: confirmedAptErr } = await supabase.from('appointments').insert({
    id: confirmedAptId, organization_id: orgId, employee_id: empId,
    client_id: clientId, status: 'confirmed',
    confirmation_status: 'confirmed',
    is_commissionable: true, price_adjustment: 0,
    start_time: now, end_time: now,
  })
  if (confirmedAptErr) throw new Error(`create confirmedApt: ${confirmedAptErr.message}`)

  const { error: cancelledAptErr } = await supabase.from('appointments').insert({
    id: cancelledAptId, organization_id: orgId, employee_id: empId,
    client_id: clientId, status: 'cancelled',
    confirmation_status: 'scheduled',
    is_commissionable: false, price_adjustment: 0,
    start_time: now, end_time: now,
  })
  if (cancelledAptErr) throw new Error(`create cancelledApt: ${cancelledAptErr.message}`)

  const { error: noShowAptErr } = await supabase.from('appointments').insert({
    id: noShowAptId, organization_id: orgId, employee_id: empId,
    client_id: clientId, status: 'no_show',
    confirmation_status: 'needs_review',
    is_commissionable: true, price_adjustment: 0,
    start_time: now, end_time: now,
  })
  if (noShowAptErr) throw new Error(`create noShowApt: ${noShowAptErr.message}`)

  const { error: asErr } = await supabase.from('appointment_services').insert({
    id: aptSvcId, appointment_id: aptId, service_id: svcId,
  })
  if (asErr) throw new Error(`create apt_svc: ${asErr.message}`)

  const { error: inv1Err } = await supabase.from('inventory_items').insert({
    id: invItemId1, organization_id: orgId,
    name: `TEST-Product-${invItemId1.slice(0, 8)}`,
    sku: `TEST-SKU-${invItemId1.slice(0, 8)}`,
    quantity: 50, min_quantity: 10,
    price: 25.99, cost_price: 15.00,
    unit: 'pieza', active: true,
  })
  if (inv1Err) throw new Error(`create invItem1: ${inv1Err.message}`)

  const { error: inv2Err } = await supabase.from('inventory_items').insert({
    id: invItemId2, organization_id: orgId,
    name: `TEST-Product-LowStock-${invItemId2.slice(0, 8)}`,
    sku: `TEST-SKU-LOW-${invItemId2.slice(0, 8)}`,
    quantity: 3, min_quantity: 10,
    price: 99.99, cost_price: 60.00,
    unit: 'pieza', active: true, category: 'Test Category',
  })
  if (inv2Err) throw new Error(`create invItem2: ${inv2Err.message}`)

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
    supabase, orgId, empId, svcId, svc2Id, clientId, aptId,
    pendingAptId, confirmedAptId, cancelledAptId, noShowAptId,
    aptSvcId, invItemId1, invItemId2,
    payrollPeriodId: period.id,
    payrollItemId: item.id,
  }
}

export async function destroyFixtures(f: IntegrationFixtures): Promise<void> {
  const { supabase, aptId, pendingAptId, confirmedAptId, cancelledAptId, noShowAptId, svcId, svc2Id, empId, orgId, clientId, payrollPeriodId, invItemId1, invItemId2 } = f

  const allAptIds = [aptId, pendingAptId, confirmedAptId, cancelledAptId, noShowAptId]

  await supabase.from('period_commissions').delete().in('appointment_id', allAptIds)
  await supabase.from('financial_events').delete().in('entity_id', allAptIds)
  await supabase.from('payroll_items').delete().eq('payroll_period_id', payrollPeriodId)
  await supabase.from('payroll_periods').delete().eq('id', payrollPeriodId)
  await supabase.from('appointment_services').delete().in('appointment_id', allAptIds)
  await supabase.from('appointments').delete().in('id', allAptIds)
  await supabase.from('clients').delete().eq('id', clientId)
  await supabase.from('services').delete().in('id', [svcId, svc2Id])
  await supabase.from('inventory_items').delete().in('id', [invItemId1, invItemId2])
  await supabase.from('employees').delete().eq('id', empId)
  await supabase.from('organizations').delete().eq('id', orgId)
}

// =========================================================================================
// Appointment-with-offset helper — positions appointments in/out of cron's query windows
// =========================================================================================

export type CreateAppointmentWithEndTimeInput = {
  organizationId: string
  employeeId: string
  clientId: string
  serviceId: string
  /** Minutes from "now" for the appointment's end_time.
   *  Positive = future, negative = past. */
  endTimeOffsetMinutes: number
  confirmationStatus: 'scheduled' | 'confirmed' | 'needs_review' | 'completed'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  durationMinutes?: number
  /** When true (default), also provisions:
   *  1. a real auth.users row,
   *  2. links it to the employee (employees.user_id),
   *  3. an organization_members row with role='owner'. */
  includeUserAndMember?: boolean
}

export type CreatedAppointmentWithEndTime = {
  appointmentId: string
  appointmentServiceId: string
  userId: string
  organizationMemberId: string
}

/**
 * Creates an appointment whose end_time is offset by N minutes from "now",
 * enabling tests to position the row in/out of the cron's query windows:
 *   • endTimeOffsetMinutes ∈ [4, 5]  → reminder window (Phase 1)
 *   • endTimeOffsetMinutes ≈ -60     → alert window (Phase 2)
 *   • endTimeOffsetMinutes ≤ -120    → auto-complete window (Phase 3)
 *
 * By default (includeUserAndMember !== false), also provisions:
 *   1. A real auth.users row
 *   2. Links it to the employee (employees.user_id) — NOTE: overwrites any
 *      prior user_id on the employee. If the same fixture is used in
 *      multiple test calls, only the most recent userId is retained on
 *      the employee; prior organization_members rows persist until
 *      cleanupAppointmentsAndUsers removes them.
 *   3. An organization_members row with role='owner' so the cron can
 *      send notifications to that user.
 *
 * IMPORTANT — appointment_services is a pure pivot:
 *   Columns are only (id, appointment_id, service_id). Do NOT add price.
 *   The service price is resolved at runtime via JOIN with services.
 */
export async function createAppointmentWithEndTime(
  supabase: SupabaseClient,
  input: CreateAppointmentWithEndTimeInput
): Promise<CreatedAppointmentWithEndTime> {
  const {
    organizationId,
    employeeId,
    clientId,
    serviceId,
    endTimeOffsetMinutes,
    confirmationStatus,
    status,
    durationMinutes = 60,
    includeUserAndMember = true,
  } = input

  const appointmentId = randomUUID()
  const appointmentServiceId = randomUUID()
  const organizationMemberId = randomUUID()

  const endTime = new Date(Date.now() + endTimeOffsetMinutes * 60 * 1000)
  const startTime = new Date(endTime.getTime() - durationMinutes * 60 * 1000)

  // Optionally provision auth.users + link to employee + org member
  let userId = ''

  if (includeUserAndMember) {
    const email = `test-${randomUUID().slice(0, 8)}@test.local`

    const { data: created, error: userErr } = await supabase.auth.admin.createUser({
      email,
      password: 'Test12345!',
      email_confirm: true,
    })
    if (userErr) throw new Error(`createUser: ${userErr.message}`)
    userId = created.user!.id

    const { error: linkErr } = await supabase
      .from('employees')
      .update({ user_id: userId })
      .eq('id', employeeId)
    if (linkErr) throw new Error(`link employee.user_id: ${linkErr.message}`)

    const { error: memberErr } = await supabase.from('organization_members').insert({
      id: organizationMemberId,
      organization_id: organizationId,
      user_id: userId,
      role: 'owner',
    })
    if (memberErr) throw new Error(`create org_member: ${memberErr.message}`)
  }

  // Insert the appointment
  const { error: aptErr } = await supabase.from('appointments').insert({
    id: appointmentId,
    organization_id: organizationId,
    employee_id: employeeId,
    client_id: clientId,
    status,
    confirmation_status: confirmationStatus,
    is_commissionable: true,
    price_adjustment: 0,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
  })
  if (aptErr) throw new Error(`create appointment: ${aptErr.message}`)

  // Insert the pivot row (pure pivot, no price column)
  const { error: aptSvcErr } = await supabase.from('appointment_services').insert({
    id: appointmentServiceId,
    appointment_id: appointmentId,
    service_id: serviceId,
  })
  if (aptSvcErr) throw new Error(`create appointment_service: ${aptSvcErr.message}`)

  return {
    appointmentId,
    appointmentServiceId,
    userId,
    organizationMemberId,
  }
}

// =========================================================================================
// cleanupAppointmentsAndUsers — Reverse cleanup for time-windowed appointments
// =========================================================================================
//
// destroyFixtures() only knows about the 5 base appointments it created.
// Appointments created via createAppointmentWithEndTime() live outside
// that graph and must be torn down explicitly. Order of operations
// (respects FK dependencies from child → parent):
//
//   1. period_commissions   (FK → appointments, no CASCADE)
//   2. financial_events     (FK → appointments via entity_id, no CASCADE)
//   3. appointments         (CASCADEs to appointment_services + confirmation_logs)
//   4. auth.users           (CASCADEs to organization_members + notifications,
//                            SET NULL on employees.user_id)
//
// Failures are logged, not thrown — cleanup must be best-effort.

export async function cleanupAppointmentsAndUsers(
  supabase: SupabaseClient,
  appointmentIds: string[],
  userIds: string[]
): Promise<void> {
  // 1. period_commissions — FK to appointments, no CASCADE.
  for (const aptId of appointmentIds) {
    try {
      await supabase.from('period_commissions').delete().eq('appointment_id', aptId)
    } catch (e) {
      console.error(`[cleanup] period_commissions delete failed for ${aptId}:`, e)
    }
  }

  // 2. financial_events — FK to appointments via entity_id, no CASCADE.
  for (const aptId of appointmentIds) {
    try {
      await supabase.from('financial_events').delete().eq('entity_id', aptId)
    } catch (e) {
      console.error(`[cleanup] financial_events delete failed for ${aptId}:`, e)
    }
  }

  // 3. appointments — CASCADEs to appointment_services + confirmation_logs.
  for (const aptId of appointmentIds) {
    try {
      await supabase.from('appointments').delete().eq('id', aptId)
    } catch (e) {
      console.error(`[cleanup] appointment delete failed for ${aptId}:`, e)
    }
  }

  // 4. auth.users — CASCADEs to organization_members + notifications;
  // SET NULL on employees.user_id. Must run AFTER appointments deletion.
  for (const userId of userIds) {
    try {
      await supabase.auth.admin.deleteUser(userId)
    } catch (e) {
      console.error(`[cleanup] deleteUser failed for ${userId}:`, e)
    }
  }
}
