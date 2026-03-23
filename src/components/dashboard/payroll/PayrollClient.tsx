'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
  Plus,
  Settings,
  Loader2,
  AlertTriangle,
  Wallet,
  Receipt,
  ChevronDown,
  TrendingDown,
  ArrowUpDown
} from 'lucide-react'
import { LoanModal } from './LoanModal'
import { PeriodSelector } from './PeriodSelector'
import { formatCurrencyCOP } from '@/lib/billing/utils'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    primaryGradient: isDark
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#DCFCE7',
    warning: '#F59E0B',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    amber: '#F59E0B',
    isDark,
  }
}

type Employee = {
  id: string
  name: string
  phone: string | null
  default_commission_rate: number
  payment_type: 'commission' | 'salary' | 'mixed'
  fixed_salary: number | null
  salary_frequency: string | null
  max_debt_limit: number
  debt_warning_threshold: number
  total_pending_debt: number
}

type EmployeePayrollSummary = {
  employee_id: string
  employee_name: string
  commission: number
  services_count: number
  fixed_salary: number
  debt_pending: number
  net_payable: number
}

type PayrollSettings = {
  payroll_type: 'weekly' | 'biweekly' | 'monthly' | 'adhoc'
  week_starts_on: number
  month_day: number
  allow_advance_payments: boolean
}

interface PayrollClientProps {
  employees: Employee[]
  organizationId: string
  settings: PayrollSettings | null | undefined
  userRole: string
}

export function PayrollClient({
  employees,
  organizationId,
  settings,
  userRole,
}: PayrollClientProps) {
  const COLORS = useColors()
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [periodStart, setPeriodStart] = useState(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
    return monday.toISOString().split('T')[0]
  })
  const [periodEnd, setPeriodEnd] = useState(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return sunday.toISOString().split('T')[0]
  })
  const [employeeSummaries, setEmployeeSummaries] = useState<EmployeePayrollSummary[]>([])
  const [sortField, setSortField] = useState<'name' | 'commission' | 'debt' | 'net'>('name')
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      calculateAllCommissions()
    }
  }, [mounted, periodStart, periodEnd])

  const calculateAllCommissions = async () => {
    setLoading(true)
    const summaries: EmployeePayrollSummary[] = []

    for (const employee of employees) {
      const { calculateCommission } = await import('@/actions/payroll/calculateCommission')
      const { getEmployeeDebtInfo } = await import('@/actions/payroll/getPendingLoans')

      const [commissionResult, debtResult] = await Promise.all([
        calculateCommission(employee.id, periodStart, periodEnd),
        getEmployeeDebtInfo(employee.id),
      ])

      const commission = commissionResult.data?.total_commission || 0
      const servicesCount = commissionResult.data?.services.length || 0
      const debt = debtResult.data?.total_pending || 0
      const fixedSalary = employee.payment_type === 'mixed' || employee.payment_type === 'salary'
        ? employee.fixed_salary || 0
        : 0
      const netPayable = commission + fixedSalary - debt

      summaries.push({
        employee_id: employee.id,
        employee_name: employee.name,
        commission,
        services_count: servicesCount,
        fixed_salary: fixedSalary,
        debt_pending: debt,
        net_payable: netPayable,
      })
    }

    setEmployeeSummaries(summaries)
    setLoading(false)
  }

  const periodLabels = {
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
    adhoc: 'Pago inmediato',
  }

  const paymentTypeLabels = {
    commission: 'Solo comisión',
    salary: 'Sueldo fijo',
    mixed: 'Mixto',
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const sortedEmployees = [...employeeSummaries].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'name':
        comparison = a.employee_name.localeCompare(b.employee_name)
        break
      case 'commission':
        comparison = a.commission - b.commission
        break
      case 'debt':
        comparison = a.debt_pending - b.debt_pending
        break
      case 'net':
        comparison = a.net_payable - b.net_payable
        break
    }
    return sortAsc ? comparison : -comparison
  })

  const totals = employeeSummaries.reduce(
    (acc, emp) => ({
      commission: acc.commission + emp.commission,
      fixed_salary: acc.fixed_salary + emp.fixed_salary,
      debt: acc.debt + emp.debt_pending,
      net: acc.net + emp.net_payable,
    }),
    { commission: 0, fixed_salary: 0, debt: 0, net: 0 }
  )

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  const handleOpenLoanModal = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowLoanModal(true)
  }

  const getEmployeeDebtInfo = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId)
    return emp?.total_pending_debt || 0
  }

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{
          background: COLORS.primaryGradient,
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Gestión de Personal
              </p>
              <h1
                className="text-3xl font-bold text-white"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Nómina
              </h1>
              <p className="text-sm mt-1 text-white/80">
                {settings?.payroll_type
                  ? `Pago ${periodLabels[settings.payroll_type]}`
                  : 'Resumen consolidado de nómina'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/payroll/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <Settings className="w-4 h-4" />
              Configurar
            </Link>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div
        className="p-6 rounded-2xl border"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
          >
            Período de Nómina
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                viewMode === 'table' ? 'text-white' : ''
              }`}
              style={{
                backgroundColor: viewMode === 'table' ? COLORS.primary : COLORS.surfaceSubtle,
                color: viewMode === 'table' ? '#FFFFFF' : COLORS.textSecondary,
              }}
            >
              Tabla
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                viewMode === 'cards' ? 'text-white' : ''
              }`}
              style={{
                backgroundColor: viewMode === 'cards' ? COLORS.primary : COLORS.surfaceSubtle,
                color: viewMode === 'cards' ? '#FFFFFF' : COLORS.textSecondary,
              }}
            >
              Cards
            </button>
          </div>
        </div>
        <PeriodSelector
          startDate={periodStart}
          endDate={periodEnd}
          onStartChange={setPeriodStart}
          onEndChange={setPeriodEnd}
          colors={COLORS}
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primary + '15' }}>
              <Users className="w-4 h-4" style={{ color: COLORS.primary }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Empleados
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
            {employees.length}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.success + '15' }}>
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.success }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Total Comisiones
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.success }}>
            {loading ? '...' : formatCurrencyCOP(totals.commission)}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.warning + '15' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: COLORS.warning }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Total Préstamos
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>
            {loading ? '...' : formatCurrencyCOP(totals.debt)}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.success + '15' }}>
              <Wallet className="w-4 h-4" style={{ color: COLORS.success }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Neto Total a Pagar
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.success }}>
            {loading ? '...' : formatCurrencyCOP(totals.net)}
          </p>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: COLORS.border,
          }}
        >
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: COLORS.primary }} />
              <p className="mt-3" style={{ color: COLORS.textMuted }}>Calculando comisiones...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: COLORS.surfaceSubtle }}>
                    <th className="text-left p-4">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: COLORS.textMuted }}
                      >
                        Empleado
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-right p-4">
                      <button
                        onClick={() => handleSort('commission')}
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ml-auto"
                        style={{ color: COLORS.textMuted }}
                      >
                        Comisiones
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-right p-4">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider justify-end"
                        style={{ color: COLORS.textMuted }}>
                        Servicios
                      </span>
                    </th>
                    <th className="text-right p-4">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider justify-end"
                        style={{ color: COLORS.textMuted }}>
                        Sueldo Fijo
                      </span>
                    </th>
                    <th className="text-right p-4">
                      <button
                        onClick={() => handleSort('debt')}
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ml-auto"
                        style={{ color: COLORS.textMuted }}
                      >
                        Préstamos
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-right p-4">
                      <button
                        onClick={() => handleSort('net')}
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ml-auto"
                        style={{ color: COLORS.textMuted }}
                      >
                        Neto a Pagar
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEmployees.map((emp) => {
                    const employee = employees.find(e => e.id === emp.employee_id)
                    const isAtRisk = employee && employee.max_debt_limit && emp.debt_pending > employee.max_debt_limit * (employee.debt_warning_threshold / 100)

                    return (
                      <tr
                        key={emp.employee_id}
                        className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        style={{ borderColor: COLORS.border }}
                      >
                        <td className="p-4">
                          <Link
                            href={`/payroll/${emp.employee_id}`}
                            className="flex items-center gap-3"
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                              style={{
                                backgroundColor: COLORS.primary + '15',
                                color: COLORS.primary,
                              }}
                            >
                              {emp.employee_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: COLORS.textPrimary }}>
                                {emp.employee_name}
                              </p>
                              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                                {employee ? paymentTypeLabels[employee.payment_type] : ''}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-semibold" style={{ color: COLORS.success }}>
                            {formatCurrencyCOP(emp.commission)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span style={{ color: COLORS.textSecondary }}>
                            {emp.services_count}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span style={{ color: COLORS.textSecondary }}>
                            {emp.fixed_salary > 0 ? formatCurrencyCOP(emp.fixed_salary) : '-'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className="font-semibold"
                            style={{ color: emp.debt_pending > 0 ? COLORS.error : COLORS.textSecondary }}
                          >
                            {emp.debt_pending > 0 ? formatCurrencyCOP(emp.debt_pending) : '-'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-bold" style={{ color: COLORS.success }}>
                            {formatCurrencyCOP(emp.net_payable)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => handleOpenLoanModal(employee!)}
                              className="p-2 rounded-lg transition-colors"
                              style={{
                                backgroundColor: COLORS.surfaceSubtle,
                                color: COLORS.textSecondary,
                              }}
                              title="Registrar préstamo"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <Link
                              href={`/payroll/${emp.employee_id}`}
                              className="p-2 rounded-lg transition-colors"
                              style={{
                                backgroundColor: COLORS.primary + '15',
                                color: COLORS.primary,
                              }}
                              title="Ver detalle"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: COLORS.surfaceSubtle }}>
                    <td className="p-4 font-bold" style={{ color: COLORS.textPrimary }}>
                      TOTAL
                    </td>
                    <td className="p-4 text-right font-bold" style={{ color: COLORS.success }}>
                      {formatCurrencyCOP(totals.commission)}
                    </td>
                    <td className="p-4 text-right" style={{ color: COLORS.textSecondary }}>
                      -
                    </td>
                    <td className="p-4 text-right font-bold" style={{ color: COLORS.textPrimary }}>
                      {totals.fixed_salary > 0 ? formatCurrencyCOP(totals.fixed_salary) : '-'}
                    </td>
                    <td className="p-4 text-right font-bold" style={{ color: COLORS.error }}>
                      {totals.debt > 0 ? formatCurrencyCOP(totals.debt) : '-'}
                    </td>
                    <td className="p-4 text-right font-bold text-lg" style={{ color: COLORS.success }}>
                      {formatCurrencyCOP(totals.net)}
                    </td>
                    <td className="p-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-xl font-semibold"
              style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
            >
              Detalle por Empleado
            </h2>
            <button
              onClick={() => {
                setSelectedEmployee(null)
                setShowLoanModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Plus className="w-4 h-4" />
              Registrar Préstamo
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: COLORS.primary }} />
              <p className="mt-3" style={{ color: COLORS.textMuted }}>Calculando comisiones...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedEmployees.map((emp) => {
                const employee = employees.find(e => e.id === emp.employee_id)
                const isAtRisk = employee && employee.max_debt_limit && emp.debt_pending > employee.max_debt_limit * (employee.debt_warning_threshold / 100)

                return (
                  <Link
                    key={emp.employee_id}
                    href={`/payroll/${emp.employee_id}`}
                    className="block p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg group"
                    style={{
                      backgroundColor: COLORS.surfaceGlass,
                      borderColor: isAtRisk ? COLORS.warning : COLORS.border,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                          style={{
                            backgroundColor: COLORS.primary + '15',
                            color: COLORS.primary,
                          }}
                        >
                          {emp.employee_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>
                            {emp.employee_name}
                          </h3>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>
                            {employee ? paymentTypeLabels[employee.payment_type] : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className="w-5 h-5 transition-transform group-hover:translate-x-1"
                        style={{ color: COLORS.textMuted }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                          Comisiones
                        </span>
                        <span className="font-semibold" style={{ color: COLORS.success }}>
                          {formatCurrencyCOP(emp.commission)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                          Servicios
                        </span>
                        <span style={{ color: COLORS.textSecondary }}>
                          {emp.services_count}
                        </span>
                      </div>
                      {emp.fixed_salary > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                            Sueldo Fijo
                          </span>
                          <span style={{ color: COLORS.textSecondary }}>
                            {formatCurrencyCOP(emp.fixed_salary)}
                          </span>
                        </div>
                      )}
                      {emp.debt_pending > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: COLORS.error }}>
                            Préstamos
                          </span>
                          <span className="font-semibold" style={{ color: COLORS.error }}>
                            -{formatCurrencyCOP(emp.debt_pending)}
                          </span>
                        </div>
                      )}
                      <div
                        className="flex justify-between items-center pt-2 border-t"
                        style={{ borderColor: COLORS.border }}
                      >
                        <span className="font-semibold" style={{ color: COLORS.textPrimary }}>
                          Neto a Pagar
                        </span>
                        <span className="text-lg font-bold" style={{ color: COLORS.success }}>
                          {formatCurrencyCOP(emp.net_payable)}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Loan Modal */}
      {showLoanModal && (
        <LoanModal
          employees={employees}
          selectedEmployee={selectedEmployee}
          organizationId={organizationId}
          onClose={() => {
            setShowLoanModal(false)
            setSelectedEmployee(null)
          }}
        />
      )}
    </div>
  )
}