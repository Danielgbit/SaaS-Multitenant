import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/appointments/finalize-financials', () => ({
  finalizeAppointmentFinancials: vi.fn().mockResolvedValue({
    payroll: { attempted: true, success: true },
    commission: { attempted: true, success: true },
  }),
}))
vi.mock('@/lib/app-logger', () => ({ appLog: vi.fn() }))

const { runCheckReminders } = await import('../runCheckReminders')
const supabase = await import('@/lib/supabase/server')
const { finalizeAppointmentFinancials } = await import('@/lib/appointments/finalize-financials')

function mockChain(returns: Record<string, unknown>) {
  const chain = {
    select: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    single: vi.fn(),
    update: vi.fn(() => chain),
    insert: vi.fn(() => chain),
  }

  for (const [method, result] of Object.entries(returns)) {
    if (method === 'single') {
      chain.single.mockResolvedValue(result)
    } else if (method === 'select' || method === 'lte' || method === 'gte' || method === 'eq' || method === 'in') {
      ;(chain as any)[method].mockResolvedValue(result)
    } else if (method === 'update' || method === 'insert') {
      ;(chain as any)[method].mockResolvedValue(result)
    }
  }

  return chain
}

describe('runCheckReminders auto-complete phase', () => {
  const aptId = '00000000-0000-0000-0000-000000000001'
  const orgId = '00000000-0000-0000-0000-000000000002'
  const empId = '00000000-0000-0000-0000-000000000003'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(finalizeAppointmentFinancials).mockResolvedValue({
      payroll: { attempted: true, success: true },
      commission: { attempted: true, success: true },
    })
  })

  it('llama finalizeAppointmentFinancials tras auto-completar', async () => {
    const chain = mockChain({
      single: { data: { organization_id: orgId, employee_id: empId }, error: null },
      select: { data: [{ id: aptId, organization_id: orgId, end_time: new Date(Date.now() - 121 * 60 * 1000).toISOString(), confirmation_status: 'needs_review' }], error: null },
      update: { error: null },
      insert: { error: null },
    })

    vi.mocked(supabase.createClient).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never)

    const result = await runCheckReminders()

    expect(finalizeAppointmentFinancials).toHaveBeenCalledWith(
      aptId,
      orgId,
      empId,
      'auto_complete_cron'
    )
    expect(result.autoCompleted).toBe(1)
    expect(result.success).toBe(true)
  })

  it('no llama finalizeAppointmentFinancials si no hay citas auto-completables', async () => {
    const chain = mockChain({
      select: { data: [], error: null },
      update: { error: null },
      insert: { error: null },
    })

    vi.mocked(supabase.createClient).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never)

    const result = await runCheckReminders()

    expect(finalizeAppointmentFinancials).not.toHaveBeenCalled()
    expect(result.autoCompleted).toBe(0)
  })

  it('no llama finalizeAppointmentFinancials si la cita no tiene employee_id', async () => {
    const chain = mockChain({
      single: { data: { organization_id: orgId, employee_id: null }, error: null },
      select: { data: [{ id: aptId, organization_id: orgId, end_time: new Date(Date.now() - 121 * 60 * 1000).toISOString(), confirmation_status: 'needs_review' }], error: null },
      update: { error: null },
      insert: { error: null },
    })

    vi.mocked(supabase.createClient).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never)

    const result = await runCheckReminders()

    expect(finalizeAppointmentFinancials).not.toHaveBeenCalled()
    expect(result.autoCompleted).toBe(1)
  })

  it('continúa auto-completando aunque payroll falle', async () => {
    vi.mocked(finalizeAppointmentFinancials).mockResolvedValue({
      payroll: { attempted: true, success: false, error: 'DB error' },
      commission: { attempted: true, success: true },
    })

    const chain = mockChain({
      single: { data: { organization_id: orgId, employee_id: empId }, error: null },
      select: { data: [{ id: aptId, organization_id: orgId, end_time: new Date(Date.now() - 121 * 60 * 1000).toISOString(), confirmation_status: 'needs_review' }], error: null },
      update: { error: null },
      insert: { error: null },
    })

    vi.mocked(supabase.createClient).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never)

    const result = await runCheckReminders()

    expect(result.autoCompleted).toBe(1)
    expect(result.success).toBe(true)
  })
})
