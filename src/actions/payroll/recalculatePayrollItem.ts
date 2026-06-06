'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

export async function recalculatePayrollItem(itemId: string): Promise<{
  success: boolean
  error?: string
  data?: {
    gross_commission: number
    total_deductions: number
    gross_pay: number
    net_pay: number
  }
}> {
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('payroll_items')
    .select(`
      *,
      employee:employees(
        percentage,
        base_salary,
        has_transport_subsidy,
        force_transport_subsidy
      )
    `)
    .eq('id', itemId)
    .single()

  if (!item) {
    return { success: false, error: 'Item no encontrado' }
  }

  const it = item as unknown as {
    percentage: number | null
    contract_type: string | null
    payment_type: string | null
    base_salary: number | null
    has_transport_subsidy: boolean | null
    force_transport_subsidy: boolean | null
  }

  const { data: period } = await supabase
    .from('payroll_periods')
    .select('organization_id, status, period')
    .eq('id', item.payroll_period_id)
    .single()

  if (!period) {
    return { success: false, error: 'Período no encontrado' }
  }

  if (period.status !== 'draft') {
    return { success: false, error: 'Solo se pueden recalcular items de períodos en borrador' }
  }

  const access = await requireOrgAccess(period.organization_id, ['owner', 'admin'])
  if (!access.success) return access
  }

  const [year, month] = period.period.split('-')
  const periodStart = `${period.period}-01`
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
  const periodEnd = `${period.period}-${lastDay.toString().padStart(2, '0')}`

  const { data: payrollConfig } = await supabase
    .from('payroll_config')
    .select('*')
    .eq('year', parseInt(year))
    .single()

  if (!payrollConfig) {
    return { success: false, error: `No hay configuración de nómina para ${year}` }
  }

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_services(
        service_id,
        services(price)
      )
    `)
    .eq('employee_id', item.employee_id)
    .gte('start_time', `${periodStart}T00:00:00.000Z`)
    .lte('start_time', `${periodEnd}T23:59:59.999Z`)
    .in('status', ['completed'])

  let grossCommission = 0
  let totalServices = 0

  if (appointments && appointments.length > 0) {
    const commissionPercentage = it.percentage ?? item.employee?.percentage ?? 60

    for (const apt of appointments) {
      const services = apt.appointment_services as any[] || []
      for (const aptService of services) {
        if (aptService.services?.price) {
          const serviceValue = aptService.services.price
          totalServices += serviceValue
          grossCommission += serviceValue * (commissionPercentage / 100)
        }
      }
    }
  }

  const baseSalary = it.base_salary ?? item.employee?.base_salary ?? 0
  let healthDeduction = 0
  let pensionDeduction = 0
  let transportSubsidy = 0

  if (it.contract_type === 'laboral') {
    if (it.payment_type === 'fijo' || it.payment_type === 'mixed') {
      healthDeduction = baseSalary * ((payrollConfig.health_rate ?? 0) / 100)
      pensionDeduction = baseSalary * ((payrollConfig.pension_rate ?? 0) / 100)
    }

    if (it.payment_type === 'porcentaje' || it.payment_type === 'mixed') {
      healthDeduction = grossCommission * ((payrollConfig.health_rate ?? 0) / 100)
      pensionDeduction = grossCommission * ((payrollConfig.pension_rate ?? 0) / 100)
    }
  }

  if (item.employee?.has_transport_subsidy || it.has_transport_subsidy) {
    const earnedMoreThan2SMMLV = (grossCommission + baseSalary) > (payrollConfig.smmlv! * 2)
    if (item.employee?.force_transport_subsidy || it.force_transport_subsidy || !earnedMoreThan2SMMLV) {
      transportSubsidy = payrollConfig.transport_subsidy
    }
  }

  const totalDeductions = healthDeduction + pensionDeduction
  const grossPay = grossCommission + baseSalary + transportSubsidy
  const netPay = grossPay - totalDeductions

  const { error } = await supabase
    .from('payroll_items')
    .update({
      total_services: totalServices,
      gross_commission: grossCommission,
      base_salary: baseSalary,
      health_deduction: healthDeduction,
      pension_deduction: pensionDeduction,
      total_deductions: totalDeductions,
      transport_subsidy_amount: transportSubsidy,
      gross_pay: grossPay,
      net_pay: netPay,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/nomina')
  revalidatePath(`/nomina/periodo/${item.payroll_period_id}`)

  return {
    success: true,
    data: {
      gross_commission: grossCommission,
      total_deductions: totalDeductions,
      gross_pay: grossPay,
      net_pay: netPay,
    }
  }
}
