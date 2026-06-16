import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@db/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/notifications/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))
vi.mock('@/lib/request-context', () => ({
  getRequestId: vi.fn(() => 'trace-test'),
}))
vi.mock('@/lib/env/client', () => ({
  clientEnv: { NEXT_PUBLIC_APP_URL: 'http://localhost:3000' },
}))
vi.mock('@/lib/notifications/conversations', () => ({
  getOrCreateConversation: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/notifications/event-timeline', () => ({
  logNotificationEvent: vi.fn().mockResolvedValue(undefined),
}))

type TableResult = { data: unknown; error: unknown }
type InsertCapture = { table: string; payload: unknown }

function createSupabaseMock() {
  const tableResults = new Map<string, TableResult[]>()
  const inserts: InsertCapture[] = []

  function queueResult(table: string, result: TableResult) {
    const queue = tableResults.get(table) ?? []
    queue.push(result)
    tableResults.set(table, queue)
  }

  function nextResult(table: string): TableResult {
    const queue = tableResults.get(table)
    if (!queue || queue.length === 0) return { data: null, error: null }
    return queue.shift()!
  }

  const builder: {
    select: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
    in: ReturnType<typeof vi.fn>
    gte: ReturnType<typeof vi.fn>
    lte: ReturnType<typeof vi.fn>
    is: ReturnType<typeof vi.fn>
    single: ReturnType<typeof vi.fn>
    insert: ReturnType<typeof vi.fn>
    then: <TResult1 = unknown, TResult2 = never>(
      onfulfilled?: (value: TableResult) => TResult1 | PromiseLike<TResult1>,
      onrejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
    ) => Promise<TResult1 | TResult2>
  } = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    is: vi.fn(),
    single: vi.fn(),
    insert: vi.fn(),
    then(onfulfilled, onrejected) {
      return Promise.resolve(currentResult).then(onfulfilled, onrejected)
    },
  }

  let currentTable = ''
  let currentResult: TableResult = { data: null, error: null }

  builder.select.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.in.mockReturnValue(builder)
  builder.gte.mockReturnValue(builder)
  builder.lte.mockReturnValue(builder)
  builder.is.mockReturnValue(builder)
  builder.single.mockImplementation(() => Promise.resolve(currentResult))
  builder.insert.mockImplementation((payload: unknown) => {
    inserts.push({ table: currentTable, payload })
    return Promise.resolve({ error: null })
  })

  const from = vi.fn().mockImplementation((table: string) => {
    currentTable = table
    currentResult = nextResult(table)
    return builder
  })

  return { from, queueResult, inserts }
}

const { NotificationOrchestrator } = await import(
  '@/lib/notifications/orchestrator'
)
const supabaseModule = await import('@/lib/supabase/server')

function buildAppointmentFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'apt-1',
    organization_id: 'org-1',
    start_time: '2026-01-15T14:00:00.000Z',
    end_time: '2026-01-15T15:00:00.000Z',
    client_id: 'client-1',
    employee_id: 'employee-1',
    status: 'confirmed',
    confirmation_status: 'scheduled',
    clients: {
      name: 'Test Client',
      phone: '+573001234567',
      email: 'test@example.com',
    },
    employees: { name: 'Test Employee', user_id: 'user-1' },
    services: { name: 'Corte' },
    organizations: { name: 'Test Business', phone: '+5712345678' },
    booking_settings: { timezone: 'America/Bogota', reminder_hours_before: 24 },
    ...overrides,
  }
}

function buildRuleFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rule-1',
    organization_id: 'org-1',
    channel: 'whatsapp',
    template_id: null,
    trigger_event: 'appointment_reminder',
    is_enabled: true,
    delay_minutes: 0,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('orchestrator — business phone in fetchAppointment (D-3)', () => {
  it('organizations phone is read from appointment fixture and exposed in template variables', async () => {
    const mock = createSupabaseMock()
    const ruleNoTemplate = buildRuleFixture()

    const customTemplate = {
      id: 'tmpl-1',
      organization_id: 'org-1',
      channel: 'whatsapp',
      type: 'appointment_reminder',
      is_active: true,
      subject: null,
      body: 'Hola {{clientName}}, llámanos al {{businessPhone}}.',
    }

    mock.queueResult('booking_settings', { data: { timezone: 'America/Bogota', reminder_hours_before: 24 }, error: null })
    mock.queueResult('automation_rules', { data: [ruleNoTemplate], error: null })
    mock.queueResult('notification_providers', { data: { id: 'prov-1', provider: 'meta' }, error: null })
    // getDefaultTemplate: custom template found
    mock.queueResult('message_templates', { data: customTemplate, error: null })

    const fixture = buildAppointmentFixture()
    vi.mocked(supabaseModule.createClient).mockResolvedValue(mock as unknown as SupabaseClient<Database>)

    const result = await NotificationOrchestrator('appointment_reminder', fixture.id, fixture)

    expect(result.success).toBe(true)
    expect(result.queued).toBe(1)
    expect(result.errors).toEqual([])

    const insertCall = mock.inserts.find((i) => i.table === 'notification_queue')
    expect(insertCall).toBeDefined()
    const payload = insertCall?.payload as { variables: Record<string, string>; rendered_body: string }
    expect(payload).toBeDefined()
    // businessPhone must be present and equal to the org phone
    expect(payload.variables).toHaveProperty('businessPhone')
    expect(payload.variables.businessPhone).toBe('+5712345678')
    // body should be rendered with the businessPhone variable
    expect(payload.rendered_body).toBe('Hola Test Client, llámanos al +5712345678.')
  })

  it('falls back to empty businessPhone when organization phone is null (no crash)', async () => {
    const mock = createSupabaseMock()
    const ruleNoTemplate = buildRuleFixture()

    const customTemplate = {
      id: 'tmpl-1',
      organization_id: 'org-1',
      channel: 'whatsapp',
      type: 'appointment_reminder',
      is_active: true,
      subject: null,
      body: 'Hola {{clientName}}, llámanos al {{businessPhone}}.',
    }

    mock.queueResult('booking_settings', { data: { timezone: 'America/Bogota', reminder_hours_before: 24 }, error: null })
    mock.queueResult('automation_rules', { data: [ruleNoTemplate], error: null })
    mock.queueResult('notification_providers', { data: { id: 'prov-1', provider: 'meta' }, error: null })
    mock.queueResult('message_templates', { data: customTemplate, error: null })

    const fixture = buildAppointmentFixture({
      organizations: { name: 'Test Business', phone: null },
    })
    vi.mocked(supabaseModule.createClient).mockResolvedValue(mock as unknown as SupabaseClient<Database>)

    const result = await NotificationOrchestrator('appointment_reminder', fixture.id, fixture)

    expect(result.success).toBe(true)
    expect(result.queued).toBe(1)

    const insertCall = mock.inserts.find((i) => i.table === 'notification_queue')
    const payload = insertCall?.payload as { variables: Record<string, string>; rendered_body: string }
    expect(payload.variables.businessPhone).toBe('')
    // replacePlaceholders falls back to {{businessPhone}} for empty values
    expect(payload.rendered_body).toBe('Hola Test Client, llámanos al {{businessPhone}}.')
  })
})
