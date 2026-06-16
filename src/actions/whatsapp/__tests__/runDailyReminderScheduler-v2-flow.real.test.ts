// @vitest-environment node
//
// SCHED-V2-DB: runDailyReminderScheduler V2 branch integration tests (real Supabase).
//
// Exercises the scheduler's V1/V2 branch dispatching against a real Postgres instance.
// Each scenario creates fixtures, enables/disabled V2 flag, runs the scheduler, and
// asserts that the correct downstream was invoked (V1: sendWhatsAppReminder, V2:
// dispatchAppointmentReminder via notification_queue inserts).
//
// Skipped automatically when NEXT_PUBLIC_SUPABASE_URL or
// SUPABASE_SERVICE_ROLE_KEY are missing.

import { config } from 'dotenv'
import { resolve } from 'path'
import { randomUUID } from 'crypto'

config({ path: resolve(process.cwd(), '.env.local') })

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import {
  createFixtures,
  destroyFixtures,
  type IntegrationFixtures,
} from '@/test/helpers/create-test-fixtures'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const describeDb = URL && KEY ? describe : describe.skip

// Mock sendWhatsAppReminder to a no-op spy (we don't want real WhatsApp API calls).
// The orchestrator is real and produces notification_queue rows.
vi.mock('@/actions/whatsapp/sendWhatsAppReminder', () => ({
  sendWhatsAppReminder: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/notifications/providers', async () => {
  const actual = await vi.importActual<typeof import('@/lib/notifications/providers')>(
    '@/lib/notifications/providers',
  )
  return {
    ...actual,
    getWhatsappProviderOrgs: vi.fn(),
  }
})

import { runDailyReminderScheduler } from '@/actions/whatsapp/runDailyReminderScheduler'
import { sendWhatsAppReminder } from '@/actions/whatsapp/sendWhatsAppReminder'
import { getWhatsappProviderOrgs } from '@/lib/notifications/providers'

describeDb('SCHED-V2-DB: runDailyReminderScheduler V1/V2 dispatch', () => {
  let f: IntegrationFixtures

  beforeEach(async () => {
    f = await createFixtures()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    if (f) {
      // Clean up tables that the test populates but destroyFixtures doesn't manage
      await f.supabase.from('notification_queue').delete().eq('organization_id', f.orgId)
      await f.supabase.from('notification_events').delete().eq('organization_id', f.orgId)
      await f.supabase.from('notification_conversations').delete().eq('organization_id', f.orgId)
      await f.supabase.from('message_templates').delete().eq('organization_id', f.orgId)
      await f.supabase.from('automation_rules').delete().eq('organization_id', f.orgId)
      await f.supabase.from('notification_providers').delete().eq('organization_id', f.orgId)
      await f.supabase.from('booking_settings').delete().eq('organization_id', f.orgId)
      await destroyFixtures(f)
    }
  })

  it('V1 org (use_notification_v2=false): dispatches via sendWhatsAppReminder, no queue row', async () => {
    // Force V1: ensure booking_settings.use_notification_v2 is false
    await f.supabase
      .from('booking_settings')
      .upsert({
        organization_id: f.orgId,
        use_notification_v2: false,
        timezone: 'America/Bogota',
        reminder_hours_before: 24,
      })

    // Configure a whatsapp provider so getWhatsappProviderOrgs returns this org
    await f.supabase.from('notification_providers').insert({
      organization_id: f.orgId,
      channel: 'whatsapp',
      provider: 'meta',
      is_enabled: true,
      config: {},
    })

    // Insert an appointment for "tomorrow" so the scheduler picks it up
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)

    const aptId = randomUUID()
    await f.supabase.from('appointments').insert({
      id: aptId,
      organization_id: f.orgId,
      employee_id: f.empId,
      client_id: f.clientId,
      status: 'confirmed',
      confirmation_status: 'scheduled',
      is_commissionable: true,
      price_adjustment: 0,
      start_time: tomorrow.toISOString(),
      end_time: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(),
    })

    vi.mocked(getWhatsappProviderOrgs).mockResolvedValue([
      {
        organizationId: f.orgId,
        provider: 'meta',
        config: {},
        source: 'notification_providers',
      },
    ])

    const result = await runDailyReminderScheduler()

    expect(result.success).toBe(true)
    expect(result.processed).toBeGreaterThanOrEqual(1)
    expect(sendWhatsAppReminder).toHaveBeenCalledWith({ appointmentId: aptId })

    // V1 should NOT create notification_queue rows (those are V2-only)
    const { count: queueCount } = await f.supabase
      .from('notification_queue')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_id', aptId)
    expect(queueCount).toBe(0)

    // Cleanup the apt
    await f.supabase.from('appointments').delete().eq('id', aptId)
  }, 30000)

  it('V2 org (use_notification_v2=true): does NOT call sendWhatsAppReminder, but creates a notification_queue row when rule exists', async () => {
    // Force V2
    await f.supabase
      .from('booking_settings')
      .upsert({
        organization_id: f.orgId,
        use_notification_v2: true,
        timezone: 'America/Bogota',
        reminder_hours_before: 24,
      })

    await f.supabase.from('notification_providers').insert({
      organization_id: f.orgId,
      channel: 'whatsapp',
      provider: 'meta',
      is_enabled: true,
      config: {},
    })

    // Create an automation rule for the reminder trigger
    await f.supabase.from('automation_rules').insert({
      organization_id: f.orgId,
      channel: 'whatsapp',
      template_id: null,
      trigger_event: 'appointment_reminder',
      is_enabled: true,
      delay_minutes: 0,
    })

    // Create a default message_template (org-level) so the orchestrator can render
    await f.supabase.from('message_templates').insert({
      organization_id: f.orgId,
      channel: 'whatsapp',
      type: 'appointment_reminder',
      is_active: true,
      is_default: false,
      body: 'Hola {{clientName}}, tu cita es el {{appointmentDate}} a las {{appointmentTime}}.',
    })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(15, 0, 0, 0)

    const aptId = randomUUID()
    await f.supabase.from('appointments').insert({
      id: aptId,
      organization_id: f.orgId,
      employee_id: f.empId,
      client_id: f.clientId,
      status: 'confirmed',
      confirmation_status: 'scheduled',
      is_commissionable: true,
      price_adjustment: 0,
      start_time: tomorrow.toISOString(),
      end_time: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(),
    })

    vi.mocked(getWhatsappProviderOrgs).mockResolvedValue([
      {
        organizationId: f.orgId,
        provider: 'meta',
        config: {},
        source: 'notification_providers',
      },
    ])

    const result = await runDailyReminderScheduler()

    expect(result.success).toBe(true)
    // V2 path: sendWhatsAppReminder is NOT called for V2 orgs
    const sendCallsForApt = vi
      .mocked(sendWhatsAppReminder)
      .mock.calls.filter(([arg]) => (arg as { appointmentId: string }).appointmentId === aptId)
    expect(sendCallsForApt).toHaveLength(0)

    // V2 path: a notification_queue row should exist for this appointment
    const { data: queueRows } = await f.supabase
      .from('notification_queue')
      .select('id, channel, template_id, appointment_id, status')
      .eq('appointment_id', aptId)
    expect(queueRows).not.toBeNull()
    expect(queueRows!.length).toBeGreaterThanOrEqual(1)
    const queueRow = queueRows![0]
    expect(queueRow.channel).toBe('whatsapp')
    expect(queueRow.appointment_id).toBe(aptId)
    expect(['pending', 'processing', 'sent']).toContain(queueRow.status)

    // Cleanup
    await f.supabase.from('notification_queue').delete().eq('appointment_id', aptId)
    await f.supabase.from('appointments').delete().eq('id', aptId)
  }, 30000)
})
