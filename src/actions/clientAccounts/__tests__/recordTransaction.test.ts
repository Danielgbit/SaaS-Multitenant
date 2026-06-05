import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClientAccount, createTransaction } from '@/test/factories/clientAccount'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/actions/cash-sessions/createEntryFromSource', () => ({
  createEntryFromSource: vi.fn(),
}))

function createMockSupabase(overrides: { user?: unknown; account?: unknown; transaction?: unknown; member?: unknown } = {}) {
  const query = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: [{ id: 'item-1', name: 'Test Product' }], error: null }),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }

  return {
    from: vi.fn(() => query),
    rpc: vi.fn().mockResolvedValue({
      data: [{ success: true, quantity_before: 10, quantity_after: 5 }],
      error: null,
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: overrides.user ?? { id: 'user-1', email: 'test@example.com' } },
        error: null,
      }),
    },
  }
}

describe('recordPayment', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let recordPayment: typeof import('@/actions/clientAccounts/recordTransaction').recordPayment

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/recordTransaction')
    recordPayment = mod.recordPayment
  })

  it('retorna error si no hay autorizacion', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await recordPayment('org-1', {
      client_id: 'client-1',
      amount: 10000,
      payment_method: 'cash',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('No autorizado')
  })

  it('retorna error si amount > balance', async () => {
    const query = mockSupabase.from()
    query.single.mockResolvedValue({
      data: createClientAccount({ balance: 5000 }),
      error: null,
    })

    const result = await recordPayment('org-1', {
      client_id: 'client-1',
      amount: 10000,
      payment_method: 'cash',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('monto no puede exceder')
  })

  it('crea transaccion con transaction_type payment', async () => {
    const query = mockSupabase.from()
    query.single
      .mockResolvedValueOnce({ data: createClientAccount({ balance: 50000 }), error: null })
      .mockResolvedValueOnce({ data: { name: 'Test Client' }, error: null })
      .mockResolvedValueOnce({ data: createTransaction({ id: 'txn-new' }), error: null })

    const { createEntryFromSource } = await import('@/actions/cash-sessions/createEntryFromSource')
    vi.mocked(createEntryFromSource).mockResolvedValue({ success: true, data: { id: 'entry-1' } as any })

    const result = await recordPayment('org-1', {
      client_id: 'client-1',
      amount: 10000,
      payment_method: 'cash',
    })

    expect(result.success).toBe(true)
    expect(result.data?.transaction_id).toBe('txn-new')
  })

  it('crea operation_entry en caja', async () => {
    const query = mockSupabase.from()
    query.single
      .mockResolvedValueOnce({ data: createClientAccount({ balance: 50000 }), error: null })
      .mockResolvedValueOnce({ data: { name: 'Test Client' }, error: null })
      .mockResolvedValueOnce({ data: createTransaction({ id: 'txn-new' }), error: null })

    const { createEntryFromSource } = await import('@/actions/cash-sessions/createEntryFromSource')
    vi.mocked(createEntryFromSource).mockResolvedValue({ success: true, data: { id: 'entry-1' } as any })

    await recordPayment('org-1', {
      client_id: 'client-1',
      amount: 10000,
      payment_method: 'cash',
    })

    expect(createEntryFromSource).toHaveBeenCalledWith(
      expect.objectContaining({
        entry_type: 'account_payment',
        source_type: 'client_account_payment',
        direction: 'in',
        amount: 10000,
      })
    )
  })

  it('retorna error si createEntryFromSource falla', async () => {
    const query = mockSupabase.from()
    query.single
      .mockResolvedValueOnce({ data: createClientAccount({ balance: 50000 }), error: null })
      .mockResolvedValueOnce({ data: { name: 'Test Client' }, error: null })
      .mockResolvedValueOnce({ data: createTransaction({ id: 'txn-new' }), error: null })

    const { createEntryFromSource } = await import('@/actions/cash-sessions/createEntryFromSource')
    vi.mocked(createEntryFromSource).mockResolvedValue({ success: false, error: 'No hay caja abierta' })

    const result = await recordPayment('org-1', {
      client_id: 'client-1',
      amount: 10000,
      payment_method: 'cash',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Error al registrar en caja')
  })
})

describe('recordSale (contado)', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let recordSale: typeof import('@/actions/clientAccounts/recordTransaction').recordSale

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/recordTransaction')
    recordSale = mod.recordSale
  })

  it('retorna error si createEntryFromSource falla', async () => {
    const query = mockSupabase.from()
    query.single
      .mockResolvedValueOnce({ data: { id: 'client-1', name: 'Test Client' }, error: null })
      .mockResolvedValueOnce({ data: { role: 'owner' }, error: null })

    const { createEntryFromSource } = await import('@/actions/cash-sessions/createEntryFromSource')
    vi.mocked(createEntryFromSource).mockResolvedValue({ success: false, error: 'No hay caja abierta' })

    const result = await recordSale('org-1', {
      client_id: 'client-1',
      products: [{ inventory_item_id: 'item-1', quantity: 1, unit_price: 50000 }],
      payment_method: 'cash',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Error al registrar en caja')
  })

})

describe('recordSale (credito)', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let recordSale: typeof import('@/actions/clientAccounts/recordTransaction').recordSale

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/recordTransaction')
    recordSale = mod.recordSale
  })

  it('crea client_product_sales y retorna balance actualizado', async () => {
    const query = mockSupabase.from()
    query.single
      .mockResolvedValueOnce({ data: { id: 'client-1', name: 'Test Client' }, error: null })
      .mockResolvedValueOnce({ data: { role: 'owner' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'account-1', balance: 0 }, error: null })
      .mockResolvedValueOnce({ data: { id: 'txn-new' }, error: null })
      .mockResolvedValueOnce({ data: { balance: 60000 }, error: null })

    const result = await recordSale('org-1', {
      client_id: 'client-1',
      products: [
        { inventory_item_id: 'item-1', quantity: 2, unit_price: 25000 },
        { inventory_item_id: 'item-2', quantity: 1, unit_price: 10000 },
      ],
      payment_method: 'credit',
    })

    expect(result.success).toBe(true)
    expect(result.data?.total_amount).toBe(60000)
    expect(result.data?.new_balance).toBe(60000)
    expect(result.data?.transaction_id).toBe('txn-new')
  })
})
