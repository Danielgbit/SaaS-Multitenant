import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { captureError } from '@/lib/error-logger'
import { recordInventoryMovement } from '@/lib/inventory/inventory-movement'
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

vi.mock('@/lib/inventory/inventory-movement', () => ({
  recordInventoryMovement: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

const mockSingle = vi.fn()
const mockFrom = vi.fn()

const mockChain: Record<string, any> = {
  select: vi.fn(),
  eq: vi.fn(),
  update: vi.fn(),
  single: mockSingle,
  then: vi.fn((resolve: (value: any) => void) => resolve({ data: null, error: null })),
  catch: vi.fn(),
}

mockChain.select.mockReturnValue(mockChain)
mockChain.eq.mockReturnValue(mockChain)
mockChain.update.mockReturnValue(mockChain)

const mockSupabase = {
  rpc: vi.fn(),
  from: mockFrom,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)
  vi.mocked(requireOrgAccess).mockResolvedValue({
    success: true,
    context: { userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', organizationId: ORG_ID, role: 'admin' },
  })
  vi.mocked(recordInventoryMovement).mockResolvedValue({ success: true })
  mockFrom.mockReturnValue(mockChain)
  mockChain.then.mockImplementation((resolve: (value: any) => void) => resolve({ data: null, error: null }))
})

const { updateInventoryItem } = await import('../updateInventoryItem')

const ORG_ID = '12345678-1234-4123-8abc-123456789abc'
const ITEM_ID = '22345678-1234-4123-8abc-123456789abc'
const CURRENT_QUANTITY = 10

const BASE_INPUT = {
  id: ITEM_ID,
  organization_id: ORG_ID,
  name: 'Updated Item',
  quantity: CURRENT_QUANTITY,
  min_quantity: 5,
  unit: 'pieza',
}

describe('updateInventoryItem', () => {
  describe('success path', () => {
    it('updates item and revalidates when quantity unchanged', async () => {
      mockSingle.mockResolvedValue({ data: { id: ITEM_ID, quantity: CURRENT_QUANTITY }, error: null })

      const result = await updateInventoryItem(BASE_INPUT)

      expect(result.success).toBe(true)
      expect(recordInventoryMovement).not.toHaveBeenCalled()
      expect(mockChain.update).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/inventario')
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
    })

    it('records movement and updates when quantity changes', async () => {
      mockSingle.mockResolvedValue({ data: { id: ITEM_ID, quantity: CURRENT_QUANTITY }, error: null })

      const result = await updateInventoryItem({ ...BASE_INPUT, quantity: 15 })

      expect(result.success).toBe(true)
      expect(recordInventoryMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          inventoryItemId: ITEM_ID,
          organizationId: ORG_ID,
          movementType: 'adjustment',
          quantityChange: 5,
          quantityBefore: CURRENT_QUANTITY,
          quantityAfter: 15,
        }),
      )
      expect(mockChain.update).toHaveBeenCalled()
    })
  })

  describe('validation', () => {
    it('returns error on Zod validation failure', async () => {
      const result = await updateInventoryItem({ ...BASE_INPUT, name: '' })

      expect(result.success).toBeFalsy()
      expect(result.error).toContain('nombre es requerido')
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('returns error when requireOrgAccess fails', async () => {
      vi.mocked(requireOrgAccess).mockResolvedValue({ success: false, error: 'Sin acceso' })

      const result = await updateInventoryItem(BASE_INPUT)

      expect(result.success).toBeFalsy()
      expect(mockChain.update).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('returns error when item fetch fails', async () => {
      mockSingle.mockResolvedValue({ data: null, error: new Error('Not found') })

      const result = await updateInventoryItem(BASE_INPUT)

      expect(result.success).toBeFalsy()
      expect(result.error).toContain('Producto no encontrado')
      expect(mockChain.update).not.toHaveBeenCalled()
    })

    it('prevents update when recordInventoryMovement fails', async () => {
      mockSingle.mockResolvedValue({ data: { id: ITEM_ID, quantity: CURRENT_QUANTITY }, error: null })
      vi.mocked(recordInventoryMovement).mockResolvedValue({ success: false })

      const result = await updateInventoryItem({ ...BASE_INPUT, quantity: 15 })

      expect(result.success).toBeFalsy()
      expect(result.error).toContain('movimiento')
      expect(mockChain.update).not.toHaveBeenCalled()
    })

    it('returns error and captures when update fails', async () => {
      mockSingle.mockResolvedValue({ data: { id: ITEM_ID, quantity: CURRENT_QUANTITY }, error: null })
      mockChain.then.mockImplementation((resolve: (value: any) => void) =>
        resolve({ data: null, error: new Error('update failed') }),
      )

      const result = await updateInventoryItem({ ...BASE_INPUT, quantity: 15 })

      expect(result.success).toBeFalsy()
      expect(captureError).toHaveBeenCalledWith('inventory_update_error', expect.any(Error), expect.any(Object))
    })
  })
})
