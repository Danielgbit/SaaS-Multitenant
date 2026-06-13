// @vitest-environment node
//
// CRON-DB: runCheckReminders integration tests (real Supabase).
//
// Exercises the cron's three phases against a real Postgres instance:
//   Phase 1 — reminder        (end_time in [+4, +5] min, confirmation_status='scheduled')
//   Phase 2 — alert           (end_time <= -60 min,                confirmation_status='scheduled')
//   Phase 3 — auto-complete   (end_time <= -120 min,               confirmation_status='needs_review')
//
// Coverage:
//   CRON-DB-LIFECYCLE  — full reminder → auto-complete end-to-end in one run
//   CRON-DB-009        — confirmation_log with action='manually_set' and
//                        price_after=null emits commission_accrued (via trigger)
//                        but does NOT emit payment_received
//
// Skipped automatically when NEXT_PUBLIC_SUPABASE_URL or
// SUPABASE_SERVICE_ROLE_KEY are missing.

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import {
  createFixtures,
  destroyFixtures,
  createAppointmentWithEndTime,
  cleanupAppointmentsAndUsers,
  type IntegrationFixtures,
} from '@/test/helpers/create-test-fixtures'
import { runCheckReminders } from '@/actions/cron/runCheckReminders'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const describeDb = URL && KEY ? describe : describe.skip

describeDb('CRON-DB: runCheckReminders integration', () => {
  let f: IntegrationFixtures
  const createdUserIds: string[] = []
  const createdAppointmentIds: string[] = []

  beforeEach(async () => {
    f = await createFixtures()
    createdUserIds.length = 0
    createdAppointmentIds.length = 0
  })

  afterEach(async () => {
    if (f) {
      // Tear down appointments/users created by this test BEFORE destroying
      // the base fixtures (the base org/employee are required as FK targets).
      await cleanupAppointmentsAndUsers(f.supabase, createdAppointmentIds, createdUserIds)
      await destroyFixtures(f)
    }
  })

  describe('CRON-DB-LIFECYCLE: reminder → auto-complete end-to-end', () => {
    it('executes full lifecycle in a single test run', async () => {
      // Flush stale fixtures before creating test appointments
      await runCheckReminders(f.supabase)

      // ── PHASE 1: reminder (5 min before) ─────────────────────────
      const reminderApt = await createAppointmentWithEndTime(f.supabase, {
        organizationId: f.orgId,
        employeeId: f.empId,
        clientId: f.clientId,
        serviceId: f.svcId,
        endTimeOffsetMinutes: 4.5,
        confirmationStatus: 'scheduled',
        status: 'confirmed',
        durationMinutes: 60,
      })
      createdUserIds.push(reminderApt.userId)
      createdAppointmentIds.push(reminderApt.appointmentId)

      const reminderResult = await runCheckReminders(f.supabase)
      expect(reminderResult.success).toBe(true)
      expect(reminderResult.reminders).toBeGreaterThanOrEqual(1)
      expect(reminderResult.alerts).toBe(0)
      expect(reminderResult.autoCompleted).toBe(0)

      // ── PHASE 3: auto-complete (120 min after) ──────────────────
      const autoCompleteApt = await createAppointmentWithEndTime(f.supabase, {
        organizationId: f.orgId,
        employeeId: f.empId,
        clientId: f.clientId,
        serviceId: f.svcId,
        endTimeOffsetMinutes: -125,
        confirmationStatus: 'needs_review',
        status: 'confirmed',
        durationMinutes: 60,
      })
      createdUserIds.push(autoCompleteApt.userId)
      createdAppointmentIds.push(autoCompleteApt.appointmentId)

      const autoCompleteResult = await runCheckReminders(f.supabase)
      expect(autoCompleteResult.success).toBe(true)
      expect(autoCompleteResult.autoCompleted).toBeGreaterThanOrEqual(1)

      const { count: ownerNotifs } = await f.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', autoCompleteApt.userId)
        .eq('type', 'auto_completed')
      expect(ownerNotifs).toBeGreaterThanOrEqual(1)

      const { count: commissionEvents } = await f.supabase
        .from('financial_events')
        .select('*', { count: 'exact', head: true })
        .eq('entity_id', autoCompleteApt.appointmentId)
        .eq('event_type', 'commission_accrued')
      expect(commissionEvents).toBeGreaterThanOrEqual(1)

      const { count: paymentEvents } = await f.supabase
        .from('financial_events')
        .select('*', { count: 'exact', head: true })
        .eq('entity_id', autoCompleteApt.appointmentId)
        .eq('event_type', 'payment_received')
      expect(paymentEvents).toBe(0)
    }, 30000)
  })

  describe('CRON-DB-009: confirmation_log with price_after=null', () => {
    it('does NOT emit payment_received but DOES emit commission_accrued (manually_set)', async () => {
      const apt = await createAppointmentWithEndTime(f.supabase, {
        organizationId: f.orgId,
        employeeId: f.empId,
        clientId: f.clientId,
        serviceId: f.svcId,
        endTimeOffsetMinutes: -125,
        confirmationStatus: 'needs_review',
        status: 'confirmed',
      })
      createdUserIds.push(apt.userId)
      createdAppointmentIds.push(apt.appointmentId)

      const { error: logErr } = await f.supabase.from('confirmation_logs').insert({
        appointment_id: apt.appointmentId,
        organization_id: f.orgId,
        action: 'manually_set',
        performed_by: null,
        performed_by_role: 'system',
        price_before: null,
        price_after: null,
        notes: 'CRON-DB-009 test fixture',
      })
      expect(logErr).toBeNull()

      const { count: paymentEvents } = await f.supabase
        .from('financial_events')
        .select('*', { count: 'exact', head: true })
        .eq('entity_id', apt.appointmentId)
        .eq('event_type', 'payment_received')
      expect(paymentEvents).toBe(0)

      const { data: commissionEvent, error: commErr } = await f.supabase
        .from('financial_events')
        .select('id, amount, metadata')
        .eq('entity_id', apt.appointmentId)
        .eq('event_type', 'commission_accrued')
        .single()

      expect(commErr).toBeNull()
      expect(commissionEvent).not.toBeNull()
      expect(commissionEvent!.amount).toBeLessThan(0)
      expect(commissionEvent!.metadata).toHaveProperty('service_price')
    })
  })
})
