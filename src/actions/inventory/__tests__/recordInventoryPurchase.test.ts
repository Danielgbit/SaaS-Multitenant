import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
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
    context: { userId: 'user-1', organizationId: 'org-1', role: 'admin' },
  })
})

const { recordInventoryPurchase } = await import('../recordInventoryPurchase')

const ORG_ID = 'org-1'
const USER_ID = 'user-1'
const ITEM_ID = 'item-1'

const VALID_PURCHASE = {
  item_id: ITEM_ID,
  quantity: 10,
  unit_cost: 5000,
  payment_status: 'paid' as const,
  payment_method: 'cash' as const,
}

const MOCK_ITEM = { id: ITEM_ID, name: 'Test Item', organization_id: ORG_ID }

// ───────────────────────────────────────────────────
// recordInventoryPurchase
// ───────────────────────────────────────────────────

describe('recordInventoryPurchase', () => {
  describe('FIX-006: RPC transaccional', () => {
    it('llama inventory_record_purchase con todos los parámetros', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: true, error: null, quantity_before: 5, quantity_after: 15 }],
        error: null,
      })

      const result = await recordInventoryPurchase(VALID_PURCHASE)

      expect(mockRpc).toHaveBeenCalledWith('inventory_record_purchase', expect.objectContaining({
        p_item_id: ITEM_ID,
        p_quantity: 10,
        p_organization_id: ORG_ID,
        p_created_by: USER_ID,
        p_unit_cost: 5000,
        p_total_cost: 50000,
        p_payment_status: 'paid',
        p_cash_session_id: 'session-1',
        p_payment_method: 'cash',
      }))
      expect(result.success).toBe(true)
    })

    it('pasa cash_session_id=null cuando payment_status=pending', async () => {
      const pending = { ...VALID_PURCHASE, payment_status: 'pending' as const }
      delete (pending as { payment_method?: string }).payment_method

      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: true, error: null, quantity_before: 5, quantity_after: 15 }],
        error: null,
      })

      await recordInventoryPurchase(pending)

      expect(mockRpc).toHaveBeenCalledWith('inventory_record_purchase', expect.objectContaining({
        p_payment_status: 'pending',
        p_notes: undefined,
      }))
      expect(mockMaybeSingle).not.toHaveBeenCalled()
    })

    it('pasa p_cash_session_id como undefined cuando payment_status=pending', async () => {
      const pending = { ...VALID_PURCHASE, payment_status: 'pending' as const }
      delete (pending as { payment_method?: string }).payment_method

      vi.clearAllMocks()
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: true, error: null, quantity_before: 5, quantity_after: 15 }],
        error: null,
      })

      const callArgs: unknown[] = []
      mockRpc.mockImplementation((...args: unknown[]) => {
        callArgs.push(...args)
        return { data: [{ success: true, error: null, quantity_before: 5, quantity_after: 15 }], error: null }
      })

      await recordInventoryPurchase(pending)

      const params = callArgs[1] as Record<string, unknown>
      expect(params.p_cash_session_id).toBeUndefined()
      expect(params.p_payment_method).toBeUndefined()
    })

    it('retorna error si payment_status=paid y no hay cash session', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })

      const result = await recordInventoryPurchase(VALID_PURCHASE)

      expect(result.success).toBe(false)
      expect(result.error).toContain('No hay sesión de caja')
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('mapea error item_not_found del RPC a mensaje user-friendly', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: false, error: 'item_not_found', quantity_before: null, quantity_after: null }],
        error: null,
      })

      const result = await recordInventoryPurchase(VALID_PURCHASE)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Producto no encontrado')
    })

    it('mapea error invalid_payment_method del RPC', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: false, error: 'invalid_payment_method', quantity_before: null, quantity_after: null }],
        error: null,
      })

      const result = await recordInventoryPurchase(VALID_PURCHASE)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Método de pago inválido')
    })

    it('loggea error con captureError cuando RPC falla', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: false, error: 'update_failed', quantity_before: null, quantity_after: null }],
        error: null,
      })

      await recordInventoryPurchase(VALID_PURCHASE)

      expect(captureError).toHaveBeenCalledWith(
        'inventory_purchase_rpc_failed',
        expect.any(Error),
        expect.objectContaining({ itemId: ITEM_ID, organizationId: ORG_ID }),
      )
    })

    it('retorna error si requireOrgAccess falla', async () => {
      vi.mocked(requireOrgAccess).mockResolvedValue({ success: false, error: 'Sin acceso' })
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })

      const result = await recordInventoryPurchase(VALID_PURCHASE)

      expect(result.success).toBe(false)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('valida quantity > 0', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })

      const result = await recordInventoryPurchase({ ...VALID_PURCHASE, quantity: 0 })

      expect(result.success).toBe(false)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('valida unit_cost > 0', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })

      const result = await recordInventoryPurchase({ ...VALID_PURCHASE, unit_cost: -100 })

      expect(result.success).toBe(false)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('NO llama a RPCs antiguas inventory_increment_stock ni inventory_decrement_stock', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: true, error: null, quantity_before: 5, quantity_after: 15 }],
        error: null,
      })

      await recordInventoryPurchase(VALID_PURCHASE)

      const rpcCalls = mockRpc.mock.calls.map((c) => c[0])
      expect(rpcCalls).not.toContain('inventory_increment_stock')
      expect(rpcCalls).not.toContain('inventory_decrement_stock')
    })

    it('llama revalidatePath en éxito', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null })
      mockRpc.mockResolvedValue({
        data: [{ success: true, error: null, quantity_before: 5, quantity_after: 15 }],
        error: null,
      })

      await recordInventoryPurchase(VALID_PURCHASE)

      expect(revalidatePath).toHaveBeenCalledWith('/inventario')
      expect(revalidatePath).toHaveBeenCalledWith('/caja')
    })
  })
})
