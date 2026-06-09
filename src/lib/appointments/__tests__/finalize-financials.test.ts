import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/actions/payroll/addAppointmentToPayroll', () => ({
  addAppointmentToPayroll: vi.fn(),
}))
vi.mock('@/actions/financial/recordCommissionAccrual', () => ({
  recordCommissionAccrual: vi.fn(),
}))

const { finalizeAppointmentFinancials } = await import(
  '@/lib/appointments/finalize-financials'
)
const { addAppointmentToPayroll } = await import(
  '@/actions/payroll/addAppointmentToPayroll'
)
const { recordCommissionAccrual } = await import(
  '@/actions/financial/recordCommissionAccrual'
)

describe('finalizeAppointmentFinancials', () => {
  const aptId = '00000000-0000-0000-0000-000000000001'
  const orgId = '00000000-0000-0000-0000-000000000002'
  const empId = '00000000-0000-0000-0000-000000000003'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ejecuta payroll y commission con exito', async () => {
    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: true,
      data: {
        period_id: 'p1',
        payroll_item_id: 'pi1',
        services_added: 1,
      },
    })
    vi.mocked(recordCommissionAccrual).mockResolvedValue({ success: true })

    const result = await finalizeAppointmentFinancials(
      aptId,
      orgId,
      empId,
      'test'
    )

    expect(result.payroll.attempted).toBe(true)
    expect(result.payroll.success).toBe(true)
    expect(result.payroll.data?.period_id).toBe('p1')
    expect(result.commission.attempted).toBe(true)
    expect(result.commission.success).toBe(true)
  })

  it('reporta payroll fallido sin bloquear commission', async () => {
    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: false,
      error: 'La cita no esta completada',
    })
    vi.mocked(recordCommissionAccrual).mockResolvedValue({ success: true })

    const result = await finalizeAppointmentFinancials(
      aptId,
      orgId,
      empId,
      'test'
    )

    expect(result.payroll.success).toBe(false)
    expect(result.payroll.error).toContain('no esta completada')
    expect(result.commission.success).toBe(true)
  })

  it('reporta commission fallida sin bloquear payroll', async () => {
    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: true,
      data: {
        period_id: 'p1',
        payroll_item_id: 'pi1',
        services_added: 1,
      },
    })
    vi.mocked(recordCommissionAccrual).mockResolvedValue({
      error: 'Cita no comisionable',
    } as never)

    const result = await finalizeAppointmentFinancials(
      aptId,
      orgId,
      empId,
      'test'
    )

    expect(result.payroll.success).toBe(true)
    expect(result.commission.success).toBe(false)
    expect(result.commission.error).toContain('no comisionable')
  })

  it('reporta ambos fallidos', async () => {
    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: false,
      error: 'Cita no encontrada',
    })
    vi.mocked(recordCommissionAccrual).mockResolvedValue({
      error: 'Cita no comisionable',
    } as never)

    const result = await finalizeAppointmentFinancials(
      aptId,
      orgId,
      empId,
      'test'
    )

    expect(result.payroll.success).toBe(false)
    expect(result.commission.success).toBe(false)
  })

  it('maneja excepcion en payroll y continua con commission', async () => {
    vi.mocked(addAppointmentToPayroll).mockRejectedValue(
      new Error('DB connection lost')
    )
    vi.mocked(recordCommissionAccrual).mockResolvedValue({ success: true })

    const result = await finalizeAppointmentFinancials(
      aptId,
      orgId,
      empId,
      'test'
    )

    expect(result.payroll.success).toBe(false)
    expect(result.payroll.error).toBe('DB connection lost')
    expect(result.commission.success).toBe(true)
  })

  it('maneja excepcion en commission', async () => {
    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: true,
      data: {
        period_id: 'p1',
        payroll_item_id: 'pi1',
        services_added: 1,
      },
    })
    vi.mocked(recordCommissionAccrual).mockRejectedValue(
      new Error('Rate limit exceeded')
    )

    const result = await finalizeAppointmentFinancials(
      aptId,
      orgId,
      empId,
      'test'
    )

    expect(result.payroll.success).toBe(true)
    expect(result.commission.success).toBe(false)
    expect(result.commission.error).toBe('Rate limit exceeded')
  })

  it('idempotencia: payroll acepta reprocesamiento', async () => {
    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: true,
      data: {
        period_id: 'p1',
        payroll_item_id: 'pi1',
        services_added: 0,
      },
    })
    vi.mocked(recordCommissionAccrual).mockResolvedValue({ success: true })

    const r1 = await finalizeAppointmentFinancials(
      aptId,
      orgId,
      empId,
      'test'
    )
    const r2 = await finalizeAppointmentFinancials(
      aptId,
      orgId,
      empId,
      'test'
    )

    expect(r1.payroll.success).toBe(true)
    expect(r2.payroll.success).toBe(true)
    expect(addAppointmentToPayroll).toHaveBeenCalledTimes(2)
    expect(recordCommissionAccrual).toHaveBeenCalledTimes(2)
  })

  it('genera idempotency key unica por prefijo', async () => {
    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: true,
      data: {
        period_id: 'p1',
        payroll_item_id: 'pi1',
        services_added: 1,
      },
    })
    vi.mocked(recordCommissionAccrual).mockResolvedValue({ success: true })

    await finalizeAppointmentFinancials(aptId, orgId, empId, 'markManually_user1')
    await finalizeAppointmentFinancials(aptId, orgId, empId, 'auto_complete_cron')

    expect(recordCommissionAccrual).toHaveBeenNthCalledWith(1, {
      appointmentId: aptId,
      organizationId: orgId,
      idempotencyKey: `markManually_user1_${aptId}_${empId}`,
    })
    expect(recordCommissionAccrual).toHaveBeenNthCalledWith(2, {
      appointmentId: aptId,
      organizationId: orgId,
      idempotencyKey: `auto_complete_cron_${aptId}_${empId}`,
    })
  })
})
