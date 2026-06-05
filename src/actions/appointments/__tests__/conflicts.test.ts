import { describe, it, expect, vi, beforeEach } from 'vitest'

const UUID = () => crypto.randomUUID()

vi.mock('@/lib/auth/require-org-access', () => ({
  requireOrgAccess: vi.fn().mockResolvedValue({
    success: true,
    context: { userId: 'user-1', organizationId: 'org-1', role: 'admin' },
  }),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

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

vi.mock('@/lib/appointments/confirmation-links/tokens', () => ({
  generateConfirmationToken: vi.fn().mockResolvedValue({ success: true, token: 'tok-1' }),
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

vi.mock('@/lib/appointments/create-appointment-core', () => ({
  validateCreateInput: vi.fn(),
  checkCreatePreconditions: vi.fn(),
  computeAppointmentTimes: vi.fn(),
  verifySlotAvailability: vi.fn(),
  insertAppointment: vi.fn(),
}))

const { createAppointment } = await import('../createAppointment')
const { validateCreateInput, checkCreatePreconditions, verifySlotAvailability } = await import('@/lib/appointments/create-appointment-core')

function validInput() {
  return {
    employee_id: UUID(),
    client_id: UUID(),
    service_id: UUID(),
    start_time: '2026-06-01T10:00:00.000Z',
    organization_id: 'org-1',
  }
}

describe('conflictos de agenda', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validateCreateInput).mockReturnValue({ success: true, data: validInput() })
    vi.mocked(checkCreatePreconditions).mockResolvedValue({
      success: true,
      data: { employee: { id: 'emp-1' }, service: { id: 'svc-1', duration: 30, name: 'Corte', price: 50000 } },
    })
  })

  it('rechaza cita cuando verifySlotAvailability informa conflicto', async () => {
    vi.mocked(verifySlotAvailability).mockResolvedValue({
      success: false,
      error: 'El empleado ya tiene una cita en este horario.',
    })

    const result = await createAppointment(validInput())

    expect(result.error).toContain('horario')
  })

  it('rechaza cita cuando checkCreatePreconditions falla (empleado inexistente)', async () => {
    vi.mocked(checkCreatePreconditions).mockResolvedValueOnce({
      success: false,
      error: 'Empleado no encontrado.',
    })

    const result = await createAppointment(validInput())

    expect(result.error).toContain('Empleado')
  })
})
