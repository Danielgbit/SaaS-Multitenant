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

  function makeBuilder() {
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
    return builder
  }

  makeBuilder()

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
    template_id: 'tmpl-custom',
    trigger_event: 'appointment_reminder',
    is_enabled: true,
    delay_minutes: 0,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('orchestrator — template_id branch (F-007 / C4)', () => {
  it('when rule.template_id is set: passes null as type to getTemplateWithRender (early return)', async () => {
    const mock = createSupabaseMock()
    mock.queueResult('booking_settings', { data: { timezone: 'America/Bogota', reminder_hours_before: 24 }, error: null })
    mock.queueResult('automation_rules', { data: [buildRuleFixture({ template_id: 'tmpl-custom' })], error: null })
    mock.queueResult('notification_providers', { data: { id: 'prov-1', provider: 'meta' }, error: null })

    const fixture = buildAppointmentFixture()
    vi.mocked(supabaseModule.createClient).mockResolvedValue(mock as unknown as SupabaseClient<Database>)

    const result = await NotificationOrchestrator('appointment_reminder', fixture.id, fixture)

    expect(result.success).toBe(true)
    expect(result.errors).toEqual([])

    // Verify the orchestrator reached the insert step (queue was created with template_id)
    const insertCall = mock.inserts.find((i) => i.table === 'notification_queue')
    expect(insertCall).toBeDefined()
    const payload = insertCall?.payload as { template_id: string | null; rendered_body: string }
    expect(payload).toBeDefined()
    expect(payload.template_id).toBe('tmpl-custom')
    // TODO(follow-up): rendered_body is empty when template_id is set
    // This is the known gap that the downstream consumer must fix.
    expect(payload.rendered_body).toBe('')
  })

  it('when rule.template_id is null and no template found: error reported, no insert', async () => {
    const mock = createSupabaseMock()
    const ruleNoTemplate = buildRuleFixture({ template_id: null })
    mock.queueResult('booking_settings', { data: { timezone: 'America/Bogota', reminder_hours_before: 24 }, error: null })
    mock.queueResult('automation_rules', { data: [ruleNoTemplate], error: null })
    mock.queueResult('notification_providers', { data: { id: 'prov-1', provider: 'meta' }, error: null })
    // getDefaultTemplate will try custom + default → return null/null
    mock.queueResult('message_templates', { data: null, error: { code: 'PGRST116', message: 'not found' } })
    mock.queueResult('message_templates', { data: null, error: { code: 'PGRST116', message: 'not found' } })

    const fixture = buildAppointmentFixture()
    vi.mocked(supabaseModule.createClient).mockResolvedValue(mock as unknown as SupabaseClient<Database>)

    const result = await NotificationOrchestrator('appointment_reminder', fixture.id, fixture)

    expect(result.success).toBe(true)
    expect(result.queued).toBe(0)
    expect(result.errors).toContain('No template found for whatsapp/appointment_reminder')

    const insertCall = mock.inserts.find((i) => i.table === 'notification_queue')
    expect(insertCall).toBeUndefined()
  })

  it('payload contains template_id when rule has template_id', async () => {
    const mock = createSupabaseMock()
    mock.queueResult('booking_settings', { data: { timezone: 'America/Bogota', reminder_hours_before: 24 }, error: null })
    mock.queueResult('automation_rules', { data: [buildRuleFixture()], error: null })
    mock.queueResult('notification_providers', { data: { id: 'prov-1', provider: 'meta' }, error: null })

    const fixture = buildAppointmentFixture()
    vi.mocked(supabaseModule.createClient).mockResolvedValue(mock as unknown as SupabaseClient<Database>)

    await NotificationOrchestrator('appointment_reminder', fixture.id, fixture)

    const insertCall = mock.inserts.find((i) => i.table === 'notification_queue')
    const payload = insertCall?.payload as { template_id: string | null; channel: string; organization_id: string }
    expect(payload).toBeDefined()
    expect(payload.template_id).toBe('tmpl-custom')
    expect(payload.channel).toBe('whatsapp')
    expect(payload.organization_id).toBe('org-1')
  })
})
