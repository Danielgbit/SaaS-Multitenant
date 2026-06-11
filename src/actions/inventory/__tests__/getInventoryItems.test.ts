import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@db/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/auth/require-org-access', () => ({
  requireOrgAccess: vi.fn(),
}))

const mockRpc = vi.fn()

const execStub = {
  then: vi.fn((resolve: any) => resolve({ data: [], error: null })),
  or: vi.fn(() => execStub),
  eq: vi.fn(() => execStub),
}

const queryStub = {
  select: vi.fn(() => queryStub),
  eq: vi.fn(() => queryStub),
  or: vi.fn(() => queryStub),
  order: vi.fn(() => execStub),
}

const mockSupabase = {
  rpc: mockRpc,
  from: vi.fn(() => queryStub),
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)
  vi.mocked(requireOrgAccess).mockResolvedValue({
    success: true,
    context: { userId: 'user-1', organizationId: ORG_ID, role: 'admin' },
  })
})

const { getInventoryItems, getLowStockItems } = await import('../getInventoryItems')

const ORG_ID = '00000000-0000-0000-0000-000000000001'

describe('getInventoryItems', () => {
  describe('filtro lowStock', () => {
    it('usa RPC cuando lowStock = true', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      await getInventoryItems(ORG_ID, { lowStock: true })

      expect(mockRpc).toHaveBeenCalledWith('get_low_stock_items', {
        p_organization_id: ORG_ID,
        p_include_zero_min: false,
      })
    })

    it('envía p_include_zero_min=false al RPC', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      await getInventoryItems(ORG_ID, { lowStock: true })

      expect(mockRpc).toHaveBeenCalledWith(
        'get_low_stock_items',
        expect.objectContaining({ p_include_zero_min: false })
      )
    })

    it('usa consulta normal cuando lowStock no está definido', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      await getInventoryItems(ORG_ID)

      expect(mockRpc).not.toHaveBeenCalled()
      expect(mockSupabase.from).toHaveBeenCalledWith('inventory_items')
    })

    it('usa consulta normal cuando lowStock = false', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null })

      await getInventoryItems(ORG_ID, { lowStock: false })

      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('retorna datos del RPC al caller', async () => {
      const fakeItems = [{ id: '1', name: 'Item bajo', quantity: 2, min_quantity: 5 }]
      mockRpc.mockResolvedValue({ data: fakeItems, error: null })

      const result = await getInventoryItems(ORG_ID, { lowStock: true })

      expect(result).toEqual(fakeItems)
    })

    it('retorna array vacío si RPC falla (error)', async () => {
      mockRpc.mockResolvedValue({ data: null, error: new Error('RPC error') })

      const result = await getInventoryItems(ORG_ID, { lowStock: true })

      expect(result).toEqual([])
    })

    it('retorna array vacío si RPC devuelve data = null sin error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })

      const result = await getInventoryItems(ORG_ID, { lowStock: true })

      expect(result).toEqual([])
    })
  })
})

describe('getLowStockItems', () => {
  it('usa RPC get_low_stock_items con los mismos parámetros', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    await getLowStockItems(ORG_ID)

    expect(mockRpc).toHaveBeenCalledWith('get_low_stock_items', {
      p_organization_id: ORG_ID,
      p_include_zero_min: false,
    })
  })

  it('retorna array vacío en error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('error') })

    const result = await getLowStockItems(ORG_ID)

    expect(result).toEqual([])
  })
})
