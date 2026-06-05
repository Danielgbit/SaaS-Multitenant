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

function createMockSupabase(role = 'owner') {
  const query = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }

  return {
    from: vi.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
        }
      }
      return query
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      }),
    },
  }
}

describe('recordAdjustment', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let recordAdjustment: typeof import('@/actions/clientAccounts/recordAdjustment').recordAdjustment

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/recordAdjustment')
    recordAdjustment = mod.recordAdjustment
  })

  it('retorna error si no hay autorizacion', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await recordAdjustment('org-1', {
      client_id: 'client-1',
      amount: 10000,
      description: 'Cargo por servicio',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('No autorizado.')
  })

  it('retorna error si amount <= 0', async () => {
    const result = await recordAdjustment('org-1', {
      client_id: 'client-1',
      amount: 0,
      description: 'Cargo por servicio',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('monto debe ser mayor')
  })

  it('retorna error si description vacia', async () => {
    const result = await recordAdjustment('org-1', {
      client_id: 'client-1',
      amount: 10000,
      description: '',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('requerida')
  })

  it('retorna error si cliente no tiene cuenta', async () => {
    const query = mockSupabase.from('client_accounts')
    query.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const result = await recordAdjustment('org-1', {
      client_id: 'client-1',
      amount: 10000,
      description: 'Cargo por servicio',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('cuenta')
  })

  it('crea transaccion y operation_entry', async () => {
    const query = mockSupabase.from('client_accounts')
    query.single
      .mockResolvedValueOnce({ data: createClientAccount({ balance: 50000 }), error: null })
      .mockResolvedValueOnce({ data: { balance: 60000 }, error: null })

    mockSupabase.from('clients').single.mockResolvedValue({ data: { name: 'Test Client' }, error: null })
    mockSupabase.from('client_account_transactions').single.mockResolvedValue({ data: createTransaction({ id: 'txn-new' }), error: null })

    const { createEntryFromSource } = await import('@/actions/cash-sessions/createEntryFromSource')
    vi.mocked(createEntryFromSource).mockResolvedValue({ success: true, data: { id: 'entry-1' } as any })

    const result = await recordAdjustment('org-1', {
      client_id: 'client-1',
      amount: 10000,
      description: 'Cargo por servicio',
    })

    expect(result.success).toBe(true)
    expect(createEntryFromSource).toHaveBeenCalledWith(
      expect.objectContaining({
        entry_type: 'adjustment',
        direction: 'in',
        amount: 10000,
      })
    )
  })

  it('retorna error si createEntryFromSource falla', async () => {
    const query = mockSupabase.from('client_accounts')
    query.single
      .mockResolvedValueOnce({ data: createClientAccount({ balance: 50000 }), error: null })

    mockSupabase.from('clients').single.mockResolvedValue({ data: { name: 'Test Client' }, error: null })
    mockSupabase.from('client_account_transactions').single.mockResolvedValue({ data: createTransaction({ id: 'txn-new' }), error: null })

    const { createEntryFromSource } = await import('@/actions/cash-sessions/createEntryFromSource')
    vi.mocked(createEntryFromSource).mockResolvedValue({ success: false, error: 'No hay caja abierta' })

    const result = await recordAdjustment('org-1', {
      client_id: 'client-1',
      amount: 10000,
      description: 'Cargo por servicio',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Error al registrar en caja')
  })

  it('retorna nuevo balance correcto', async () => {
    const query = mockSupabase.from('client_accounts')
    query.single
      .mockResolvedValueOnce({ data: createClientAccount({ balance: 50000 }), error: null })
      .mockResolvedValueOnce({ data: { balance: 60000 }, error: null })

    mockSupabase.from('clients').single.mockResolvedValue({ data: { name: 'Test Client' }, error: null })
    mockSupabase.from('client_account_transactions').single.mockResolvedValue({ data: createTransaction({ id: 'txn-new' }), error: null })

    const { createEntryFromSource } = await import('@/actions/cash-sessions/createEntryFromSource')
    vi.mocked(createEntryFromSource).mockResolvedValue({ success: true, data: { id: 'entry-1' } as any })

    const result = await recordAdjustment('org-1', {
      client_id: 'client-1',
      amount: 10000,
      description: 'Cargo por servicio',
    })

    expect(result.success).toBe(true)
    expect(result.data?.new_balance).toBe(60000)
  })

  it('owner puede ejecutar la accion', async () => {
    mockSupabase = createMockSupabase('owner')

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const query = mockSupabase.from('client_accounts')
    query.single
      .mockResolvedValueOnce({ data: createClientAccount({ balance: 50000 }), error: null })
      .mockResolvedValueOnce({ data: { balance: 60000 }, error: null })

    mockSupabase.from('clients').single.mockResolvedValue({ data: { name: 'Test Client' }, error: null })
    mockSupabase.from('client_account_transactions').single.mockResolvedValue({ data: createTransaction({ id: 'txn-new' }), error: null })

    const { createEntryFromSource } = await import('@/actions/cash-sessions/createEntryFromSource')
    vi.mocked(createEntryFromSource).mockResolvedValue({ success: true, data: { id: 'entry-1' } as any })

    const mod = await import('@/actions/clientAccounts/recordAdjustment')
    const result = await mod.recordAdjustment('org-1', {
      client_id: 'client-1',
      amount: 10000,
      description: 'Cargo por servicio',
    })

    expect(result.success).toBe(true)
  })

  it('admin puede ejecutar la accion', async () => {
    mockSupabase = createMockSupabase('admin')

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const query = mockSupabase.from('client_accounts')
    query.single
      .mockResolvedValueOnce({ data: createClientAccount({ balance: 50000 }), error: null })
      .mockResolvedValueOnce({ data: { balance: 60000 }, error: null })

    mockSupabase.from('clients').single.mockResolvedValue({ data: { name: 'Test Client' }, error: null })
    mockSupabase.from('client_account_transactions').single.mockResolvedValue({ data: createTransaction({ id: 'txn-new' }), error: null })

    const { createEntryFromSource } = await import('@/actions/cash-sessions/createEntryFromSource')
    vi.mocked(createEntryFromSource).mockResolvedValue({ success: true, data: { id: 'entry-1' } as any })

    const mod = await import('@/actions/clientAccounts/recordAdjustment')
    const result = await mod.recordAdjustment('org-1', {
      client_id: 'client-1',
      amount: 10000,
      description: 'Cargo por servicio',
    })

    expect(result.success).toBe(true)
  })
})
