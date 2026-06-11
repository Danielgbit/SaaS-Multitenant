import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSignInWithPassword = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithPassword: mockSignInWithPassword },
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

const { loginAction } = await import('../index')

describe('loginAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('acepta credenciales válidas y redirige al calendario', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null })

    const formData = new FormData()
    formData.set('email', 'test@mail.com')
    formData.set('password', 'validpass')

    await loginAction(null, formData)

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@mail.com',
      password: 'validpass',
    })
    expect(mockRedirect).toHaveBeenCalledWith('/calendar')
  })

  it('redirige a ruta personalizada cuando se especifica', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null })

    const formData = new FormData()
    formData.set('email', 'test@mail.com')
    formData.set('password', 'validpass')
    formData.set('redirect_to', '/nomina')

    await loginAction(null, formData)

    expect(mockRedirect).toHaveBeenCalledWith('/nomina')
  })

  it('rechaza email inválido sin llamar a Supabase', async () => {
    const formData = new FormData()
    formData.set('email', 'not-an-email')
    formData.set('password', 'validpass')

    const result = await loginAction(null, formData)

    expect(result).toEqual({ error: expect.any(String) })
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('rechaza password vacío sin llamar a Supabase', async () => {
    const formData = new FormData()
    formData.set('email', 'test@mail.com')
    formData.set('password', '')

    const result = await loginAction(null, formData)

    expect(result).toEqual({ error: expect.any(String) })
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('rechaza credenciales incorrectas con error genérico', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } })

    const formData = new FormData()
    formData.set('email', 'test@mail.com')
    formData.set('password', 'wrongpass')

    const result = await loginAction(null, formData)

    expect(result).toEqual({ error: 'Credenciales inválidas. Por favor intenta de nuevo.' })
  })

  it('rate limiter bloquea después de demasiados intentos', async () => {
    const { authLimiter } = await import('@/lib/rate-limiter')
    vi.mocked(authLimiter.check).mockReturnValueOnce({ allowed: false, remaining: 0, resetMs: 60000 })

    const formData = new FormData()
    formData.set('email', 'test@mail.com')
    formData.set('password', 'validpass')

    const result = await loginAction(null, formData)

    expect(result.error).toContain('Demasiados intentos')
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })
})
