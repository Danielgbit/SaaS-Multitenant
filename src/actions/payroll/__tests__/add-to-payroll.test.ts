import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock requireOrgAccess — success por defecto
vi.mock('@/lib/auth/require-org-access', () => ({
  requireOrgAccess: vi.fn().mockResolvedValue({
    success: true,
    context: { userId: 'user-1', organizationId: 'org-1', role: 'admin' },
  }),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// Helper para crear cadenas de mock de Supabase
function mockAppointmentFetch(overrides: Record<string, unknown> = {}) {
  return {
    from: vi.fn((table: string) => {
      const chain: Record<string, unknown> = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        ignoreDuplicates: vi.fn().mockReturnThis(),
      }

      if (table === 'appointments') {
        chain.single = vi.fn().mockResolvedValue({
          data: {
            id: 'apt-1',
            organization_id: 'org-1',
            employee_id: 'emp-1',
            start_time: '2026-05-01T10:00:00.000Z',
            is_commissionable: true,
            status: 'completed',
            appointment_services: [
              { id: 'as-1', service_id: 'svc-1', service: { id: 'svc-1', name: 'Corte', price: 50000, has_commission: true } },
            ],
          },
          error: null,
        })
      }

      if (table === 'employees') {
        chain.single = vi.fn().mockResolvedValue({
          data: { id: 'emp-1', default_commission_rate: 20, contract_type: 'prestacion', payment_type: 'porcentaje' },
          error: null,
        })
      }

      return chain
    }),
  }
}

function mockServiceRoleClient() {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    onConflict: vi.fn().mockReturnThis(),
    ignoreDuplicates: vi.fn().mockReturnThis(),
  }

  // Cuando se hace .select('id') en payroll_periods, devolver null (crear nuevo)
  const selectMock = vi.fn(() => {
    const selChain = { ...chain }
    selChain.eq = vi.fn().mockReturnThis()
    selChain.single = vi.fn().mockResolvedValue({ data: null, error: null })
    return selChain
  })

  return {
    from: vi.fn(() => ({
      ...chain,
      select: selectMock,
      insert: vi.fn().mockResolvedValue({ data: { id: 'period-1' }, error: null }),
    })),
  }
}

describe('addAppointmentToPayroll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('crea payroll item para cita completada y comisionable', async () => {
    const mockSupabase = mockAppointmentFetch()
    vi.mock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => mockSupabase),
    }))

    const mockService = mockServiceRoleClient()
    vi.mock('@/lib/supabase/service-role', () => ({
      createServiceRoleClient: vi.fn(() => mockService),
    }))

    const { addAppointmentToPayroll } = await import('../addAppointmentToPayroll')
    const result = await addAppointmentToPayroll('apt-1')

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.services_added).toBeGreaterThan(0)
  })

  it('rechaza ID de cita inválido', async () => {
    vi.mock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => ({ from: vi.fn() })),
    }))
    vi.mock('@/lib/supabase/service-role', () => ({
      createServiceRoleClient: vi.fn(),
    }))

    const { addAppointmentToPayroll } = await import('../addAppointmentToPayroll')
    const result = await addAppointmentToPayroll('not-a-uuid')

    expect(result.success).toBe(false)
    expect(result.error).toContain('inválido')
  })

  it('rechaza cita no completada', async () => {
    const mockSupabase = mockAppointmentFetch({ status: 'pending' })
    vi.mock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => mockSupabase),
    }))

    const { addAppointmentToPayroll } = await import('../addAppointmentToPayroll')
    const result = await addAppointmentToPayroll('apt-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('no está completada')
  })

  it('rechaza cita no comisionable', async () => {
    const mockSupabase = mockAppointmentFetch({ is_commissionable: false })
    vi.mock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => mockSupabase),
    }))

    const { addAppointmentToPayroll } = await import('../addAppointmentToPayroll')
    const result = await addAppointmentToPayroll('apt-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('no es comisionable')
  })

  it('rechaza cita sin empleado asignado', async () => {
    const mockSupabase = mockAppointmentFetch({ employee_id: null })
    vi.mock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => mockSupabase),
    }))

    const { addAppointmentToPayroll } = await import('../addAppointmentToPayroll')
    const result = await addAppointmentToPayroll('apt-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('sin empleado')
  })
})
