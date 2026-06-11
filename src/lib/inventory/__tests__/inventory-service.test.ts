import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { captureError } from '@/lib/error-logger'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@db/supabase'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/error-logger', () => ({ captureError: vi.fn() }))
vi.mock('@/lib/inventory/inventory-movement', () => ({
  recordInventoryMovement: vi.fn(),
}))

const mockRpc = vi.fn()
const mockSupabase = { rpc: mockRpc }

let adjust: ((params: any) => Promise<any>) | null = null
let restore: ((params: any) => Promise<any>) | null = null

beforeEach(async () => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)
  vi.resetModules()
  const service = await import('../inventory-service')
  adjust = service.adjust
  restore = service.restore
})

const ORG_ID = 'org-1'
const USER_ID = 'user-1'
const ITEM_ID = 'item-1'

describe('adjust — compensación', () => {
  const params = { item_id: ITEM_ID, quantity: 10, organization_id: ORG_ID, created_by: USER_ID }

  it('compensa con inventory_set_stock si movement falla', async () => {
    mockRpc.mockResolvedValue({ data: [{ success: true, quantity_before: 5, quantity_after: 10 }], error: null })

    const { recordInventoryMovement } = await import('@/lib/inventory/inventory-movement')
    vi.mocked(recordInventoryMovement).mockResolvedValue({ success: false })

    const result = await adjust!(params)

    expect(mockRpc).toHaveBeenCalledTimes(2)
    expect(mockRpc).toHaveBeenNthCalledWith(1, 'inventory_set_stock', {
      p_item_id: ITEM_ID, p_quantity: 10, p_organization_id: ORG_ID,
    })
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'inventory_set_stock', {
      p_item_id: ITEM_ID, p_quantity: 5, p_organization_id: ORG_ID,
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Error al registrar el movimiento')
  })

  it('loggea inconsistent_state si compensación también falla', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: [{ success: true, quantity_before: 5, quantity_after: 10 }], error: null })
      .mockResolvedValueOnce({ data: null, error: new Error('compensation failed') })

    const { recordInventoryMovement } = await import('@/lib/inventory/inventory-movement')
    vi.mocked(recordInventoryMovement).mockResolvedValue({ success: false })

    const result = await adjust!(params)

    expect(captureError).toHaveBeenCalledWith('inventory_adjust_inconsistent_state', expect.any(Error), expect.any(Object))
    expect(result.success).toBe(false)
    expect(result.error).toContain('Error crítico')
  })

  it('retorna éxito si movement funciona', async () => {
    mockRpc.mockResolvedValue({ data: [{ success: true, quantity_before: 5, quantity_after: 10 }], error: null })

    const { recordInventoryMovement } = await import('@/lib/inventory/inventory-movement')
    vi.mocked(recordInventoryMovement).mockResolvedValue({ success: true })

    const result = await adjust!(params)

    expect(mockRpc).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
  })
})

describe('restore — compensación', () => {
  const params = {
    item_id: ITEM_ID, quantity: 5, organization_id: ORG_ID, created_by: USER_ID,
    recordMovement: true, movementType: 'void' as const,
    sourceOperationId: 'op-1', referenceType: 'transaction' as const,
    referenceId: 'ref-1', reason: 'test',
  }

  it('compensa con inventory_decrement_stock si movement falla', async () => {
    mockRpc.mockResolvedValue({ data: [{ success: true, quantity_before: 5, quantity_after: 10 }], error: null })

    const { recordInventoryMovement } = await import('@/lib/inventory/inventory-movement')
    vi.mocked(recordInventoryMovement).mockResolvedValue({ success: false })

    const result = await restore!(params)

    expect(mockRpc).toHaveBeenCalledTimes(2)
    expect(mockRpc).toHaveBeenNthCalledWith(1, 'inventory_increment_stock', {
      p_item_id: ITEM_ID, p_quantity: 5, p_organization_id: ORG_ID,
    })
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'inventory_decrement_stock', {
      p_item_id: ITEM_ID, p_quantity: 5, p_organization_id: ORG_ID,
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Error al registrar el movimiento')
  })

  it('loggea inconsistent_state si compensación también falla', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: [{ success: true, quantity_before: 5, quantity_after: 10 }], error: null })
      .mockResolvedValueOnce({ data: null, error: new Error('compensation failed') })

    const { recordInventoryMovement } = await import('@/lib/inventory/inventory-movement')
    vi.mocked(recordInventoryMovement).mockResolvedValue({ success: false })

    const result = await restore!(params)

    expect(captureError).toHaveBeenCalledWith('inventory_restore_inconsistent_state', expect.any(Error), expect.any(Object))
    expect(result.success).toBe(false)
    expect(result.error).toContain('Error crítico')
  })

  it('retorna éxito si movement funciona', async () => {
    mockRpc.mockResolvedValue({ data: [{ success: true, quantity_before: 5, quantity_after: 10 }], error: null })

    const { recordInventoryMovement } = await import('@/lib/inventory/inventory-movement')
    vi.mocked(recordInventoryMovement).mockResolvedValue({ success: true })

    const result = await restore!(params)

    expect(mockRpc).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
  })

  it('no llama movement si recordMovement=false', async () => {
    mockRpc.mockResolvedValue({ data: [{ success: true, quantity_before: 5, quantity_after: 10 }], error: null })

    const result = await restore!({ item_id: ITEM_ID, quantity: 5, organization_id: ORG_ID, created_by: USER_ID, recordMovement: false })

    expect(mockRpc).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
  })
})
