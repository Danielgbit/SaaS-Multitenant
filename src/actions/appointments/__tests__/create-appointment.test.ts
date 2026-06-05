import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/require-org-access', () => ({
  requireOrgAccess: vi.fn().mockResolvedValue({
    success: true,
    context: { userId: 'user-1', organizationId: 'org-1', role: 'admin' },
  }),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// Mock de los módulos de dominio
vi.mock('@/lib/appointments/create-appointment-core', () => ({
  validateCreateInput: vi.fn().mockReturnValue({
    success: true,
    data: {
      employee_id: 'emp-1',
      client_id: 'client-1',
      service_id: 'svc-1',
      start_time: '2026-06-01T10:00:00.000Z',
      organization_id: 'org-1',
      notes: undefined,
    },
  }),
  checkCreatePreconditions: vi.fn().mockResolvedValue({
    success: true,
    data: { employee: { id: 'emp-1' }, service: { id: 'svc-1', duration: 30, name: 'Corte', price: 50000 } },
  }),
  computeAppointmentTimes: vi.fn().mockReturnValue({
    startDate: new Date('2026-06-01T10:00:00.000Z'),
    endDate: new Date('2026-06-01T10:30:00.000Z'),
    normalizedStart: '2026-06-01T10:00:00.000',
  }),
  verifySlotAvailability: vi.fn().mockResolvedValue({ success: true }),
  insertAppointment: vi.fn().mockResolvedValue({
    data: { id: 'new-apt-1' },
    error: null,
  }),
}))

vi.mock('@/lib/appointments/confirmation-links/tokens', () => ({
  generateConfirmationToken: vi.fn().mockResolvedValue({ success: true, token: 'conf-token-1' }),
}))

vi.mock('@/actions/whatsapp/whatsApp', () => ({
  queueWhatsAppMessage: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/actions/email/queueEmailMessage', () => ({
  queueEmailMessage: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/notifications/providers', () => ({
  getWhatsappProvider: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/app-logger', () => ({
  appLog: vi.fn(),
}))

vi.mock('@/lib/request-context', () => ({
  setRequestContext: vi.fn(),
}))

vi.mock('@/lib/env/client', () => ({
  clientEnv: { NEXT_PUBLIC_BASE_URL: 'http://localhost:3000' },
}))

vi.mock('@/lib/billing/utils', () => ({
  formatCurrencyCOP: vi.fn((n: number) => `$${n}`),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

const { createAppointment } = await import('../createAppointment')

describe('createAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('crea cita exitosamente', async () => {
    const result = await createAppointment({
      employee_id: 'emp-1',
      client_id: 'client-1',
      service_id: 'svc-1',
      start_time: '2026-06-01T10:00:00.000Z',
      organization_id: 'org-1',
    })

    expect(result.success).toBe(true)
    expect(result.appointmentId).toBeDefined()
  })

  it('rechaza input inválido sin llamar a createClient', async () => {
    // Forzar fallo de validación
    const { validateCreateInput } = await import('@/lib/appointments/create-appointment-core')
    vi.mocked(validateCreateInput).mockReturnValueOnce({
      success: false,
      error: 'Datos inválidos',
    })

    const supabase = await import('@/lib/supabase/server')
    const createClientSpy = vi.mocked(supabase.createClient)

    const result = await createAppointment({ invalid: true })

    expect(result.error).toBeDefined()
    expect(createClientSpy).not.toHaveBeenCalled()
  })

  it('rechaza cuando requireOrgAccess falla', async () => {
    const { requireOrgAccess } = await import('@/lib/auth/require-org-access')
    vi.mocked(requireOrgAccess).mockResolvedValueOnce({
      success: false,
      error: 'No autorizado.',
    })

    const { createServiceRoleClient } = await import('@/lib/supabase/service-role').catch(() => ({
      createServiceRoleClient: undefined,
    }))

    const result = await createAppointment({
      employee_id: 'emp-1',
      client_id: 'client-1',
      service_id: 'svc-1',
      start_time: '2026-06-01T10:00:00.000Z',
      organization_id: 'org-1',
    })

    expect(result.error).toContain('No autorizado')
  })
})
