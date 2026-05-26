'use server'

import { createClient } from '@/lib/supabase/server'
import type { PayrollCalculationResult, CommissionBreakdown } from '@/types/payroll'
import type { ContractType, PaymentType } from '@/types/employees'

interface CalculateInput {
  employee_id: string
  period_start: string
  period_end: string
  contract_type: ContractType
  payment_type: PaymentType
  percentage: number
  base_salary: number | null
  salary_frequency: string | null
  has_transport_subsidy: boolean
  force_transport_subsidy: boolean
  employment_type: 'full_time' | 'part_time'
  part_time_percentage: number
}

export async function calculateEmployeePayroll(input: CalculateInput): Promise<{
  success: boolean
  data?: PayrollCalculationResult
  error?: string
}> {
  const supabase = await createClient()

  // Get payroll config for the year
  const year = new Date(input.period_start).getFullYear()
  const { data: config } = await supabase
    .from('payroll_config')
    .select('*')
    .eq('year', year)
    .single()

  if (!config) {
    return { success: false, error: `No payroll config for year ${year}` }
  }

  // Get completed appointments for this employee in the period
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      is_commissionable,
      appointment_services (
        service:services (
          id,
          name,
          price,
          has_commission
        )
      )
    `)
    .eq('employee_id', input.employee_id)
    .eq('status', 'completed')
    .gte('start_time', input.period_start)
    .lte('start_time', input.period_end)

  if (!appointments) {
    return {
      success: true,
      data: {
        total_services: 0,
        gross_commission: 0,
        base_salary: input.base_salary || 0,
        transport_subsidy: 0,
        health_deduction: 0,
        pension_deduction: 0,
        total_deductions: 0,
        gross_pay: input.base_salary || 0,
        net_pay: input.base_salary || 0,
        loans_deducted: 0,
        final_net: input.base_salary || 0,
        commissions: [],
      },
    }
  }

  // Calculate commissions from services
  let totalServices = 0
  let grossCommission = 0
  const commissions: CommissionBreakdown[] = []

  for (const apt of appointments) {
    if (!apt.is_commissionable) continue
    if (!apt.appointment_services || apt.appointment_services.length === 0) continue

    for (const as of apt.appointment_services) {
      const service = as.service
      if (!service || !service.has_commission) continue

      totalServices++
      const servicePrice = service.price || 0
      const commissionAmount = Number((servicePrice * (input.percentage / 100)).toFixed(2))

      grossCommission += commissionAmount

      commissions.push({
        appointment_id: apt.id,
        date: new Date(apt.start_time).toISOString().split('T')[0],
        service_name: service.name,
        service_price: servicePrice,
        commission_rate: input.percentage,
        commission_amount: commissionAmount,
      })
    }
  }

  // Calculate employment factor for part-time employees
  const employmentFactor = input.employment_type === 'part_time'
    ? (input.part_time_percentage / 100)
    : 1

  // Calculate base salary based on payment type (apply part-time factor)
  let baseSalary = 0
  if (input.payment_type === 'fijo' || input.payment_type === 'mixed') {
    baseSalary = (input.base_salary || 0) * employmentFactor
  }

  // Calculate transport subsidy (also proportional to part-time factor)
  // Transport subsidy applies if: (gross commission + base salary) <= 2 * SMMLV
  // OR if force_transport_subsidy is true
  let transportSubsidy = 0
  const totalEarnings = grossCommission + baseSalary

  if (input.force_transport_subsidy || input.has_transport_subsidy) {
    if (input.force_transport_subsidy || totalEarnings <= config.smmlv! * 2) {
      transportSubsidy = config.transport_subsidy! * employmentFactor
    }
  }

  // Calculate deductions (only for laboral contract type)
  let healthDeduction = 0
  let pensionDeduction = 0
  let totalDeductions = 0

  if (input.contract_type === 'laboral') {
    healthDeduction = Number((baseSalary * (config.health_rate ?? 0)).toFixed(2))
    pensionDeduction = Number((baseSalary * (config.pension_rate ?? 0)).toFixed(2))
    totalDeductions = healthDeduction + pensionDeduction
  }

  // Calculate gross pay
  const grossPay = grossCommission + baseSalary + transportSubsidy

  // Calculate net before loans
  const netPayBeforeLoans = grossPay - totalDeductions

  return {
    success: true,
    data: {
      total_services: totalServices,
      gross_commission: Number(grossCommission.toFixed(2)),
      base_salary: baseSalary,
      transport_subsidy: transportSubsidy,
      health_deduction: healthDeduction,
      pension_deduction: pensionDeduction,
      total_deductions: totalDeductions,
      gross_pay: Number(grossPay.toFixed(2)),
      net_pay: Number(netPayBeforeLoans.toFixed(2)),
      loans_deducted: 0, // Loans are deducted at period level
      final_net: Number(netPayBeforeLoans.toFixed(2)),
      commissions,
    },
  }
}