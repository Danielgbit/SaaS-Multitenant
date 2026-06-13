import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { captureError } from '@/lib/error-logger'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@db/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/auth/require-org-access', () => ({
  requireOrgAccess: vi.fn(),
}))

vi.mock('@/lib/error-logger', () => ({
  captureError: vi.fn(),
}))

const mockFrom = vi.fn()

const mockChain: Record<string, any> = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
  then: vi.fn(),
  catch: vi.fn(),
}

mockChain.select.mockReturnValue(mockChain)
mockChain.eq.mockReturnValue(mockChain)
mockChain.order.mockReturnValue(mockChain)
mockChain.range.mockReturnValue(mockChain)

const mockSupabase = {
  from: mockFrom,
  rpc: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)
  vi.mocked(requireOrgAccess).mockResolvedValue({
    success: true,
    context: { userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', organizationId: ORG_ID, role: 'admin' },
  })
  mockFrom.mockReturnValue(mockChain)
  mockChain.then.mockImplementation((resolve: (value: any) => void) => resolve({ data: [], error: null, count: 0 }))
})

const { getInventoryMovements } = await import('../getInventoryMovements')

const ORG_ID = '12345678-1234-4123-8abc-123456789abc'
const ITEM_ID = '22345678-1234-4123-8abc-123456789abc'

const MOCK_MOVEMENTS = [
  {
    id: 'm1',
    organization_id: ORG_ID,
    inventory_item_id: ITEM_ID,
    movement_type: 'adjustment',
    quantity_change: 5,
    quantity_before: 10,
    quantity_after: 15,
    source_operation_id: null,
    reference_type: null,
    reference_id: null,
    reason: 'Test',
    metadata: {},
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
  },
]

describe('getInventoryMovements', () => {
  it('queries with correct filters and returns movements', async () => {
    mockChain.then.mockImplementation((resolve: (value: any) => void) =>
      resolve({ data: MOCK_MOVEMENTS, error: null, count: MOCK_MOVEMENTS.length }),
    )

    const result = await getInventoryMovements(ITEM_ID, ORG_ID, { limit: 20, offset: 0 })

    expect(mockFrom).toHaveBeenCalledWith('inventory_movements')
    expect(mockChain.select).toHaveBeenCalledWith('*', { count: 'exact' })
    expect(mockChain.eq).toHaveBeenCalledWith('inventory_item_id', ITEM_ID)
    expect(mockChain.eq).toHaveBeenCalledWith('organization_id', ORG_ID)
    expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(mockChain.order).toHaveBeenCalledWith('id', { ascending: false })
    expect(mockChain.range).toHaveBeenCalledWith(0, 19)
    expect(result).toEqual({ data: MOCK_MOVEMENTS, total: MOCK_MOVEMENTS.length })
  })

  it('returns empty data and total 0 when requireOrgAccess fails', async () => {
    vi.mocked(requireOrgAccess).mockResolvedValue({ success: false, error: 'Sin acceso' })

    const result = await getInventoryMovements(ITEM_ID, ORG_ID)

    expect(result).toEqual({ data: [], total: 0 })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns empty data and total 0 and captures error on query error', async () => {
    mockChain.then.mockImplementation((resolve: (value: any) => void) =>
      resolve({ data: null, error: new Error('query failed'), count: 0 }),
    )

    const result = await getInventoryMovements(ITEM_ID, ORG_ID)

    expect(result).toEqual({ data: [], total: 0 })
    expect(captureError).toHaveBeenCalledWith('inventory_movements_error', expect.any(Error), expect.any(Object))
  })

  it('returns empty data and total 0 when data is null', async () => {
    mockChain.then.mockImplementation((resolve: (value: any) => void) =>
      resolve({ data: null, error: null, count: 0 }),
    )

    const result = await getInventoryMovements(ITEM_ID, ORG_ID)

    expect(result).toEqual({ data: [], total: 0 })
  })

  it('uses default limit of 20 and offset 0 when not specified', async () => {
    mockChain.then.mockImplementation((resolve: (value: any) => void) =>
      resolve({ data: [], error: null, count: 0 }),
    )

    await getInventoryMovements(ITEM_ID, ORG_ID)

    expect(mockChain.range).toHaveBeenCalledWith(0, 19)
  })

  it('applies correct offset for pagination', async () => {
    mockChain.then.mockImplementation((resolve: (value: any) => void) =>
      resolve({ data: MOCK_MOVEMENTS, error: null, count: 25 }),
    )

    const result = await getInventoryMovements(ITEM_ID, ORG_ID, { limit: 10, offset: 10 })

    expect(mockChain.range).toHaveBeenCalledWith(10, 19)
    expect(result).toEqual({ data: MOCK_MOVEMENTS, total: 25 })
  })

  it('returns total 0 when count is null', async () => {
    mockChain.then.mockImplementation((resolve: (value: any) => void) =>
      resolve({ data: [], error: null, count: null }),
    )

    const result = await getInventoryMovements(ITEM_ID, ORG_ID)

    expect(result).toEqual({ data: [], total: 0 })
  })

  it('defaults limit and offset when options object is empty', async () => {
    mockChain.then.mockImplementation((resolve: (value: any) => void) =>
      resolve({ data: [], error: null, count: 0 }),
    )

    await getInventoryMovements(ITEM_ID, ORG_ID, {})

    expect(mockChain.range).toHaveBeenCalledWith(0, 19)
  })
})
