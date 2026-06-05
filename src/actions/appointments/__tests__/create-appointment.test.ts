import { describe, it, expect, vi, beforeEach } from 'vitest'

const UUID = () => crypto.randomUUID()

vi.mock('@/lib/auth/require-org-access', () => ({
  requireOrgAccess: vi.fn().mockResolvedValue({
    success: true,
    context: { userId: 'user-1', organizationId: 'org-1', role: 'admin' },
  }),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/appointments/create-appointment-core', () => ({
  validateCreateInput: vi.fn(),
  checkCreatePreconditions: vi.fn(),
  computeAppointmentTimes: vi.fn(),
  verifySlotAvailability: vi.fn(),
  insertAppointment: vi.fn(),
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

vi.mock('@/lib/app-logger', () => ({ appLog: vi.fn() }))
vi.mock('@/lib/request-context', () => ({ setRequestContext: vi.fn() }))
vi.mock('@/lib/env/client', () => ({ clientEnv: { NEXT_PUBLIC_BASE_URL: 'http://localhost:3000' } }))
vi.mock('@/lib/billing/utils', () => ({ formatCurrencyCOP: vi.fn((n: number) => `$${n}`) }))

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
const { validateCreateInput, checkCreatePreconditions, computeAppointmentTimes, verifySlotAvailability, insertAppointment } = await import('@/lib/appointments/create-appointment-core')
const { requireOrgAccess } = await import('@/lib/auth/require-org-access')

function validInput() {
  return {
    employee_id: UUID(),
    client_id: UUID(),
    service_id: UUID(),
    start_time: '2026-06-01T10:00:00.000Z',
    organization_id: 'org-1',
  }
}

describe('createAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validateCreateInput).mockReturnValue({
      success: true,
      data: validInput(),
    })
    vi.mocked(checkCreatePreconditions).mockResolvedValue({
      success: true,
      data: { employee: { id: 'emp-1' }, service: { id: 'svc-1', duration: 30, name: 'Corte', price: 50000 } },
    })
    vi.mocked(computeAppointmentTimes).mockReturnValue({
      startDate: new Date('2026-06-01T10:00:00.000Z'),
      endDate: new Date('2026-06-01T10:30:00.000Z'),
      normalizedStart: '2026-06-01T10:00:00.000',
    })
    vi.mocked(verifySlotAvailability).mockResolvedValue({ success: true })
    vi.mocked(insertAppointment).mockResolvedValue({ data: { id: 'new-apt-1' }, error: null })
  })

  it('crea cita exitosamente', async () => {
    const result = await createAppointment(validInput())

    expect(result.success).toBe(true)
    expect(result.appointmentId).toBeDefined()
  })

  it('rechaza input inválido sin llamar a createClient', async () => {
    vi.mocked(validateCreateInput).mockReturnValueOnce({ success: false, error: 'Datos inválidos' })

    const result = await createAppointment({ invalid: true })

    expect(result.error).toBeDefined()
  })

  it('rechaza cuando requireOrgAccess falla', async () => {
    vi.mocked(requireOrgAccess).mockResolvedValueOnce({ success: false, error: 'No autorizado.' })

    const result = await createAppointment(validInput())

    expect(result.error).toContain('No autorizado')
  })
})
