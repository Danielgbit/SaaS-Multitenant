import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { captureError } from '@/lib/error-logger'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/error-logger', () => ({
  captureError: vi.fn(),
}))

vi.mock('@/lib/auth/require-org-access', () => ({
  requireOrgAccess: vi.fn().mockResolvedValue({
    success: true,
    context: { userId: 'user-1', organizationId: 'org-1', role: 'admin' },
  }),
}))

vi.mock('@/lib/inventory/inventory-service', () => ({
  alignToLedger: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

interface MockQuery {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
}

const mockSingle = vi.fn()
const mockMaybeSingle = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockGte = vi.fn()
const mockIn = vi.fn()

function createMockQuery(selectReturn?: any): MockQuery {
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockUpdate = vi.fn()

  const query: MockQuery = {
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
    order: mockOrder,
    limit: mockLimit,
    update: mockUpdate,
    gte: mockGte,
    in: mockIn,
  }

  mockSelect.mockImplementation((arg?: string) => {
    if (arg === '*') return query
    if (selectReturn !== undefined) return selectReturn
    return query
  })

  mockEq.mockReturnValue(query)
  mockUpdate.mockReturnValue(query)
  mockOrder.mockReturnValue(query)
  mockLimit.mockReturnValue(query)
  mockGte.mockReturnValue(query)
  mockIn.mockReturnValue(query)

  return query
}

const mockFrom = vi.fn()
const mockSupabase = {
  from: mockFrom,
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  mockSingle.mockResolvedValue({ data: null, error: null })
})

const { resolveDivergence } = await import('../resolveDivergence')

const ORG_ID = 'org-1'
const DIVERGENCE_ID = 'div-1'
const ITEM_ID = 'item-1'

const OPEN_DIVERGENCE = {
  id: DIVERGENCE_ID,
  inventory_item_id: ITEM_ID,
  current_stock: 5,
  ledger_stock: 10,
  delta: 5,
  status: 'open',
  organization_id: ORG_ID,
}

describe('resolveDivergence', () => {
  describe('align', () => {
    it('captura error si update de divergencia falla (align)', async () => {
      mockSingle.mockResolvedValue({ data: OPEN_DIVERGENCE, error: null })

      const query = createMockQuery(Promise.resolve({ data: null, error: { message: 'network error' } }))
      mockFrom.mockReturnValue(query)

      const result = await resolveDivergence(DIVERGENCE_ID, 'align', ORG_ID)

      expect(captureError).toHaveBeenCalledWith(
        'inventory_divergence_align_update_error',
        expect.any(Object),
        expect.objectContaining({ divergenceId: DIVERGENCE_ID, organizationId: ORG_ID }),
      )
      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al alinear la divergencia.')
    })

    it('captura error si update de divergencia falla (dismiss)', async () => {
      mockSingle.mockResolvedValue({ data: OPEN_DIVERGENCE, error: null })

      const query = createMockQuery(Promise.resolve({ data: null, error: { message: 'network error' } }))
      mockFrom.mockReturnValue(query)

      const result = await resolveDivergence(DIVERGENCE_ID, 'dismiss', ORG_ID)

      expect(captureError).toHaveBeenCalledWith(
        'inventory_divergence_dismiss_update_error',
        expect.any(Object),
        expect.objectContaining({ divergenceId: DIVERGENCE_ID, organizationId: ORG_ID }),
      )
      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al descartar la divergencia.')
    })

    it('retorna mensaje de concurrencia si no hay filas afectadas y sin error', async () => {
      mockSingle.mockResolvedValue({ data: OPEN_DIVERGENCE, error: null })

      const query = createMockQuery(Promise.resolve({ data: [], error: null }))
      mockFrom.mockReturnValue(query)

      const result = await resolveDivergence(DIVERGENCE_ID, 'align', ORG_ID)

      expect(captureError).not.toHaveBeenCalled()
      expect(result.success).toBe(false)
      expect(result.error).toBe('La divergencia fue modificada por otro usuario.')
    })

    it('excepción en update de divergencia (align)', async () => {
      mockSingle.mockResolvedValue({ data: OPEN_DIVERGENCE, error: null })

      const query = createMockQuery(Promise.reject(new Error('db crash')))
      mockFrom.mockReturnValue(query)

      const result = await resolveDivergence(DIVERGENCE_ID, 'align', ORG_ID)

      expect(captureError).toHaveBeenCalledWith(
        'inventory_divergence_align_update_error',
        expect.any(Error),
        expect.objectContaining({ divergenceId: DIVERGENCE_ID, organizationId: ORG_ID }),
      )
      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al actualizar la divergencia.')
    })

    it('excepción en update de divergencia (dismiss)', async () => {
      mockSingle.mockResolvedValue({ data: OPEN_DIVERGENCE, error: null })

      const query = createMockQuery(Promise.reject(new Error('db crash')))
      mockFrom.mockReturnValue(query)

      const result = await resolveDivergence(DIVERGENCE_ID, 'dismiss', ORG_ID)

      expect(captureError).toHaveBeenCalledWith(
        'inventory_divergence_dismiss_update_error',
        expect.any(Error),
        expect.objectContaining({ divergenceId: DIVERGENCE_ID, organizationId: ORG_ID }),
      )
      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al descartar la divergencia.')
    })
  })
})
