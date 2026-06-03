import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTransaction } from '@/test/factories/clientAccount'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

function createMockSupabase(role = 'owner') {
  const query = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
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

describe('updateAdjustment', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let updateAdjustment: typeof import('@/actions/clientAccounts/updateAdjustment').updateAdjustment

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const mod = await import('@/actions/clientAccounts/updateAdjustment')
    updateAdjustment = mod.updateAdjustment
  })

  it('retorna error si no hay autorizacion', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await updateAdjustment('org-1', {
      transaction_id: 'txn-1',
      description: 'Nueva descripcion',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('No autorizado')
  })

  it('retorna error si description vacia', async () => {
    const result = await updateAdjustment('org-1', {
      transaction_id: 'txn-1',
      description: '',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('requerida')
  })

  it('retorna error si transaccion no existe', async () => {
    const query = mockSupabase.from('client_account_transactions')
    query.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const result = await updateAdjustment('org-1', {
      transaction_id: 'txn-nonexistent',
      description: 'Nueva descripcion',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('no encontrada')
  })

  it('retorna error si transaccion no es adjustment', async () => {
    const query = mockSupabase.from('client_account_transactions')
    query.single.mockResolvedValue({
      data: createTransaction({ transaction_type: 'sale' }),
      error: null,
    })

    const result = await updateAdjustment('org-1', {
      transaction_id: 'txn-1',
      description: 'Nueva descripcion',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Solo se pueden editar ajustes')
  })

  it('retorna error si transaccion esta anulada', async () => {
    const query = mockSupabase.from('client_account_transactions')
    query.single.mockResolvedValue({
      data: createTransaction({ transaction_type: 'adjustment', is_voided: true }),
      error: null,
    })

    const result = await updateAdjustment('org-1', {
      transaction_id: 'txn-1',
      description: 'Nueva descripcion',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('anuladas')
  })

  it('retorna error si no tiene permisos', async () => {
    mockSupabase = createMockSupabase('staff')

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const query = mockSupabase.from('client_account_transactions')
    query.single.mockResolvedValue({
      data: createTransaction({ transaction_type: 'adjustment' }),
      error: null,
    })

    const mod = await import('@/actions/clientAccounts/updateAdjustment')
    const result = await mod.updateAdjustment('org-1', {
      transaction_id: 'txn-1',
      description: 'Nueva descripcion',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Sin permiso')
  })

  it('actualiza notes y payment_reference', async () => {
    const query = mockSupabase.from('client_account_transactions')
    query.single.mockResolvedValue({
      data: createTransaction({ transaction_type: 'adjustment' }),
      error: null,
    })

    const result = await updateAdjustment('org-1', {
      transaction_id: 'txn-1',
      description: 'Nueva descripcion',
      reference: 'REF-123',
    })

    expect(result.success).toBe(true)
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: 'Nueva descripcion',
        payment_reference: 'REF-123',
      })
    )
  })

  it('setea edited_by y edited_at', async () => {
    const query = mockSupabase.from('client_account_transactions')
    query.single.mockResolvedValue({
      data: createTransaction({ transaction_type: 'adjustment' }),
      error: null,
    })

    await updateAdjustment('org-1', {
      transaction_id: 'txn-1',
      description: 'Nueva descripcion',
    })

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        edited_by: 'user-1',
        edited_at: expect.any(String),
      })
    )
  })

  it('conserva amount intacto', async () => {
    const query = mockSupabase.from('client_account_transactions')
    query.single.mockResolvedValue({
      data: createTransaction({ transaction_type: 'adjustment', amount: 75000 }),
      error: null,
    })

    await updateAdjustment('org-1', {
      transaction_id: 'txn-1',
      description: 'Nueva descripcion',
    })

    const updateCall = vi.mocked(query.update).mock.calls[0]
    const updateData = updateCall[0] as Record<string, unknown>
    expect(updateData).not.toHaveProperty('amount')
  })

  it('owner puede ejecutar la accion', async () => {
    mockSupabase = createMockSupabase('owner')

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const query = mockSupabase.from('client_account_transactions')
    query.single.mockResolvedValue({
      data: createTransaction({ transaction_type: 'adjustment' }),
      error: null,
    })

    const mod = await import('@/actions/clientAccounts/updateAdjustment')
    const result = await mod.updateAdjustment('org-1', {
      transaction_id: 'txn-1',
      description: 'Nueva descripcion',
    })

    expect(result.success).toBe(true)
  })

  it('admin puede ejecutar la accion', async () => {
    mockSupabase = createMockSupabase('admin')

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const query = mockSupabase.from('client_account_transactions')
    query.single.mockResolvedValue({
      data: createTransaction({ transaction_type: 'adjustment' }),
      error: null,
    })

    const mod = await import('@/actions/clientAccounts/updateAdjustment')
    const result = await mod.updateAdjustment('org-1', {
      transaction_id: 'txn-1',
      description: 'Nueva descripcion',
    })

    expect(result.success).toBe(true)
  })
})
