import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSignUp = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { signUp: mockSignUp },
  })),
}))

vi.mock('@/lib/rate-limiter', () => ({
  authLimiter: { check: vi.fn(() => ({ allowed: true })), hit: vi.fn() },
  registerLimiter: { check: vi.fn(() => ({ allowed: true })), hit: vi.fn() },
}))

const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({ redirect: mockRedirect }))
vi.mock('next/headers', () => ({ headers: vi.fn(() => new Headers()) }))
vi.mock('@/lib/network/get-client-ip', () => ({ getClientIp: vi.fn(() => '127.0.0.1') }))

const { registerAction } = await import('../index')

function validFormData(): FormData {
  const fd = new FormData()
  fd.set('email', 'new@user.com')
  fd.set('password', 'Secure1!pass')
  fd.set('confirmPassword', 'Secure1!pass')
  fd.set('businessName', 'Mi Spa')
  fd.set('fullName', 'María García')
  return fd
}

describe('registerAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registra usuario exitosamente y redirige', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null })

    await registerAction(null, validFormData())

    expect(mockSignUp).toHaveBeenCalled()
    expect(mockRedirect).toHaveBeenCalledWith('/login?message=check_email')
  })

  it('rechaza email inválido sin llamar a Supabase', async () => {
    const fd = validFormData()
    fd.set('email', 'not-email')

    const result = await registerAction(null, fd)

    expect(result).toEqual({ error: expect.any(String) })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('rechaza confirmPassword distinto sin llamar a Supabase', async () => {
    const fd = validFormData()
    fd.set('confirmPassword', 'Different1!pass')

    const result = await registerAction(null, fd)

    expect(result).toEqual({ error: expect.any(String) })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('rechaza password débil sin llamar a Supabase', async () => {
    const fd = validFormData()
    fd.set('password', 'short')
    fd.set('confirmPassword', 'short')

    const result = await registerAction(null, fd)

    expect(result).toEqual({ error: expect.any(String) })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('rechaza businessName vacío', async () => {
    const fd = validFormData()
    fd.set('businessName', '')

    const result = await registerAction(null, fd)

    expect(result).toEqual({ error: expect.any(String) })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('rechaza fullName con caracteres inválidos', async () => {
    const fd = validFormData()
    fd.set('fullName', '<script>alert(1)</script>')

    const result = await registerAction(null, fd)

    expect(result).toEqual({ error: expect.any(String) })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('maneja error de Supabase (ej: email duplicado)', async () => {
    mockSignUp.mockResolvedValueOnce({ error: { message: 'User already registered' } })

    const result = await registerAction(null, validFormData())

    expect(result).toEqual({ error: 'User already registered' })
  })

  it('rate limiter bloquea registros excesivos', async () => {
    const { registerLimiter } = await import('@/lib/rate-limiter')
    vi.mocked(registerLimiter.check).mockReturnValueOnce({ allowed: false })

    const result = await registerAction(null, validFormData())

    expect(result.error).toContain('Demasiados registros')
    expect(mockSignUp).not.toHaveBeenCalled()
  })
})
