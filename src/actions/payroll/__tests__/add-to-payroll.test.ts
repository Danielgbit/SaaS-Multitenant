import { describe, it, expect, vi, beforeEach } from 'vitest'

const UUID = () => crypto.randomUUID()

const mockRequireOrgAccess = vi.fn().mockResolvedValue({
  success: true,
  context: { userId: 'user-1', organizationId: 'org-1', role: 'admin' },
})

vi.mock('@/lib/auth/require-org-access', () => ({
  requireOrgAccess: (...args: unknown[]) => mockRequireOrgAccess(...args),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

function buildChain(overrides: Record<string, unknown> = {}) {
  const singleResult = overrides.singleResult ?? { data: null, error: null }
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(singleResult),
    maybeSingle: vi.fn().mockResolvedValue(singleResult),
    onConflict: vi.fn().mockReturnThis(),
    ignoreDuplicates: vi.fn().mockReturnThis(),
  }
}

describe('addAppointmentToPayroll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('crea payroll item para cita completada y comisionable', async () => {
    const aptId = UUID()

    const appointmentData = {
      id: aptId,
      organization_id: 'org-1',
      employee_id: 'emp-1',
      start_time: '2026-05-01T10:00:00.000Z',
      is_commissionable: true,
      status: 'completed',
      appointment_services: [
        { id: UUID(), service_id: UUID(), service: { id: UUID(), name: 'Corte', price: 50000, has_commission: true } },
      ],
    }

    vi.mock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => ({
        from: vi.fn((table: string) => {
          if (table === 'appointments') return buildChain({ singleResult: { data: appointmentData, error: null } })
          if (table === 'employees') return buildChain({ singleResult: { data: { id: 'emp-1', default_commission_rate: 20, contract_type: 'prestacion', payment_type: 'porcentaje' }, error: null } })
          return buildChain()
        }),
      })),
    }))

    // Service role mock: first call returns null (no existing period), second creates
    let callCount = 0
    vi.mock('@/lib/supabase/service-role', () => ({
      createServiceRoleClient: vi.fn(() => ({
        from: vi.fn(() => {
          callCount++
          if (callCount <= 2) {
            return buildChain({ singleResult: { data: null, error: null } })
          }
          const insertChain = buildChain()
          insertChain.select = vi.fn().mockResolvedValue({ data: { id: 'period-1' }, error: null })
          insertChain.insert = vi.fn().mockReturnValue(insertChain)
          return insertChain
        }),
      })),
    }))

    const { addAppointmentToPayroll } = await import('../addAppointmentToPayroll')
    const result = await addAppointmentToPayroll(aptId)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.services_added).toBeGreaterThan(0)
  })

  it('rechaza ID de cita inválido', async () => {
    vi.mock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => ({ from: vi.fn(() => buildChain()) })),
    }))
    vi.mock('@/lib/supabase/service-role', () => ({
      createServiceRoleClient: vi.fn(),
    }))

    const { addAppointmentToPayroll } = await import('../addAppointmentToPayroll')
    const result = await addAppointmentToPayroll('not-a-uuid')

    expect(result.success).toBe(false)
    expect(result.error).toContain('inválido')
  })
})
