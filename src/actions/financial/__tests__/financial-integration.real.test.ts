// @vitest-environment node
import { config } from 'dotenv'
import { resolve } from 'path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { randomUUID } from 'crypto'

config({ path: resolve(process.cwd(), '.env.local') })

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const describeDb = URL && KEY ? describe : describe.skip

describeDb('Financial Integration — real DB', () => {
  let fixtures: Awaited<ReturnType<typeof import('@/test/helpers/create-test-fixtures')['createFixtures']>>

  beforeAll(async () => {
    const { createFixtures } = await import('@/test/helpers/create-test-fixtures')
    fixtures = await createFixtures()
  })

  afterAll(async () => {
    if (fixtures) {
      const { destroyFixtures } = await import('@/test/helpers/create-test-fixtures')
      await destroyFixtures(fixtures)
    }
  })

  it('INV-001: period_commissions row persists with correct FK and amount', async () => {
    const { supabase, aptId, aptSvcId, svcId, payrollItemId } = fixtures

    const { error, data } = await supabase
      .from('period_commissions')
      .insert({
        payroll_item_id: payrollItemId,
        appointment_id: aptId,
        appointment_service_id: aptSvcId,
        service_id: svcId,
        service_date: new Date().toISOString().split('T')[0],
        service_name: 'Test Service',
        service_value: 50000,
        percentage_applied: 60,
        commission_amount: 30000,
      })
      .select('id, commission_amount, appointment_id')

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].appointment_id).toBe(aptId)
    expect(data![0].commission_amount).toBe(30000)
  })

  it('INV-002: financial_events commission_accrued row persists', async () => {
    const { supabase, orgId, aptId, aptSvcId } = fixtures
    const eventKey = `test_comm_${randomUUID()}`

    const { error, data } = await supabase
      .from('financial_events')
      .insert({
        organization_id: orgId,
        event_type: 'commission_accrued',
        source_table: 'appointment_services',
        source_id: aptSvcId,
        entity_type: 'appointment',
        entity_id: aptId,
        occurred_by_type: 'system',
        amount: -30000,
        currency: 'COP',
        idempotency_key: eventKey,
        status: 'settled',
        metadata: { service_id: fixtures.svcId, service_name: 'Test Service' },
        occurred_at: new Date().toISOString(),
      })
      .select('id, amount, entity_id')

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].entity_id).toBe(aptId)
    expect(data![0].amount).toBe(-30000)
  })

  it('INV-004: UNIQUE idempotency_key prevents duplicate commission event', async () => {
    const { supabase, orgId, aptId, aptSvcId } = fixtures
    const key = `test_uniq_${randomUUID()}`
    const base = {
      organization_id: orgId,
      event_type: 'commission_accrued' as const,
      source_table: 'appointment_services',
      source_id: aptSvcId,
      entity_type: 'appointment' as const,
      entity_id: aptId,
      occurred_by_type: 'system' as const,
      amount: -30000,
      currency: 'COP',
      idempotency_key: key,
      status: 'settled' as const,
      metadata: {},
      occurred_at: new Date().toISOString(),
    }

    const { error: err1 } = await supabase.from('financial_events').insert(base)
    expect(err1).toBeNull()

    const { error: err2 } = await supabase.from('financial_events').insert(base)
    expect(err2).not.toBeNull()
    expect(err2?.code).toBe('23505')
  })

  it('INV-005: direct duplicate insert fails but upsert with ignoreDuplicates succeeds', async () => {
    const { supabase, aptId, aptSvcId, svcId, payrollItemId } = fixtures

    const base = {
      payroll_item_id: payrollItemId,
      appointment_id: aptId,
      appointment_service_id: aptSvcId,
      service_id: svcId,
      service_date: new Date().toISOString().split('T')[0],
      service_name: 'Test Service',
      service_value: 50000,
      percentage_applied: 60,
      commission_amount: 30000,
    }

    const { error: directErr } = await supabase.from('period_commissions').insert(base)
    expect(directErr).not.toBeNull()
    expect(directErr?.code).toBe('23505')

    const { error: upsertErr } = await supabase
      .from('period_commissions')
      .upsert(base, { onConflict: 'payroll_item_id, appointment_id, service_id', ignoreDuplicates: true })

    expect(upsertErr).toBeNull()
  })

  it('INV-006: financial_events is append-only (no UPDATE)', async () => {
    const { supabase, orgId, aptId, aptSvcId } = fixtures
    const key = `test_append_${randomUUID()}`

    const { data: inserted } = await supabase
      .from('financial_events')
      .insert({
        organization_id: orgId,
        event_type: 'commission_accrued',
        source_table: 'appointment_services',
        source_id: aptSvcId,
        entity_type: 'appointment',
        entity_id: aptId,
        occurred_by_type: 'system',
        amount: -30000,
        currency: 'COP',
        idempotency_key: key,
        status: 'settled',
        metadata: {},
        occurred_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    expect(inserted).not.toBeNull()

    const { error: updateErr } = await supabase
      .from('financial_events')
      .update({ amount: -50000 })
      .eq('id', inserted!.id)

    expect(updateErr).not.toBeNull()
  })
})
