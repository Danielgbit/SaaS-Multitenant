import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/service-role', () => ({ createServiceRoleClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/require-org-access', () => ({ requireOrgAccess: vi.fn() }))

const { addAppointmentToPayroll } = await import('../addAppointmentToPayroll')
const supabase = await import('@/lib/supabase/server')
const serviceRole = await import('@/lib/supabase/service-role')
const { requireOrgAccess } = await import('@/lib/auth/require-org-access')

describe('seguridad', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('NO ejecuta createServiceRoleClient cuando requireOrgAccess falla', async () => {
    vi.mocked(requireOrgAccess).mockResolvedValueOnce({ success: false, error: 'No autorizado.' })
    vi.mocked(supabase.createClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: crypto.randomUUID(), organization_id: 'org-1', employee_id: 'emp-1',
            start_time: '2026-05-01T10:00:00.000Z', is_commissionable: true, status: 'completed',
            appointment_services: [] },
          error: null,
        }),
      })),
    } as never)

    const result = await addAppointmentToPayroll(crypto.randomUUID())

    expect(result.success).toBe(false)
    expect(result.error).toBe('No autorizado.')
    expect(serviceRole.createServiceRoleClient).not.toHaveBeenCalled()
  })
})

describe('multi-tenant', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('deniega cuando appointment pertenece a otra organización', async () => {
    vi.mocked(requireOrgAccess).mockImplementation(async (orgId: string) => {
      if (orgId === 'org-b') return { success: false, error: 'No perteneces.' }
      return { success: true, context: { userId: 'u1', organizationId: orgId, role: 'admin' } }
    })
    vi.mocked(supabase.createClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: crypto.randomUUID(), organization_id: 'org-b', employee_id: 'emp-1',
            start_time: '2026-05-01T10:00:00.000Z', is_commissionable: true, status: 'completed',
            appointment_services: [] },
          error: null,
        }),
      })),
    } as never)

    const result = await addAppointmentToPayroll(crypto.randomUUID())
    expect(result.error).toContain('No perteneces')
    expect(serviceRole.createServiceRoleClient).not.toHaveBeenCalled()
  })
})
