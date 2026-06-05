import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/require-org-access', () => ({
  requireOrgAccess: vi.fn().mockResolvedValue({
    success: true, context: { userId: 'u1', organizationId: 'org-1', role: 'admin' },
  }),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

vi.mock('@/lib/appointments/create-appointment-core', () => ({
  validateCreateInput: vi.fn(), checkCreatePreconditions: vi.fn(),
  computeAppointmentTimes: vi.fn(), verifySlotAvailability: vi.fn(), insertAppointment: vi.fn(),
}))
vi.mock('@/lib/appointments/confirmation-links/tokens', () => ({ generateConfirmationToken: vi.fn().mockResolvedValue({ success: true, token: 't' }) }))
vi.mock('@/actions/whatsapp/whatsApp', () => ({ queueWhatsAppMessage: vi.fn() }))
vi.mock('@/actions/email/queueEmailMessage', () => ({ queueEmailMessage: vi.fn() }))
vi.mock('@/lib/notifications/providers', () => ({ getWhatsappProvider: vi.fn().mockResolvedValue(null) }))
vi.mock('@/lib/app-logger', () => ({ appLog: vi.fn() }))
vi.mock('@/lib/request-context', () => ({ setRequestContext: vi.fn() }))
vi.mock('@/lib/env/client', () => ({ clientEnv: { NEXT_PUBLIC_BASE_URL: 'http://localhost:3000' } }))
vi.mock('@/lib/billing/utils', () => ({ formatCurrencyCOP: vi.fn((n: number) => `$${n}`) }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => {
    const chainable = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn(), maybeSingle: vi.fn(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis() }
    chainable.single = vi.fn().mockResolvedValue({ data: null, error: null })
    chainable.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    return { from: vi.fn(() => chainable) }
  }),
}))

const { createAppointment } = await import('../createAppointment')
const { validateCreateInput, checkCreatePreconditions, computeAppointmentTimes, verifySlotAvailability, insertAppointment } = await import('@/lib/appointments/create-appointment-core')
const { requireOrgAccess } = await import('@/lib/auth/require-org-access')

const VALID = () => ({ employee_id: crypto.randomUUID(), client_id: crypto.randomUUID(), service_id: crypto.randomUUID(), start_time: '2026-06-01T10:00:00.000Z', organization_id: 'org-1' })

describe('createAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validateCreateInput).mockReturnValue({ success: true, data: VALID() })
    vi.mocked(checkCreatePreconditions).mockResolvedValue({ success: true, data: { employee: { id: 'e1' }, service: { id: 's1', duration: 30, name: 'Corte', price: 50000 } } })
    vi.mocked(computeAppointmentTimes).mockReturnValue({ startDate: new Date(), endDate: new Date(Date.now() + 1800000), normalizedStart: '2026-06-01T10:00:00.000' })
    vi.mocked(verifySlotAvailability).mockResolvedValue({ success: true })
    vi.mocked(insertAppointment).mockResolvedValue({ success: true, data: { id: 'apt-1' } })
  })

  it('crea cita exitosamente', async () => {
    const result = await createAppointment(VALID())
    expect(result.success).toBe(true)
    expect(result.appointmentId).toBeDefined()
  })

  it('rechaza input inválido', async () => {
    vi.mocked(validateCreateInput).mockReturnValueOnce({ success: false, error: 'Inválido' })
    const result = await createAppointment({ invalid: true })
    expect(result.error).toBeDefined()
  })

  it('rechaza cuando requireOrgAccess falla', async () => {
    vi.mocked(requireOrgAccess).mockResolvedValueOnce({ success: false, error: 'No autorizado.' })
    const result = await createAppointment(VALID())
    expect(result.error).toContain('No autorizado')
  })
})
