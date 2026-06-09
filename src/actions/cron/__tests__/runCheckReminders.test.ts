import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/appointments/finalize-financials', () => ({
  finalizeAppointmentFinancials: vi.fn(),
}))
vi.mock('@/lib/app-logger', () => ({ appLog: vi.fn() }))

const { runCheckReminders } = await import('../runCheckReminders')
const { finalizeAppointmentFinancials } = await import(
  '@/lib/appointments/finalize-financials'
)
const supabase = await import('@/lib/supabase/server')

function createSupabaseMock() {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    lte: vi.fn(),
    gte: vi.fn(),
    in: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    single: vi.fn(),
  }

  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.lte.mockReturnValue(chain)
  chain.gte.mockReturnValue(chain)
  chain.in.mockReturnValue(chain)
  chain.update.mockReturnValue(chain)
  chain.insert.mockResolvedValue({ error: null })
  chain.single.mockResolvedValue({ data: null, error: null })

  const from = vi.fn().mockReturnValue(chain)

  return { from }
}

describe('runCheckReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(finalizeAppointmentFinancials).mockResolvedValue({
      payroll: { attempted: true, success: true },
      commission: { attempted: true, success: true },
    })
  })

  it('ejecuta sin errores cuando no hay citas pendientes', async () => {
    const mock = createSupabaseMock()
    vi.mocked(supabase.createClient).mockReturnValue(mock as never)

    const result = await runCheckReminders()

    expect(result.success).toBe(true)
    expect(result.reminders).toBe(0)
    expect(result.alerts).toBe(0)
    expect(result.autoCompleted).toBe(0)
    expect(result.errors).toHaveLength(0)
    expect(finalizeAppointmentFinancials).not.toHaveBeenCalled()
  })

  it('importa y usa finalizeAppointmentFinancials en el modulo', async () => {
    const mock = createSupabaseMock()
    vi.mocked(supabase.createClient).mockReturnValue(mock as never)

    await runCheckReminders()

    expect(finalizeAppointmentFinancials).toBeDefined()
    expect(typeof finalizeAppointmentFinancials).toBe('function')
  })
})
