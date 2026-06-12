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

const mockSupabase = {
  rpc: mockRpc,
  from: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)
  vi.mocked(requireOrgAccess).mockResolvedValue({
    success: true,
    context: { userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', organizationId: ORG_ID, role: 'admin' },
  })
})

const { createInventoryItem } = await import('../createInventoryItem')

const ORG_ID = '12345678-1234-4123-8abc-123456789abc'

const VALID_INPUT = {
  organization_id: ORG_ID,
  name: 'Test Item',
  quantity: 10,
  min_quantity: 5,
  unit: 'pieza',
}

describe('createInventoryItem', () => {
  it('success: calls RPC and revalidates paths', async () => {
    mockRpc.mockResolvedValue({
      data: [{ success: true, id: 'item-1' }],
      error: null,
    })

    const result = await createInventoryItem(VALID_INPUT)

    expect(mockRpc).toHaveBeenCalledWith('inventory_create_item_with_limit_check', expect.objectContaining({
      p_organization_id: ORG_ID,
      p_name: 'Test Item',
      p_quantity: 10,
      p_unit: 'pieza',
    }))
    expect(result.success).toBe(true)
    expect(result.itemId).toBe('item-1')
    expect(revalidatePath).toHaveBeenCalledWith('/inventario')
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
  })

  it('returns error on Zod validation failure', async () => {
    const result = await createInventoryItem({ ...VALID_INPUT, name: '' })

    expect(result.success).toBeFalsy()
    expect(result.error).toContain('nombre es requerido')
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('returns error when requireOrgAccess fails', async () => {
    vi.mocked(requireOrgAccess).mockResolvedValue({ success: false, error: 'Sin acceso' })

    const result = await createInventoryItem(VALID_INPUT)

    expect(result.success).toBeFalsy()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('returns error and captures when RPC returns error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('DB error') })

    const result = await createInventoryItem(VALID_INPUT)

    expect(result.success).toBeFalsy()
    expect(captureError).toHaveBeenCalled()
  })

  it('maps limit_exceeded error to user-friendly message', async () => {
    mockRpc.mockResolvedValue({
      data: [{ success: false, error: 'limit_exceeded', message: 'Max 50 items' }],
      error: null,
    })

    const result = await createInventoryItem(VALID_INPUT)

    expect(result.success).toBeFalsy()
    expect(result.error).toContain('Max 50 items')
  })

  it('handles null price and cost_price', async () => {
    mockRpc.mockResolvedValue({
      data: [{ success: true, id: 'item-2' }],
      error: null,
    })

    await createInventoryItem({ ...VALID_INPUT, price: null, cost_price: null })

    expect(mockRpc).toHaveBeenCalledWith('inventory_create_item_with_limit_check', expect.objectContaining({
      p_price: null,
      p_cost_price: null,
    }))
  })

  it('handles empty sku and description as null', async () => {
    mockRpc.mockResolvedValue({
      data: [{ success: true, id: 'item-3' }],
      error: null,
    })

    await createInventoryItem({ ...VALID_INPUT, sku: '', description: '' })

    expect(mockRpc).toHaveBeenCalledWith('inventory_create_item_with_limit_check', expect.objectContaining({
      p_sku: null,
      p_description: null,
    }))
  })
})
