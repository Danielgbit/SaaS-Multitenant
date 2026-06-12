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

const mockFrom = vi.fn()

const mockChain: Record<string, any> = {
  update: vi.fn(),
  eq: vi.fn(),
  then: vi.fn((resolve: (value: any) => void) => resolve({ data: null, error: null })),
  catch: vi.fn(),
}

mockChain.update.mockReturnValue(mockChain)
mockChain.eq.mockReturnValue(mockChain)

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
  mockChain.then.mockImplementation((resolve: (value: any) => void) => resolve({ data: null, error: null }))
})

const { deleteInventoryItem } = await import('../deleteInventoryItem')

const ORG_ID = '12345678-1234-4123-8abc-123456789abc'
const ITEM_ID = '22345678-1234-4123-8abc-123456789abc'

const VALID_INPUT = {
  id: ITEM_ID,
  organization_id: ORG_ID,
}

describe('deleteInventoryItem', () => {
  it('soft-deletes item and revalidates paths', async () => {
    const result = await deleteInventoryItem(VALID_INPUT)

    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    )
    expect(mockFrom).toHaveBeenCalledWith('inventory_items')
    expect(result.success).toBe(true)
    expect(revalidatePath).toHaveBeenCalledWith('/inventario')
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
  })

  it('returns error on Zod validation failure', async () => {
    const result = await deleteInventoryItem({ id: '', organization_id: '' })

    expect(result.success).toBeFalsy()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns error when requireOrgAccess fails', async () => {
    vi.mocked(requireOrgAccess).mockResolvedValue({ success: false, error: 'Sin acceso' })

    const result = await deleteInventoryItem(VALID_INPUT)

    expect(result.success).toBeFalsy()
    expect(mockChain.update).not.toHaveBeenCalled()
  })

  it('returns error and captures when update fails', async () => {
    mockChain.then.mockImplementation((resolve: (value: any) => void) =>
      resolve({ data: null, error: new Error('delete failed') }),
    )

    const result = await deleteInventoryItem(VALID_INPUT)

    expect(result.success).toBeFalsy()
    expect(captureError).toHaveBeenCalledWith('inventory_delete_error', expect.any(Error), expect.any(Object))
  })

  it('handles updated_at gracefully', async () => {
    const result = await deleteInventoryItem(VALID_INPUT)

    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        active: false,
        updated_at: expect.any(String),
      }),
    )
    expect(result.success).toBe(true)
  })
})
