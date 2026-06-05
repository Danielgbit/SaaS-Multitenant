import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/service-role', () => ({ createServiceRoleClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/require-org-access', () => ({
  requireOrgAccess: vi.fn().mockResolvedValue({
    success: true, context: { userId: 'u1', organizationId: 'org-1', role: 'admin' },
  }),
}))

const { addAppointmentToPayroll } = await import('../addAppointmentToPayroll')
const supabase = await import('@/lib/supabase/server')
const { requireOrgAccess } = await import('@/lib/auth/require-org-access')

function makeSingle(val: unknown) {
  return vi.fn().mockResolvedValue(val)
}

function aptBase(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      id: crypto.randomUUID(), organization_id: 'org-1', employee_id: 'emp-1',
      start_time: '2026-05-01T10:00:00.000Z', is_commissionable: true, status: 'completed',
      appointment_services: [],
      ...overrides,
    },
    error: null,
  }
}

describe('addAppointmentToPayroll', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('rechaza ID inválido', async () => {
    const result = await addAppointmentToPayroll('bad')
    expect(result.success).toBe(false)
    expect(result.error).toContain('inválido')
  })

  it('rechaza cuando requireOrgAccess falla', async () => {
    vi.mocked(requireOrgAccess).mockResolvedValueOnce({ success: false, error: 'No autorizado.' })
    vi.mocked(supabase.createClient).mockReturnValue({
      from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: makeSingle(aptBase()) })),
    } as never)

    const result = await addAppointmentToPayroll(crypto.randomUUID())
    expect(result.success).toBe(false)
    expect(result.error).toBe('No autorizado.')
  })

  it('rechaza cita no completada', async () => {
    vi.mocked(supabase.createClient).mockReturnValue({
      from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: makeSingle(aptBase({ status: 'pending' })) })),
    } as never)

    const result = await addAppointmentToPayroll(crypto.randomUUID())
    expect(result.error).toContain('no está completada')
  })

  it('rechaza cita sin empleado', async () => {
    vi.mocked(supabase.createClient).mockReturnValue({
      from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: makeSingle(aptBase({ employee_id: null })) })),
    } as never)

    const result = await addAppointmentToPayroll(crypto.randomUUID())
    expect(result.error).toContain('sin empleado')
  })

  it('rechaza cita no comisionable', async () => {
    vi.mocked(supabase.createClient).mockReturnValue({
      from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: makeSingle(aptBase({ is_commissionable: false })) })),
    } as never)

    const result = await addAppointmentToPayroll(crypto.randomUUID())
    expect(result.error).toContain('no es comisionable')
  })
})
