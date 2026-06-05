import { describe, it, expect, vi, beforeEach } from 'vitest'

const UUID = () => crypto.randomUUID()

describe('addAppointmentToPayroll — seguridad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('NO ejecuta createServiceRoleClient cuando requireOrgAccess falla', async () => {
    vi.mock('@/lib/auth/require-org-access', () => ({
      requireOrgAccess: vi.fn().mockResolvedValue({ success: false, error: 'No autorizado.' }),
    }))

    const mockServiceRole = vi.fn()
    vi.mock('@/lib/supabase/service-role', () => ({
      createServiceRoleClient: mockServiceRole,
    }))

    const aptId = UUID()
    vi.mock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: aptId,
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
    const result = await addAppointmentToPayroll(aptId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('No autorizado.')
    expect(mockServiceRole).not.toHaveBeenCalled()
  })
})

describe('aislamiento multi-tenant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('deniega acceso cuando el appointment pertenece a otra organización', async () => {
    vi.mock('@/lib/auth/require-org-access', () => ({
      requireOrgAccess: vi.fn().mockImplementation(async (orgId: string) => {
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

    const aptId = UUID()
    vi.mock('@/lib/supabase/server', () => ({
      createClient: vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: aptId,
              organization_id: 'org-b',
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
    const result = await addAppointmentToPayroll(aptId)

    expect(result.success).toBe(false)
    expect(result.error).toContain('No perteneces')
    expect(mockServiceRole).not.toHaveBeenCalled()
  })
})
