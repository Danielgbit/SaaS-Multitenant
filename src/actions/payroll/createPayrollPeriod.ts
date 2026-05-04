'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { calculateEmployeePayroll } from './calculateEmployeePayroll'
import { getPendingLoans } from './getPendingLoans'

const CreatePeriodSchema = z.object({
  organization_id: z.string().uuid(),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Formato inválido. Use YYYY-MM'),
})

export async function createPayrollPeriod(input: {
  organization_id: string
  period: string  // 'YYYY-MM'
  notes?: string
}): Promise<{
  success: boolean
  data?: {
    period_id: string
    employees_count: number
    total_net: number
  }
  error?: string
}> {
  const parsed = CreatePeriodSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Check if user is owner/admin
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', input.organization_id)
    .single()

  if (!orgMember || !['owner', 'admin'].includes(orgMember.role)) {
    return { success: false, error: 'Solo owners/admins pueden crear períodos' }
  }

  // Check if period already exists
  const { data: existing } = await (supabase as any)
    .from('payroll_periods')
    .select('id')
    .eq('organization_id', input.organization_id)
    .eq('period', input.period)
    .single()

  if (existing) {
    return { success: false, error: `Ya existe un período ${input.period} para esta organización` }
  }

  // Get active employees
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('organization_id', input.organization_id)
    .eq('active', true)

  if (!employees || employees.length === 0) {
    return { success: false, error: 'No hay empleados activos' }
  }

  // Calculate date range from period
  const [year, month] = input.period.split('-').map(Number)
  const periodStart = `${input.period}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const periodEnd = `${input.period}-${lastDay.toString().padStart(2, '0')}`

  // Get payroll config for calculations
  const { data: payrollConfig } = await (supabase as any)
    .from('payroll_config')
    .select('*')
    .eq('year', year)
    .single()

  if (!payrollConfig) {
    return { success: false, error: `No hay configuración de nómina para ${year}` }
  }

  // Create payroll period
  const { data: periodRecord, error: periodError } = await (supabase as any)
    .from('payroll_periods')
    .insert({
      organization_id: input.organization_id,
      period: input.period,
      status: 'draft',
      notes: input.notes || null,
    })
    .select()
    .single()

  if (periodError) {
    return { success: false, error: periodError.message }
  }

  // Process each employee
  let totalNet = 0
  const payrollItems: Array<{
    payroll_period_id: string
    employee_id: string
    contract_type: string
    payment_type: string
    total_services: number
    gross_commission: number
    base_salary: number
    salary_frequency: string | null
    has_transport_subsidy: boolean
    transport_subsidy_amount: number
    health_deduction: number
    pension_deduction: number
    total_deductions: number
    gross_pay: number
    net_pay: number
    loans_deducted: number
  }> = []

  for (const emp of employees) {
    // Calculate payroll for this employee
    const calcResult = await calculateEmployeePayroll({
      employee_id: emp.id,
      period_start: periodStart,
      period_end: periodEnd,
      contract_type: emp.contract_type || 'prestacion',
      payment_type: emp.payment_type || 'porcentaje',
      percentage: emp.percentage || emp.default_commission_rate || 60,
      base_salary: emp.base_salary || emp.fixed_salary,
      salary_frequency: emp.salary_frequency,
      has_transport_subsidy: emp.has_transport_subsidy || false,
      force_transport_subsidy: emp.force_transport_subsidy || false,
    })

    if (!calcResult.success || !calcResult.data) {
      console.error(`Error calculating payroll for employee ${emp.id}:`, calcResult.error)
      continue
    }

    const calc = calcResult.data

    // Check for pending loans
    const loansResult = await getPendingLoans(emp.id)
    const pendingLoans = loansResult.data || []
    const totalDebt = pendingLoans.reduce((sum: number, l: any) => sum + l.remaining_amount, 0)

    // Calculate final net (gross - deductions - loans)
    const finalNet = Math.max(0, calc.gross_pay - calc.total_deductions - totalDebt)

    payrollItems.push({
      payroll_period_id: periodRecord.id,
      employee_id: emp.id,
      contract_type: emp.contract_type || 'prestacion',
      payment_type: emp.payment_type || 'porcentaje',
      total_services: calc.total_services,
      gross_commission: calc.gross_commission,
      base_salary: calc.base_salary,
      salary_frequency: emp.salary_frequency,
      has_transport_subsidy: calc.transport_subsidy > 0,
      transport_subsidy_amount: calc.transport_subsidy,
      health_deduction: calc.health_deduction,
      pension_deduction: calc.pension_deduction,
      total_deductions: calc.total_deductions,
      gross_pay: calc.gross_pay,
      net_pay: finalNet,
      loans_deducted: Math.min(totalDebt, finalNet), // Can't deduct more than net
    })

    totalNet += finalNet
  }

  // Insert payroll items
  if (payrollItems.length > 0) {
    const { error: itemsError } = await (supabase as any)
      .from('payroll_items')
      .insert(payrollItems)

    if (itemsError) {
      console.error('Error inserting payroll items:', itemsError)
    }

    // Update period totals
    const totalDeductions = payrollItems.reduce((sum, item) => sum + item.total_deductions, 0)
    const totalTransport = payrollItems.reduce((sum, item) => sum + item.transport_subsidy_amount, 0)
    const totalGross = payrollItems.reduce((sum, item) => sum + item.gross_pay, 0)

    await (supabase as any)
      .from('payroll_periods')
      .update({
        total_employees: payrollItems.length,
        total_gross_pay: totalGross,
        total_deductions: totalDeductions,
        total_transport_subsidy: totalTransport,
        total_net_pay: totalNet,
      })
      .eq('id', periodRecord.id)
  }

  revalidatePath('/payroll')

  return {
    success: true,
    data: {
      period_id: periodRecord.id,
      employees_count: payrollItems.length,
      total_net: totalNet,
    },
  }
}