import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { captureError } from '@/lib/error-logger'
import * as inventoryService from '@/lib/inventory/inventory-service'
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

vi.mock('@/lib/inventory/inventory-service', () => ({
  adjust: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

const mockSupabase = {
  rpc: vi.fn(),
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

const { adjustStock } = await import('../adjustStock')

const ORG_ID = '12345678-1234-4123-8abc-123456789abc'
const ITEM_ID = '22345678-1234-4123-8abc-123456789abc'

const VALID_INPUT = {
  id: ITEM_ID,
  organization_id: ORG_ID,
  quantity: 25,
}

describe('adjustStock', () => {
  it('delegates to inventoryService.adjust and revalidates', async () => {
    vi.mocked(inventoryService.adjust).mockResolvedValue({ success: true })

    const result = await adjustStock(VALID_INPUT)

    expect(inventoryService.adjust).toHaveBeenCalledWith({
      item_id: ITEM_ID,
      quantity: 25,
      organization_id: ORG_ID,
      created_by: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    })
    expect(result.success).toBe(true)
    expect(revalidatePath).toHaveBeenCalledWith('/inventario')
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
  })

  it('returns error on Zod validation failure', async () => {
    const result = await adjustStock({ id: '', organization_id: '', quantity: -1 })

    expect(result.success).toBeFalsy()
    expect(inventoryService.adjust).not.toHaveBeenCalled()
  })

  it('returns error when requireOrgAccess fails', async () => {
    vi.mocked(requireOrgAccess).mockResolvedValue({ success: false, error: 'Sin acceso' })

    const result = await adjustStock(VALID_INPUT)

    expect(result.success).toBeFalsy()
    expect(inventoryService.adjust).not.toHaveBeenCalled()
  })

  it('returns error when adjust returns error', async () => {
    vi.mocked(inventoryService.adjust).mockResolvedValue({ success: false, error: 'Stock inválido' })

    const result = await adjustStock(VALID_INPUT)

    expect(result.success).toBeFalsy()
    expect(result.error).toContain('Stock inválido')
  })

  it('captures error when adjust throws', async () => {
    vi.mocked(inventoryService.adjust).mockRejectedValue(new Error('Service crash'))

    const result = await adjustStock(VALID_INPUT)

    expect(result.success).toBeFalsy()
    expect(captureError).toHaveBeenCalledWith('inventory_adjust_failed', expect.any(Error), expect.any(Object))
  })
})
