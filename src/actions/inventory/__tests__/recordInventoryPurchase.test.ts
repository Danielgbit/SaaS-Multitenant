import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { captureError } from '@/lib/error-logger'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/error-logger', () => ({
  captureError: vi.fn(),
}))

vi.mock('@/lib/inventory/inventory-movement', () => ({
  recordInventoryMovement: vi.fn(),
}))

vi.mock('@/lib/auth/require-org-access', () => ({
  requireOrgAccess: vi.fn().mockResolvedValue({
    success: true,
    context: { userId: 'user-1', organizationId: 'org-1', role: 'admin' },
  }),
}))

const mockRpc = vi.fn()
const mockFrom = vi.fn()
const mockSingle = vi.fn()
const mockMaybeSingle = vi.fn()

const mockSupabase = {
  rpc: mockRpc,
  from: mockFrom,
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
}

function setupQuery() {
  const q = {
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
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  setupQuery()
})

const { recordInventoryPurchase } = await import('../recordInventoryPurchase')
const { consumeInventory } = await import('../consumeInventory')

const ORG_ID = 'org-1'

const VALID_PURCHASE = {
  item_id: 'item-1',
  quantity: 10,
  unit_cost: 5000,
  payment_status: 'paid' as const,
  payment_method: 'cash' as const,
}

const VALID_CONSUME = {
  item_id: 'item-1',
  quantity: 5,
}

const MOCK_ITEM = { id: 'item-1', name: 'Test', quantity: 5, organization_id: ORG_ID }

// ─── recordInventoryPurchase ─────────────────────────

describe('recordInventoryPurchase', () => {
  describe('FIX-007: validación cash session antes del stock', () => {
    it('retorna error si payment_status=paid y no hay cash session', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })

      const result = await recordInventoryPurchase(VALID_PURCHASE)

      expect(result.success).toBe(false)
      expect(result.error).toContain('No hay sesión de caja')
    })

    it('NO llama a inventory_increment_stock si no hay cash session', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })

      await recordInventoryPurchase(VALID_PURCHASE)

      expect(mockRpc).not.toHaveBeenCalled()
    })
  })

  describe('FIX-006: compensación de stock si movement falla', () => {
    it('compensa stock si movement falla y retorna error', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null })
      mockRpc.mockResolvedValue({ data: [{ success: true, quantity_before: 5, quantity_after: 15 }], error: null })

      const { recordInventoryMovement } = await import('@/lib/inventory/inventory-movement')
      vi.mocked(recordInventoryMovement).mockResolvedValue({ success: false })

      const result = await recordInventoryPurchase(VALID_PURCHASE)

      expect(mockRpc).toHaveBeenCalledWith('inventory_decrement_stock', expect.objectContaining({
        p_item_id: 'item-1',
        p_quantity: 10,
      }))
      expect(result.success).toBe(false)
      expect(result.error).toContain('Error al registrar el movimiento')
    })

    it('loggea error crítico si compensación también falla', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null })
      mockRpc
        .mockResolvedValueOnce({ data: [{ success: true, quantity_before: 5, quantity_after: 15 }], error: null })
        .mockResolvedValueOnce({ data: null, error: new Error('compensation failed') })

      const { recordInventoryMovement } = await import('@/lib/inventory/inventory-movement')
      vi.mocked(recordInventoryMovement).mockResolvedValue({ success: false })

      const result = await recordInventoryPurchase(VALID_PURCHASE)

      expect(captureError).toHaveBeenCalledWith(
        'inventory_purchase_inconsistent_state',
        expect.any(Error),
        expect.any(Object),
      )
      expect(result.success).toBe(false)
      expect(result.error).toContain('Error crítico')
    })
  })

  describe('FIX-008: verificar operation_entries.insert()', () => {
    it('captura error si insert de caja falla y retorna partialSuccess', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockMaybeSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null })
      mockRpc.mockResolvedValue({ data: [{ success: true, quantity_before: 5, quantity_after: 15 }], error: null })

      const { recordInventoryMovement } = await import('@/lib/inventory/inventory-movement')
      vi.mocked(recordInventoryMovement).mockResolvedValue({ success: true })

      const insertError = new Error('insert failed')
      const dualQ = { select: vi.fn(() => dualQ), eq: vi.fn(() => dualQ), single: mockSingle, maybeSingle: mockMaybeSingle, insert: vi.fn().mockResolvedValue({ data: null, error: insertError }) }
      mockFrom.mockReturnValue(dualQ)

      const result = await recordInventoryPurchase(VALID_PURCHASE)

      expect(captureError).toHaveBeenCalledWith('inventory_purchase_entry_failed', expect.any(Error), expect.any(Object))
      expect(result.success).toBe(false)
      expect(result.partialSuccess).toBe(true)
      expect(result.error).toContain('falló el registro en caja')
    })
  })
})

// ─── consumeInventory ─────────────────────────────────

describe('consumeInventory', () => {
  describe('FIX-006: compensación de stock si movement falla', () => {
    it('compensa stock si movement falla y retorna error', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockRpc.mockResolvedValue({ data: [{ success: true, quantity_before: 5, quantity_after: 0 }], error: null })

      const { recordInventoryMovement } = await import('@/lib/inventory/inventory-movement')
      vi.mocked(recordInventoryMovement).mockResolvedValue({ success: false })

      const result = await consumeInventory(VALID_CONSUME)

      expect(mockRpc).toHaveBeenCalledWith('inventory_increment_stock', expect.objectContaining({
        p_item_id: 'item-1',
        p_quantity: 5,
      }))
      expect(result.success).toBe(false)
      expect(result.error).toContain('Error al registrar el movimiento')
    })

    it('loggea error crítico si compensación también falla', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockRpc
        .mockResolvedValueOnce({ data: [{ success: true, quantity_before: 5, quantity_after: 0 }], error: null })
        .mockResolvedValueOnce({ data: null, error: new Error('compensation failed') })

      const { recordInventoryMovement } = await import('@/lib/inventory/inventory-movement')
      vi.mocked(recordInventoryMovement).mockResolvedValue({ success: false })

      const result = await consumeInventory(VALID_CONSUME)

      expect(captureError).toHaveBeenCalledWith(
        'inventory_consumption_inconsistent_state',
        expect.any(Error),
        expect.any(Object),
      )
      expect(result.success).toBe(false)
      expect(result.error).toContain('Error crítico')
    })
  })

  describe('FIX-008: verificar operation_entries.insert()', () => {
    it('captura error si insert de caja falla y retorna partialSuccess', async () => {
      mockSingle.mockResolvedValue({ data: MOCK_ITEM, error: null })
      mockRpc.mockResolvedValue({ data: [{ success: true, quantity_before: 5, quantity_after: 0 }], error: null })

      const { recordInventoryMovement } = await import('@/lib/inventory/inventory-movement')
      vi.mocked(recordInventoryMovement).mockResolvedValue({ success: true })

      mockMaybeSingle.mockResolvedValue({ data: { id: 'session-1' }, error: null })

      const insertError = new Error('insert failed')
      const dualQ = { select: vi.fn(() => dualQ), eq: vi.fn(() => dualQ), single: mockSingle, maybeSingle: mockMaybeSingle, insert: vi.fn().mockResolvedValue({ data: null, error: insertError }) }
      mockFrom.mockReturnValue(dualQ)

      const result = await consumeInventory(VALID_CONSUME)

      expect(captureError).toHaveBeenCalledWith('inventory_consumption_entry_failed', expect.any(Error), expect.any(Object))
      expect(result.success).toBe(false)
      expect(result.partialSuccess).toBe(true)
      expect(result.error).toContain('falló el registro en caja')
    })
  })
})
