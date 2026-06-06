import { appLog } from '@/lib/app-logger'

export type FinancialResult = {
  payroll: {
    attempted: boolean
    success: boolean
    error?: string
    data?: { period_id: string; payroll_item_id: string; services_added: number }
  }
  commission: {
    attempted: boolean
    success: boolean
    error?: string
  }
}

/**
 * Ejecuta payroll y comisión para una cita completada.
 * No lanza excepciones — siempre devuelve resultado estructurado.
 * Cada sub-operación es idempotente y maneja su propio error.
 * Orden: payroll → comisión.
 */
export async function finalizeAppointmentFinancials(
  appointmentId: string,
  organizationId: string,
  employeeId: string,
  idempotencyPrefix: string
): Promise<FinancialResult> {
  const result: FinancialResult = {
    payroll: { attempted: false, success: false },
    commission: { attempted: false, success: false },
  }

  // ── Payroll ──
  result.payroll.attempted = true
  try {
    const { addAppointmentToPayroll } = await import('@/actions/payroll/addAppointmentToPayroll')
    const payrollResult = await addAppointmentToPayroll(appointmentId)
    if (payrollResult.success) {
      result.payroll.success = true
      result.payroll.data = payrollResult.data
    } else {
      result.payroll.error = payrollResult.error
      appLog('error', '[finalizeFinancials] payroll failed', {
        appointmentId,
        error: payrollResult.error,
      })
    }
  } catch (e) {
    result.payroll.error = e instanceof Error ? e.message : String(e)
    appLog('error', '[finalizeFinancials] payroll exception', {
      appointmentId,
      error: result.payroll.error,
    })
  }

  // ── Commission ──
  result.commission.attempted = true
  try {
    const { recordCommissionAccrual } = await import('@/actions/financial/recordCommissionAccrual')
    const accrualKey = `${idempotencyPrefix}_${appointmentId}_${employeeId}`
    const commissionResult = await recordCommissionAccrual({
      appointmentId,
      organizationId,
      idempotencyKey: accrualKey,
    })
    if (commissionResult.success === true) {
      result.commission.success = true
    } else {
      result.commission.error = commissionResult.error
      appLog('error', '[finalizeFinancials] commission failed', {
        appointmentId,
        error: commissionResult.error,
      })
    }
  } catch (e) {
    result.commission.error = e instanceof Error ? e.message : String(e)
    appLog('error', '[finalizeFinancials] commission exception', {
      appointmentId,
      error: result.commission.error,
    })
  }

  appLog('info', '[finalizeFinancials] completed', {
    appointmentId,
    payrollSuccess: result.payroll.success,
    commissionSuccess: result.commission.success,
  })

  return result
}
