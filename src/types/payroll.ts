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
  allow_advance_payments: boolean
  created_at: string
  updated_at: string
}

export type UpdatePayrollSettingsInput = {
  payroll_type?: PayrollType
  week_starts_on?: number
  month_day?: number
  allow_advance_payments?: boolean
}

// =====================================================
// employee_loans
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
// payroll_receipts
// =====================================================

export type ReceiptStatus = 'draft' | 'pending' | 'paid'
export type PeriodType = 'weekly' | 'biweekly' | 'monthly' | 'adhoc'

export type PayrollReceipt = {
  id: string
  employee_id: string
  organization_id: string
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
  payment_type: 'commission' | 'salary' | 'mixed'
  fixed_salary: number | null
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
