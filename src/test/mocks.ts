import { vi } from 'vitest'

export function createMockSupabaseClient(overrides?: Record<string, unknown>) {
  const defaultData = { data: null, error: null }
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(defaultData),
    maybeSingle: vi.fn().mockResolvedValue(defaultData),
    onConflict: vi.fn().mockReturnThis(),
    ignoreDuplicates: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    returns: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    ...overrides,
  }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@mail.com' } }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    from: vi.fn(() => chainable),
    rpc: vi.fn().mockResolvedValue(defaultData),
    channel: vi.fn().mockReturnThis(),
    ...chainable,
  }
}

export function mockEnv() {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
}

export function mockRequireOrgAccess(success = true) {
  vi.mock('@/lib/auth/require-org-access', () => ({
    requireOrgAccess: vi.fn().mockResolvedValue(
      success
        ? { success: true, context: { userId: 'user-1', organizationId: 'org-1', role: 'admin' } }
        : { success: false, error: 'No autorizado.' }
    ),
    requireCurrentOrganization: vi.fn().mockResolvedValue(
      success
        ? { success: true, context: { userId: 'user-1', organizationId: 'org-1', role: 'admin' } }
        : { success: false, error: 'No autorizado.' }
    ),
  }))
}

export function mockNextNavigation() {
  vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
  }))
}

export function mockNextCache() {
  vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
  }))
}
