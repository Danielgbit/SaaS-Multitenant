import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/actions/payroll/addAppointmentToPayroll', () => ({
  addAppointmentToPayroll: vi.fn(),
}))
vi.mock('@/actions/financial/recordCommissionAccrual', () => ({
  recordCommissionAccrual: vi.fn(),
}))
vi.mock('@/lib/app-logger', () => ({
  appLog: vi.fn(),
}))

const { finalizeAppointmentFinancials } = await import('@/lib/appointments/finalize-financials')
const { addAppointmentToPayroll } = await import('@/actions/payroll/addAppointmentToPayroll')
const { recordCommissionAccrual } = await import('@/actions/financial/recordCommissionAccrual')

describe('finalizeAppointmentFinancials', () => {
  const aptId = '00000000-0000-0000-0000-000000000001'
  const orgId = '00000000-0000-0000-0000-000000000002'
  const empId = '00000000-0000-0000-0000-000000000003'

  beforeEach(() => { vi.clearAllMocks() })

  it('ejecuta payroll y commission con éxito', async () => {
    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: true,
      data: { period_id: 'p1', payroll_item_id: 'pi1', services_added: 1 },
    })
    vi.mocked(recordCommissionAccrual).mockResolvedValue({ success: true })

    const result = await finalizeAppointmentFinancials(aptId, orgId, empId, 'test')

    expect(result.payroll.attempted).toBe(true)
    expect(result.payroll.success).toBe(true)
    expect(result.payroll.data?.period_id).toBe('p1')
    expect(result.commission.attempted).toBe(true)
    expect(result.commission.success).toBe(true)
  })

  it('reporta payroll fallido sin bloquear commission', async () => {
    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: false,
      error: 'La cita no está completada',
    })
    vi.mocked(recordCommissionAccrual).mockResolvedValue({ success: true })

    const result = await finalizeAppointmentFinancials(aptId, orgId, empId, 'test')

    expect(result.payroll.attempted).toBe(true)
    expect(result.payroll.success).toBe(false)
    expect(result.payroll.error).toContain('no está completada')
    expect(result.commission.success).toBe(true)
  })

  it('reporta commission fallida sin bloquear payroll', async () => {
    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: true,
      data: { period_id: 'p1', payroll_item_id: 'pi1', services_added: 1 },
    })
    vi.mocked(recordCommissionAccrual).mockResolvedValue({ error: 'Cita no comisionable' })

    const result = await finalizeAppointmentFinancials(aptId, orgId, empId, 'test')

    expect(result.payroll.success).toBe(true)
    expect(result.commission.success).toBe(false)
    expect(result.commission.error).toContain('no comisionable')
  })

  it('reporta ambos fallidos', async () => {
    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: false,
      error: 'Cita no encontrada',
    })
    vi.mocked(recordCommissionAccrual).mockResolvedValue({ error: 'Cita no comisionable' })

    const result = await finalizeAppointmentFinancials(aptId, orgId, empId, 'test')

    expect(result.payroll.success).toBe(false)
    expect(result.commission.success).toBe(false)
  })

  it('maneja excepción en payroll sin afectar commission', async () => {
    vi.mocked(addAppointmentToPayroll).mockRejectedValue(new Error('DB connection lost'))
    vi.mocked(recordCommissionAccrual).mockResolvedValue({ success: true })

    const result = await finalizeAppointmentFinancials(aptId, orgId, empId, 'test')

    expect(result.payroll.success).toBe(false)
    expect(result.payroll.error).toContain('DB connection lost')
    expect(result.commission.success).toBe(true)
  })

  it('maneja excepción en commission sin afectar payroll', async () => {
    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: true,
      data: { period_id: 'p1', payroll_item_id: 'pi1', services_added: 1 },
    })
    vi.mocked(recordCommissionAccrual).mockRejectedValue(new Error('Unique constraint violation'))

    const result = await finalizeAppointmentFinancials(aptId, orgId, empId, 'test')

    expect(result.payroll.success).toBe(true)
    expect(result.commission.success).toBe(false)
    expect(result.commission.error).toContain('Unique constraint violation')
  })

  it('idempotencia: reprocesamiento no lanza errores', async () => {
    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: true,
      data: { period_id: 'p1', payroll_item_id: 'pi1', services_added: 0 },
    })
    vi.mocked(recordCommissionAccrual).mockResolvedValue({ success: true })

    const r1 = await finalizeAppointmentFinancials(aptId, orgId, empId, 'test')
    const r2 = await finalizeAppointmentFinancials(aptId, orgId, empId, 'test')

    expect(r1.payroll.success).toBe(true)
    expect(r2.payroll.success).toBe(true)
    expect(r1.commission.success).toBe(true)
    expect(r2.commission.success).toBe(true)
    expect(addAppointmentToPayroll).toHaveBeenCalledTimes(2)
    expect(recordCommissionAccrual).toHaveBeenCalledTimes(2)
  })

  it('genera log resumen al final', async () => {
    const { appLog } = await import('@/lib/app-logger')

    vi.mocked(addAppointmentToPayroll).mockResolvedValue({
      success: true,
      data: { period_id: 'p1', payroll_item_id: 'pi1', services_added: 1 },
    })
    vi.mocked(recordCommissionAccrual).mockResolvedValue({ success: true })

    await finalizeAppointmentFinancials(aptId, orgId, empId, 'test')

    expect(appLog).toHaveBeenCalledWith('info', '[finalizeFinancials] completed', {
      appointmentId: aptId,
      payrollSuccess: true,
      commissionSuccess: true,
    })
  })
})
