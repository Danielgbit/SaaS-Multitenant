'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'
import { getEmailTemplate } from '@/lib/email/templates'
import { generatePayrollReceiptPDF, PayrollReceiptPDFData } from '@/lib/payroll/generatePayrollReceiptPDF'
import { formatCurrencyCOP } from '@/lib/billing/utils'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  nequi: 'Nequi',
  pse: 'PSE',
  banco: 'Transferencia Bancaria',
  daviplata: 'Daviplata',
  cheque: 'Cheque',
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export async function sendPayrollReceiptEmail(input: {
  employeeId: string
  periodId: string
  payrollPeriod: string
  paymentMethod: string
  paymentReference?: string
}): Promise<{
  success: boolean
  error?: string
  emailSent?: boolean
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember || !['owner', 'admin'].includes(orgMember.role)) {
    return { success: false, error: 'Solo owners/admins pueden enviar receipts' }
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, name, user_id')
    .eq('id', input.employeeId)
    .single()

  if (!employee) {
    return { success: false, error: 'Empleado no encontrado' }
  }

  if (!employee.user_id) {
    return { success: false, error: 'Empleado sin usuario asociado', emailSent: false }
  }

  const { data: employeeUser } = await (supabase as any)
    .from('users')
    .select('email')
    .eq('id', employee.user_id!)
    .single() as Promise<unknown> as unknown as { data: { email: string } | null; error: unknown }

  if (!employeeUser?.email) {
    return { success: false, error: 'Empleado sin email registrado', emailSent: false }
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgMember.organization_id)
    .single()

  if (!organization) {
    return { success: false, error: 'Organizacion no encontrada' }
  }

  const { data: payrollItem } = await supabase
    .from('payroll_items')
    .select('net_pay')
    .eq('payroll_period_id', input.periodId)
    .eq('employee_id', input.employeeId)
    .single()

  if (!payrollItem) {
    return { success: false, error: 'Item de nomina no encontrado' }
  }

  const { data: payrollPeriodData } = await supabase
    .from('payroll_periods')
    .select('period')
    .eq('id', input.periodId)
    .single()

  const periodLabel = payrollPeriodData?.period
    ? (() => {
        const [year, month] = payrollPeriodData.period.split('-')
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        return `${months[parseInt(month, 10) - 1]} ${year}`
      })()
    : input.payrollPeriod

  const pdfData: PayrollReceiptPDFData = {
    businessName: organization.name,
    period: periodLabel,
    employeeName: employee.name,
    netPay: payrollItem.net_pay ?? 0,
    paymentMethod: input.paymentMethod,
    paymentReference: input.paymentReference,
    paidAt: new Date().toISOString(),
  }

  const pdfBuffer = await generatePayrollReceiptPDF(pdfData)
  const base64Pdf = Buffer.from(pdfBuffer).toString('base64')

  const { subject, html } = getEmailTemplate('payroll_receipt', {
    businessName: organization.name,
    employeeName: employee.name,
    period: periodLabel,
    netPay: formatCurrencyCOP(payrollItem.net_pay ?? 0),
    paymentMethod: PAYMENT_METHOD_LABELS[input.paymentMethod] || input.paymentMethod,
    paymentReference: input.paymentReference,
    paidAt: formatDate(new Date().toISOString()),
  })

  const emailResult = await sendEmail({
    to: employeeUser.email,
    subject,
    html,
  })

  if (!emailResult.success) {
    return { success: false, error: 'Error al enviar email', emailSent: false }
  }

  return { success: true, emailSent: true }
}
