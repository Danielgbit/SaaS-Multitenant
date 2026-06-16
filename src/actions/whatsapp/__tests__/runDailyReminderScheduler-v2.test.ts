import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@db/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/app-logger', () => ({
  appLog: vi.fn(),
}))
vi.mock('@/lib/request-context', () => ({
  setRequestContext: vi.fn(),
}))
vi.mock('@/actions/notifications/v2-feature-flag', () => ({
  isV2EnabledForOrg: vi.fn(),
}))
vi.mock('@/lib/notifications/orchestrator', () => ({
  dispatchAppointmentReminder: vi.fn(),
}))
vi.mock('@/lib/notifications/providers', () => ({
  getWhatsappProviderOrgs: vi.fn(),
}))
vi.mock('../sendWhatsAppReminder', () => ({
  sendWhatsAppReminder: vi.fn(),
}))

function createSupabaseMock() {
  type TableResult = { data: unknown; error: unknown }
  const tableResults = new Map<string, TableResult[]>()
  const captures: { table: string; selectArg?: string; result: TableResult | null }[] = []

  function queueResult(table: string, result: TableResult) {
    const queue = tableResults.get(table) ?? []
    queue.push(result)
    tableResults.set(table, queue)
  }

  let currentTable = ''
  let currentResult: TableResult = { data: null, error: null }

  const builder: {
    select: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
    in: ReturnType<typeof vi.fn>
    gte: ReturnType<typeof vi.fn>
    lte: ReturnType<typeof vi.fn>
    then: <TResult1 = TableResult, TResult2 = never>(
      onfulfilled?: (value: TableResult) => TResult1 | PromiseLike<TResult1>,
      onrejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
    ) => Promise<TResult1 | TResult2>
  } = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    then(onfulfilled, onrejected) {
      return Promise.resolve(currentResult).then(onfulfilled, onrejected)
    },
  }

  builder.select.mockImplementation((arg: string) => {
    captures.push({ table: currentTable, selectArg: arg, result: null })
    return builder
  })
  builder.eq.mockReturnValue(builder)
  builder.in.mockReturnValue(builder)
  builder.gte.mockReturnValue(builder)
  builder.lte.mockReturnValue(builder)

  const from = vi.fn().mockImplementation((table: string) => {
    currentTable = table
    const queue = tableResults.get(table)
    currentResult = queue && queue.length > 0 ? queue.shift()! : { data: null, error: null }
    captures.push({ table, result: currentResult })
    return builder
  })

  return { from, queueResult, captures }
}

const { runDailyReminderScheduler } = await import(
  '@/actions/whatsapp/runDailyReminderScheduler'
)
const { createClient } = await import('@/lib/supabase/server')
const { sendWhatsAppReminder } = await import(
  '@/actions/whatsapp/sendWhatsAppReminder'
)
const { dispatchAppointmentReminder } = await import(
  '@/lib/notifications/orchestrator'
)
const { isV2EnabledForOrg } = await import(
  '@/actions/notifications/v2-feature-flag'
)
const { getWhatsappProviderOrgs } = await import(
  '@/lib/notifications/providers'
)

const mockSupabase = createSupabaseMock()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)
})

describe('runDailyReminderScheduler — V1/V2 branch (F-002)', () => {
  it('returns success empty result when no provider orgs', async () => {
    vi.mocked(getWhatsappProviderOrgs).mockResolvedValue([])

    const result = await runDailyReminderScheduler()

    expect(result).toEqual({
      success: true,
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [],
    })
    expect(sendWhatsAppReminder).not.toHaveBeenCalled()
    expect(dispatchAppointmentReminder).not.toHaveBeenCalled()
  })

  it('V1 org: dispatches via sendWhatsAppReminder when isV2EnabledForOrg returns false', async () => {
    vi.mocked(getWhatsappProviderOrgs).mockResolvedValue([
      {
        organizationId: 'org-v1',
        provider: 'meta',
        config: {},
        source: 'notification_providers',
      },
    ])
    vi.mocked(isV2EnabledForOrg).mockResolvedValue(false)
    vi.mocked(sendWhatsAppReminder).mockResolvedValue({ success: true })

    mockSupabase.queueResult('appointments', {
      data: [{ id: 'apt-1', organization_id: 'org-v1' }],
      error: null,
    })

    const result = await runDailyReminderScheduler()

    expect(result.success).toBe(true)
    expect(result.processed).toBe(1)
    expect(result.sent).toBe(1)
    expect(result.failed).toBe(0)
    expect(isV2EnabledForOrg).toHaveBeenCalledWith('org-v1')
    expect(sendWhatsAppReminder).toHaveBeenCalledWith({ appointmentId: 'apt-1' })
    expect(dispatchAppointmentReminder).not.toHaveBeenCalled()
  })

  it('V2 org: dispatches via dispatchAppointmentReminder when isV2EnabledForOrg returns true', async () => {
    vi.mocked(getWhatsappProviderOrgs).mockResolvedValue([
      {
        organizationId: 'org-v2',
        provider: 'meta',
        config: {},
        source: 'notification_providers',
      },
    ])
    vi.mocked(isV2EnabledForOrg).mockResolvedValue(true)
    vi.mocked(dispatchAppointmentReminder).mockResolvedValue({
      success: true,
      queued: 1,
      errors: [],
      traceId: 'trace-v2',
    })

    mockSupabase.queueResult('appointments', {
      data: [{ id: 'apt-2', organization_id: 'org-v2' }],
      error: null,
    })

    const result = await runDailyReminderScheduler()

    expect(result.success).toBe(true)
    expect(result.processed).toBe(1)
    expect(result.sent).toBe(1)
    expect(result.failed).toBe(0)
    expect(isV2EnabledForOrg).toHaveBeenCalledWith('org-v2')
    expect(dispatchAppointmentReminder).toHaveBeenCalledWith('apt-2')
    expect(sendWhatsAppReminder).not.toHaveBeenCalled()
  })

  it('V2 org error path: result.errors join is reported as failure', async () => {
    vi.mocked(getWhatsappProviderOrgs).mockResolvedValue([
      {
        organizationId: 'org-v2',
        provider: 'meta',
        config: {},
        source: 'notification_providers',
      },
    ])
    vi.mocked(isV2EnabledForOrg).mockResolvedValue(true)
    vi.mocked(dispatchAppointmentReminder).mockResolvedValue({
      success: false,
      queued: 0,
      errors: ['No provider configured for channel whatsapp'],
      traceId: 'trace-err',
    })

    mockSupabase.queueResult('appointments', {
      data: [{ id: 'apt-3', organization_id: 'org-v2' }],
      error: null,
    })

    const result = await runDailyReminderScheduler()

    expect(result.failed).toBe(1)
    expect(result.sent).toBe(0)
    expect(result.errors[0]).toContain('No provider configured for channel whatsapp')
  })

  it('exception in dispatch branch is caught and counted as failure (does not abort loop)', async () => {
    vi.mocked(getWhatsappProviderOrgs).mockResolvedValue([
      {
        organizationId: 'org-v2',
        provider: 'meta',
        config: {},
        source: 'notification_providers',
      },
    ])
    vi.mocked(isV2EnabledForOrg).mockResolvedValue(true)
    vi.mocked(dispatchAppointmentReminder).mockRejectedValue(new Error('orchestrator crash'))

    mockSupabase.queueResult('appointments', {
      data: [{ id: 'apt-4', organization_id: 'org-v2' }],
      error: null,
    })

    const result = await runDailyReminderScheduler()

    expect(result.failed).toBe(1)
    expect(result.errors[0]).toContain('orchestrator crash')
  })

  it('appointments.select includes organization_id (not just id)', async () => {
    vi.mocked(getWhatsappProviderOrgs).mockResolvedValue([
      {
        organizationId: 'org-1',
        provider: 'meta',
        config: {},
        source: 'notification_providers',
      },
    ])
    vi.mocked(isV2EnabledForOrg).mockResolvedValue(false)
    vi.mocked(sendWhatsAppReminder).mockResolvedValue({ success: true })

    mockSupabase.queueResult('appointments', { data: [], error: null })

    await runDailyReminderScheduler()

    const selectCall = mockSupabase.captures.find((c) => c.selectArg !== undefined)
    expect(selectCall).toBeDefined()
    expect(selectCall!.selectArg).toBe('id, organization_id')
  })
})
