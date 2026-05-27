import { vi } from 'vitest'

type MockQuery = {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  neq: ReturnType<typeof vi.fn>
  is: ReturnType<typeof vi.fn>
  not: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
}

export function createMockQuery(overrides: Partial<MockQuery> = {}): MockQuery {
  const makeChainable = (fn: ReturnType<typeof vi.fn>) => {
    const mock = vi.fn(fn)
    return mock
  }

  const query: MockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    ...overrides,
  }

  return query
}

type MockSupabase = {
  from: ReturnType<typeof vi.fn>
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
  rpc: ReturnType<typeof vi.fn>
  channel: ReturnType<typeof vi.fn>
}

export function createMockSupabase(overrides: Partial<MockSupabase> = {}): MockSupabase {
  const query = createMockQuery()

  const supabase: MockSupabase = {
    from: vi.fn(() => query),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    rpc: vi.fn(),
    channel: vi.fn(),
    ...overrides,
  }

  return supabase
}

export type { MockQuery, MockSupabase }
