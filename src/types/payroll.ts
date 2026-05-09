import type { ContractType, PaymentType } from './employees'

// =====================================================
// organization_payroll_settings
// =====================================================

export type PayrollType = 'weekly' | 'biweekly' | 'monthly' | 'adhoc'

export type OrganizationPayrollSettings = {
  id: string
  organization_id: string
  payroll_type: PayrollType
  week_starts_on: number
  month_day: number
  cut_off_day: number
  allow_advance_payments: boolean
  created_at: string
  updated_at: string
}

export type UpdatePayrollSettingsInput = {
  payroll_type?: PayrollType
  week_starts_on?: number
  month_day?: number
  cut_off_day?: number
  allow_advance_payments?: boolean
}

// =====================================================
// payroll_config (global - no org)
// =====================================================

export type PayrollConfig = {
  id: string
  year: number
  smmlv: number
  transport_subsidy: number
  health_rate: number
  pension_rate: number
  created_at: string
  updated_at: string
}

// =====================================================
// PAYROLL PERIODS
// =====================================================

export type PeriodStatus = 'draft' | 'approved' | 'paid'

export type PayrollPeriod = {
  id: string
  organization_id: string
  period: string  // 'YYYY-MM'
  status: PeriodStatus
  total_employees: number
  total_gross_pay: number
  total_deductions: number
  total_transport_subsidy: number
  total_net_pay: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type CreatePayrollPeriodInput = {
  organization_id: string
  period: string  // 'YYYY-MM'
  notes?: string
}

// =====================================================
// PAYROLL ITEMS
// =====================================================

export type PayrollItem = {
  id: string
  payroll_period_id: string
  employee_id: string
  contract_type: ContractType
  payment_type: PaymentType

  // Commissions
  total_services: number
  gross_commission: number

  // Fixed salary
  base_salary: number
  salary_frequency: string | null

  // Transport
  has_transport_subsidy: boolean
  transport_subsidy_amount: number

  // Deductions
  health_deduction: number
  pension_deduction: number
  total_deductions: number

  // Totals
  gross_pay: number
  net_pay: number

  // Loans
  loans_deducted: number

  notes: string | null
  created_at: string
  updated_at: string
}

export type PayrollItemWithEmployee = PayrollItem & {
  employee: {
    id: string
    name: string
    percentage?: number
  }
}

// =====================================================
// PERIOD COMMISSIONS (persisted)
// =====================================================

export type PeriodCommission = {
  id: string
  payroll_item_id: string
  appointment_id: string
  service_date: string
  service_name: string
  service_value: number
  percentage_applied: number
  commission_amount: number
  created_at: string
}

// =====================================================
// PAYROLL ITEM LOANS
// =====================================================

export type PayrollItemLoan = {
  id: string
  payroll_item_id: string
  loan_id: string
  amount_deducted: number
  created_at: string
}

// =====================================================
// DASHBOARD SUMMARY
// =====================================================

export type PeriodEmployeeSummary = {
  id: string
  name: string
  services_count: number
  net_pay: number
  contract_type: string
  payment_type: string
  commission_rate: number
}

export type PayrollPeriodWithEmployees = PayrollPeriod & {
  employees: PeriodEmployeeSummary[]
}

export type PayrollDashboardSummary = {
  current_period: PayrollPeriodWithEmployees | null
  previous_periods: PayrollPeriodWithEmployees[]
  pending_periods: PayrollPeriodWithEmployees[]
  total_pending_net: number
  total_pending_employees: number
  employees_ready_to_pay: number
  total_employee_debt: number
}

// =====================================================
// EMPLOYEE LOANS
// =====================================================

export type LoanConcept = 'passage' | 'food' | 'product' | 'advance' | 'other'
export type LoanStatus = 'pending' | 'partial' | 'paid' | 'frozen'

export type EmployeeLoan = {
  id: string
  employee_id: string
  organization_id: string
  amount: number
  interest_rate: number
  concept: string
  notes: string | null
  status: LoanStatus
  remaining_amount: number
  created_at: string
  due_date: string | null
}

export type CreateLoanInput = {
  employee_id: string
  amount: number
  concept: LoanConcept
  interest_rate?: number
  notes?: string
  due_date?: string
}

export type UpdateLoanInput = {
  id: string
  status?: LoanStatus
  remaining_amount?: number
}

// =====================================================
// LEGACY: payroll_receipts (transitional - to be deprecated)
// =====================================================

export type ReceiptStatus = 'draft' | 'pending' | 'paid'
export type PeriodType = 'weekly' | 'biweekly' | 'monthly' | 'adhoc'

export type PayrollReceipt = {
  id: string
  employee_id: string
  organization_id: string
  payroll_period_id?: string
  payment_date: string
  period_type: PeriodType
  period_start: string
  period_end: string
  status: ReceiptStatus
  gross_services_value: number
  commission_amount: number
  fixed_salary_amount: number
  loans_deducted: number
  net_amount: number
  is_salary_separate: boolean
  notes: string | null
  created_at: string
  updated_at: string
  payment_method?: string
  payment_reference?: string
  paid_at?: string
}

export type PayrollReceiptService = {
  id: string
  receipt_id: string
  appointment_id: string
  service_name: string
  service_price: number
  commission_rate_applied: number
  commission_amount: number
  created_at: string
}

export type PayrollReceiptLoan = {
  id: string
  receipt_id: string
  loan_id: string
  amount_deducted: number
  created_at: string
}

export type GenerateReceiptInput = {
  employee_id: string
  period_start: string
  period_end: string
  period_type: PeriodType
  deduct_loans: boolean
  deduct_amount?: number
  is_salary_separate?: boolean
}

export type PayrollReceiptWithDetails = PayrollReceipt & {
  services: PayrollReceiptService[]
  loans: (PayrollReceiptLoan & { loan: EmployeeLoan })[]
  employee: { name: string }
}

// =====================================================
// COMMISSION CALCULATION
// =====================================================

export type CommissionBreakdown = {
  appointment_id: string
  date: string
  service_name: string
  service_price: number
  commission_rate: number
  commission_amount: number
}

export type CommissionSummary = {
  employee_id: string
  period_start: string
  period_end: string
  services: CommissionBreakdown[]
  total_services: number
  total_commissionable: number
  total_commission: number
  default_rate: number
  payment_type: PaymentType
  base_salary: number | null
}

export type PendingLoanSummary = {
  id: string
  amount: number
  remaining_amount: number
  concept: string
  created_at: string
}

export type EmployeeDebtInfo = {
  total_pending: number
  loans: PendingLoanSummary[]
  limit: number | null
  warning_threshold: number
  is_over_limit: boolean
  is_at_warning_threshold: boolean
}

export type DayGroup = {
  date: string
  dateLabel: string
  dayOfWeek: string
  services: CommissionBreakdown[]
  dailyTotal: number
  dailyCommission: number
}

export type CommissionWithDayGroups = CommissionSummary & {
  dayGroups: DayGroup[]
}

// =====================================================
// CALCULATION HELPERS
// =====================================================

export type CalculatePayrollInput = {
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

export type PayrollCalculationResult = {
  total_services: number
  gross_commission: number
  base_salary: number
  transport_subsidy: number
  health_deduction: number
  pension_deduction: number
  total_deductions: number
  gross_pay: number
  net_pay: number
  loans_deducted: number
  final_net: number
  commissions: CommissionBreakdown[]
}