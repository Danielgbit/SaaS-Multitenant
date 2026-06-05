import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSignOut = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { signOut: mockSignOut },
  })),
}))

const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({ redirect: mockRedirect }))

const { logoutAction } = await import('../index')

describe('logoutAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cierra sesión y redirige al login', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null })

    await logoutAction()

    expect(mockSignOut).toHaveBeenCalled()
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })
})
