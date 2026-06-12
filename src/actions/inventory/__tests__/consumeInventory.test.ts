import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
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

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

const mockRpc = vi.fn()
const mockFrom = vi.fn()
const mockSingle = vi.fn()
const mockMaybeSingle = vi.fn()

const mockSupabase = {
  rpc: mockRpc,
  from: mockFrom,
}

function setupChainableQuery() {
  const q: {
    select: ReturnType<typeof vi.fn>
    eq: ReturnType<typeof vi.fn>
    single: typeof mockSingle
    maybeSingle: typeof mockMaybeSingle
  } = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  }
  mockFrom.mockReturnValue(q)
  return q
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)
  setupChainableQuery()
  vi.mocked(requireOrgAccess).mockResolvedValue({
    success: true,
    context: { userId: USER_ID, organizationId: ORG_ID, role: 'admin' },
  })
})

const { consumeInventory } = await import('../consumeInventory')

const ORG_ID = 'org-1'
const USER_ID = 'user-1'
const ITEM_ID = 'item-1'
const CASH_SESSION_ID = 'session-1'

const VALID_CONSUME = {
  item_id: ITEM_ID,
  quantity: 5,
}

const MOCK_ITEM = { id: ITEM_ID, name: 'Test Item', organization_id: ORG_ID }

// ───────────────────────────────────────────────────
// consumeInventory
// ───────────────────────────────────────────────────

describe('consumeInventory', () => {
  describe('FIX-006: RPC transaccional', () => {
    it('llama inventory_record_consumption con cash_session_id cuando hay sesión', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: CASH_SESSION_ID }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: true, error: null, quantity_before: 10, quantity_after: 5 }],
        error: null,
      })

      const result = await consumeInventory(VALID_CONSUME)

      expect(mockRpc).toHaveBeenCalledWith(
        'inventory_record_consumption',
        expect.objectContaining({
          p_item_id: ITEM_ID,
          p_quantity: 5,
          p_organization_id: ORG_ID,
          p_created_by: USER_ID,
          p_cash_session_id: CASH_SESSION_ID,
        }),
      )
      expect(result.success).toBe(true)
    })

    it('pasa cash_session_id=undefined cuando no hay sesión abierta', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: true, error: null, quantity_before: 10, quantity_after: 5 }],
        error: null,
      })

      await consumeInventory(VALID_CONSUME)

      expect(mockRpc).toHaveBeenCalledTimes(1)
      expect(mockRpc).toHaveBeenCalledWith(
        'inventory_record_consumption',
        expect.objectContaining({
          p_item_id: ITEM_ID,
          p_quantity: 5,
        }),
      )
    })

    it('busca cash session ANTES de llamar al RPC', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: CASH_SESSION_ID }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: true, error: null, quantity_before: 10, quantity_after: 5 }],
        error: null,
      })

      await consumeInventory(VALID_CONSUME)

      const sessionCallOrder = mockMaybeSingle.mock.invocationCallOrder[0]
      const rpcCallOrder = mockRpc.mock.invocationCallOrder[0]
      expect(sessionCallOrder).toBeLessThan(rpcCallOrder)
    })

    it('incluye estimated_cost cuando se proporciona', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: CASH_SESSION_ID }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: true, error: null, quantity_before: 10, quantity_after: 5 }],
        error: null,
      })

      await consumeInventory({ ...VALID_CONSUME, estimated_cost: 15000 })

      expect(mockRpc).toHaveBeenCalledWith(
        'inventory_record_consumption',
        expect.objectContaining({
          p_estimated_cost: 15000,
        }),
      )
    })

    it('incluye notes cuando se proporciona', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: CASH_SESSION_ID }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: true, error: null, quantity_before: 10, quantity_after: 5 }],
        error: null,
      })

      await consumeInventory({ ...VALID_CONSUME, notes: 'Uso de limpieza' })

      expect(mockRpc).toHaveBeenCalledWith(
        'inventory_record_consumption',
        expect.objectContaining({
          p_notes: 'Uso de limpieza',
        }),
      )
    })

    it('mapea error insufficient_stock del RPC a "Stock insuficiente."', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: CASH_SESSION_ID }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: false, error: 'insufficient_stock', quantity_before: null, quantity_after: null }],
        error: null,
      })

      const result = await consumeInventory(VALID_CONSUME)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Stock insuficiente')
    })

    it('retorna error genérico para otros errores de RPC', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: CASH_SESSION_ID }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: false, error: 'organization_mismatch', quantity_before: null, quantity_after: null }],
        error: null,
      })

      const result = await consumeInventory(VALID_CONSUME)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Error al consumir inventario')
    })

    it('valida quantity > 0', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })

      const result = await consumeInventory({ ...VALID_CONSUME, quantity: 0 })

      expect(result.success).toBe(false)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('NO llama a RPCs antiguas inventory_decrement_stock ni inventory_increment_stock', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: CASH_SESSION_ID }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: true, error: null, quantity_before: 10, quantity_after: 5 }],
        error: null,
      })

      await consumeInventory(VALID_CONSUME)

      const rpcCalls = mockRpc.mock.calls.map((c) => c[0])
      expect(rpcCalls).not.toContain('inventory_decrement_stock')
      expect(rpcCalls).not.toContain('inventory_increment_stock')
    })

    it('llama revalidatePath en éxito', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: CASH_SESSION_ID }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: true, error: null, quantity_before: 10, quantity_after: 5 }],
        error: null,
      })

      await consumeInventory(VALID_CONSUME)

      expect(revalidatePath).toHaveBeenCalledWith('/inventario')
      expect(revalidatePath).toHaveBeenCalledWith('/caja')
    })
  })
})
