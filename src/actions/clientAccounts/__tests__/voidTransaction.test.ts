import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTransaction, createProductSale } from '@/test/factories/clientAccount'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/actions/operation-entries/voidEntry', () => ({
  voidEntry: vi.fn(),
}))

function createQueryChain(returnData: unknown = null, returnError: unknown = null) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.neq = vi.fn().mockReturnValue(chain)
  chain.or = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: returnData, error: returnError })
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: returnData, error: returnError })
  chain.limit = vi.fn().mockReturnValue(chain)
  return chain
}

function createMockSupabase(role = 'owner', tables: Record<string, unknown> = {}) {
  const defaultQuery = createQueryChain()

  return {
    rpc: vi.fn().mockResolvedValue({
      data: [{ success: true, quantity_before: 10, quantity_after: 13 }],
      error: null,
    }),
    from: vi.fn((table: string) => {
      if (table === 'organization_members') {
        return createQueryChain({ role })
      }
      if (tables[table]) {
        return tables[table]
      }
      return defaultQuery
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      }),
    },
  }
}

describe('voidTransaction', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let voidTransaction: typeof import('@/actions/clientAccounts/voidTransaction').voidTransaction

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/voidTransaction')
    voidTransaction = mod.voidTransaction
  })

  it('retorna error si no hay autorizacion', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await voidTransaction('org-1', {
      transaction_id: 'txn-1',
      reason: 'Error en monto',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('No autorizado.')
  })

  it('retorna error si reason vacio', async () => {
    const result = await voidTransaction('org-1', {
      transaction_id: 'txn-1',
      reason: '',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('requerido')
  })

  it('retorna error si transaccion no existe', async () => {
    mockSupabase = createMockSupabase('owner', {
      client_account_transactions: createQueryChain(null, { message: 'Not found' }),
    })

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/voidTransaction')
    const result = await mod.voidTransaction('org-1', {
      transaction_id: 'txn-nonexistent',
      reason: 'Error en monto',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('no encontrada')
  })

  it('retorna error si transaccion ya anulada', async () => {
    mockSupabase = createMockSupabase('owner', {
      client_account_transactions: createQueryChain(createTransaction({ is_voided: true })),
    })

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/voidTransaction')
    const result = await mod.voidTransaction('org-1', {
      transaction_id: 'txn-1',
      reason: 'Error en monto',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('anulad')
  })

  it('retorna error si no tiene permisos', async () => {
    mockSupabase = createMockSupabase('staff', {
      client_account_transactions: createQueryChain(createTransaction({ transaction_type: 'payment' })),
    })

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/voidTransaction')
    const result = await mod.voidTransaction('org-1', {
      transaction_id: 'txn-1',
      reason: 'Error en monto',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Sin permiso')
  })

  it('marca is_voided = true', async () => {
    const txnQuery = createQueryChain(createTransaction({ transaction_type: 'payment' }))
    mockSupabase = createMockSupabase('owner', {
      client_account_transactions: txnQuery,
    })

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/voidTransaction')
    const result = await mod.voidTransaction('org-1', {
      transaction_id: 'txn-1',
      reason: 'Error en monto',
    })

    expect(result.success).toBe(true)
    expect(txnQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        is_voided: true,
      })
    )
  })

  it('setea voided_by y voided_at', async () => {
    const txnQuery = createQueryChain(createTransaction({ transaction_type: 'payment' }))
    mockSupabase = createMockSupabase('owner', {
      client_account_transactions: txnQuery,
    })

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/voidTransaction')
    await mod.voidTransaction('org-1', {
      transaction_id: 'txn-1',
      reason: 'Error en monto',
    })

    expect(txnQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        voided_by: 'user-1',
        voided_at: expect.any(String),
      })
    )
  })

  it('ejecuta correctamente para venta (verifica stock restoration)', async () => {
    mockSupabase = createMockSupabase('owner', {
      client_account_transactions: createQueryChain(createTransaction({ transaction_type: 'sale' })),
      client_product_sales: createQueryChain([createProductSale({ inventory_item_id: 'item-1', quantity: 3 })]),
      inventory_items: createQueryChain({ quantity: 10 }),
      operation_entries: createQueryChain(null),
    })

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const { voidEntry } = await import('@/actions/operation-entries/voidEntry')
    vi.mocked(voidEntry).mockResolvedValue({})

    const mod = await import('@/actions/clientAccounts/voidTransaction')
    const result = await mod.voidTransaction('org-1', {
      transaction_id: 'txn-1',
      reason: 'Venta duplicada',
    })

    expect(result.success).toBe(true)
  })

  it('continua si no existe operation_entry', async () => {
    const entryQuery = createQueryChain(null)
    entryQuery.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })

    mockSupabase = createMockSupabase('owner', {
      client_account_transactions: createQueryChain(createTransaction({ transaction_type: 'payment' })),
      operation_entries: entryQuery,
    })

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const { voidEntry } = await import('@/actions/operation-entries/voidEntry')
    vi.mocked(voidEntry).mockResolvedValue({})

    const mod = await import('@/actions/clientAccounts/voidTransaction')
    const result = await mod.voidTransaction('org-1', {
      transaction_id: 'txn-1',
      reason: 'Error en monto',
    })

    expect(result.success).toBe(true)
  })

  it('no restaura stock dos veces si ya esta anulada', async () => {
    mockSupabase = createMockSupabase('owner', {
      client_account_transactions: createQueryChain(createTransaction({ is_voided: true })),
    })

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/voidTransaction')
    const result = await mod.voidTransaction('org-1', {
      transaction_id: 'txn-1',
      reason: 'Ya anulado',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('anulad')
  })

  it('owner puede ejecutar la accion', async () => {
    mockSupabase = createMockSupabase('owner', {
      client_account_transactions: createQueryChain(createTransaction({ transaction_type: 'payment' })),
    })

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/voidTransaction')
    const result = await mod.voidTransaction('org-1', {
      transaction_id: 'txn-1',
      reason: 'Error en monto',
    })

    expect(result.success).toBe(true)
  })

  it('admin puede ejecutar la accion', async () => {
    mockSupabase = createMockSupabase('admin', {
      client_account_transactions: createQueryChain(createTransaction({ transaction_type: 'payment' })),
    })

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/voidTransaction')
    const result = await mod.voidTransaction('org-1', {
      transaction_id: 'txn-1',
      reason: 'Error en monto',
    })

    expect(result.success).toBe(true)
  })
})
