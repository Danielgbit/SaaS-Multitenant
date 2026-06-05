import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('addAppointmentToPayroll — seguridad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('NO ejecuta createServiceRoleClient cuando requireOrgAccess falla', async () => {
    // Mock requireOrgAccess para que FALLE
    vi.mock('@/lib/auth/require-org-access', () => ({
      requireOrgAccess: vi.fn().mockResolvedValue({
        success: false,
        error: 'No autorizado.',
      }),
    }))

    const mockServiceRole = vi.fn()
    vi.mock('@/lib/supabase/service-role', () => ({
      createServiceRoleClient: mockServiceRole,
    }))

    // Mock básico para createClient (necesario para fetch inicial)
    vi.mock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'apt-1',
              organization_id: 'org-1',
              employee_id: 'emp-1',
              start_time: '2026-05-01T10:00:00.000Z',
              is_commissionable: true,
              status: 'completed',
              appointment_services: [],
            },
            error: null,
          }),
        })),
      })),
    }))

    vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

    const { addAppointmentToPayroll } = await import('../addAppointmentToPayroll')
    const result = await addAppointmentToPayroll('apt-1')

    // La acción debe fallar por auth
    expect(result.success).toBe(false)
    expect(result.error).toBe('No autorizado.')

    // NUNCA debe llamarse createServiceRoleClient
    expect(mockServiceRole).not.toHaveBeenCalled()
  })
})

describe('aislamiento multi-tenant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('deniega acceso cuando el appointment pertenece a otra organización', async () => {
    // Simular que requireOrgAccess verifica orgId
    vi.mock('@/lib/auth/require-org-access', () => ({
      requireOrgAccess: vi.fn().mockImplementation(async (orgId: string, roles?: string[]) => {
        if (orgId === 'org-b') {
          return { success: false, error: 'No perteneces a esta organización.' }
        }
        return { success: true, context: { userId: 'user-1', organizationId: orgId, role: 'admin' } }
      }),
    }))

    const mockServiceRole = vi.fn()
    vi.mock('@/lib/supabase/service-role', () => ({
      createServiceRoleClient: mockServiceRole,
    }))

    vi.mock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'apt-2',
              organization_id: 'org-b', // Pertenece a ORG B
              employee_id: 'emp-2',
              start_time: '2026-05-01T10:00:00.000Z',
              is_commissionable: true,
              status: 'completed',
              appointment_services: [],
            },
            error: null,
          }),
        })),
      })),
    }))

    vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

    const { addAppointmentToPayroll } = await import('../addAppointmentToPayroll')
    const result = await addAppointmentToPayroll('apt-2')

    expect(result.success).toBe(false)
    expect(result.error).toContain('No perteneces')
    expect(mockServiceRole).not.toHaveBeenCalled()
  })
})
