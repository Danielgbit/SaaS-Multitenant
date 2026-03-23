'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Receipt,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Scissors,
  Minus,
  Wallet,
  TrendingDown,
  PiggyBank
} from 'lucide-react'
import { generatePayrollReceipt } from '@/actions/payroll/generatePayrollReceipt'
import { PeriodSelector } from './PeriodSelector'
import type { CommissionWithDayGroups, EmployeeDebtInfo, PayrollReceipt, PeriodType } from '@/types/payroll'
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
  max_debt_limit: number | null
  debt_warning_threshold: number
}

interface EmployeePayrollDetailProps {
  employee: Employee
  defaultPeriod: { start: string; end: string }
  initialCommission?: CommissionWithDayGroups
  debtInfo?: EmployeeDebtInfo
  receipts: PayrollReceipt[]
  organizationId: string
  userRole: string
}

export function EmployeePayrollDetail({
  employee,
  defaultPeriod,
  initialCommission,
  debtInfo,
  receipts,
  organizationId,
  userRole,
}: EmployeePayrollDetailProps) {
  const COLORS = useColors()
  const [mounted, setMounted] = useState(false)
  const [periodStart, setPeriodStart] = useState(defaultPeriod.start)
  const [periodEnd, setPeriodEnd] = useState(defaultPeriod.end)
  const [commission, setCommission] = useState<CommissionWithDayGroups | null>(
    initialCommission || null
  )
  const [debt, setDebt] = useState<EmployeeDebtInfo | null>(debtInfo || null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deductLoans, setDeductLoans] = useState(true)
  const [deductAmount, setDeductAmount] = useState<number | null>(null)
  const [isSalarySeparate, setIsSalarySeparate] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)

    try {
      const { calculateCommission } = await import('@/actions/payroll/calculateCommission')
      const { getEmployeeDebtInfo } = await import('@/actions/payroll/getPendingLoans')

      const [commissionResult, debtResult] = await Promise.all([
        calculateCommission(employee.id, periodStart, periodEnd),
        getEmployeeDebtInfo(employee.id),
      ])

      if (commissionResult.success) {
        setCommission(commissionResult.data || null)
        const allDays = new Set(commissionResult.data?.dayGroups.map(d => d.date) || [])
        setExpandedDays(allDays)
      }
      if (debtResult.success) {
        setDebt(debtResult.data || null)
      }
    } catch (err) {
      setError('Error al calcular la comisión')
    }

    setLoading(false)
  }

  const handleGenerateReceipt = async () => {
    setGenerating(true)
    setError(null)
    setSuccess(false)

    const result = await generatePayrollReceipt({
      employee_id: employee.id,
      period_start: periodStart,
      period_end: periodEnd,
      period_type: 'weekly' as PeriodType,
      deduct_loans: deductLoans,
      deduct_amount: deductAmount || undefined,
      is_salary_separate: isSalarySeparate,
    })

    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error || 'Error al generar el recibo')
    }

    setGenerating(false)
  }

  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedDays(newExpanded)
  }

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  const netPayable =
    (commission?.total_commission || 0) +
    (employee.payment_type === 'mixed' && !isSalarySeparate
      ? employee.fixed_salary || 0
      : 0) -
    (deductLoans ? deductAmount || debt?.total_pending || 0 : 0)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/payroll"
        className="inline-flex items-center gap-2 text-sm transition-colors"
        style={{ color: COLORS.textSecondary }}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Nómina
      </Link>

      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{
          background: COLORS.primaryGradient,
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1
              className="text-3xl font-bold text-white"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {employee.name}
            </h1>
            <p className="text-white/80">
              {employee.default_commission_rate}% comisión • {employee.payment_type === 'commission' ? 'Solo comisión' : employee.payment_type === 'salary' ? 'Sueldo fijo' : 'Mixto'}
              {employee.fixed_salary && ` • ${formatCurrencyCOP(employee.fixed_salary)}/semana`}
            </p>
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
            style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
          >
            Período a Consultar
          </h2>
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="px-6 py-2 rounded-xl font-medium text-white transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: COLORS.primary }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            {loading ? 'Calculando...' : 'Calcular'}
          </button>
        </div>
        <PeriodSelector
          startDate={periodStart}
          endDate={periodEnd}
          onStartChange={setPeriodStart}
          onEndChange={setPeriodEnd}
          colors={COLORS}
        />
      </div>

      {commission && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: COLORS.surfaceGlass,
                borderColor: COLORS.border,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: COLORS.success + '15' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: COLORS.success }} />
                </div>
                <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                  Comisiones
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: COLORS.success }}>
                {formatCurrencyCOP(commission.total_commission)}
              </p>
            </div>

            <div
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: COLORS.surfaceGlass,
                borderColor: COLORS.border,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: COLORS.primary + '15' }}>
                  <Scissors className="w-4 h-4" style={{ color: COLORS.primary }} />
                </div>
                <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                  Servicios
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
                {commission.services.length}
              </p>
            </div>

            <div
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: COLORS.surfaceGlass,
                borderColor: COLORS.border,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: COLORS.warning + '15' }}>
                  <PiggyBank className="w-4 h-4" style={{ color: COLORS.warning }} />
                </div>
                <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                  Préstamos
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: COLORS.warning }}>
                {formatCurrencyCOP(debt?.total_pending || 0)}
              </p>
            </div>

            <div
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: COLORS.surfaceGlass,
                borderColor: COLORS.border,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: COLORS.success + '15' }}>
                  <Wallet className="w-4 h-4" style={{ color: COLORS.success }} />
                </div>
                <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                  Neto a Pagar
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: COLORS.success }}>
                {formatCurrencyCOP(netPayable)}
              </p>
            </div>
          </div>

          {/* Day Groups / Appointments Detail */}
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
                style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
              >
                Detalle por Día
              </h2>
              <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                {commission.dayGroups.length} día{commission.dayGroups.length !== 1 ? 's' : ''} con citas
              </span>
            </div>

            {commission.dayGroups.length === 0 ? (
              <div className="text-center py-12">
                <Scissors className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.textMuted }} />
                <p style={{ color: COLORS.textMuted }}>No hay servicios en este período</p>
              </div>
            ) : (
              <div className="space-y-2">
                {commission.dayGroups.map((day) => {
                  const isExpanded = expandedDays.has(day.date)
                  const dayDate = new Date(day.date)
                  const isToday = dayDate.toDateString() === new Date().toDateString()

                  return (
                    <div
                      key={day.date}
                      className="rounded-xl overflow-hidden"
                      style={{ backgroundColor: COLORS.surfaceSubtle }}
                    >
                      {/* Day Header */}
                      <button
                        onClick={() => toggleDay(day.date)}
                        className="w-full flex items-center justify-between p-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{
                              backgroundColor: isToday ? COLORS.primary : COLORS.primary + '15',
                              color: isToday ? '#FFFFFF' : COLORS.primary,
                            }}
                          >
                            {dayDate.getDate()}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-sm" style={{ color: COLORS.textPrimary }}>
                              {day.dayOfWeek} {day.dateLabel}
                              {isToday && (
                                <span
                                  className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                                  style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                                >
                                  Hoy
                                </span>
                              )}
                            </p>
                            <p className="text-xs" style={{ color: COLORS.textMuted }}>
                              {day.services.length} servicio{day.services.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold" style={{ color: COLORS.success }}>
                              {formatCurrencyCOP(day.dailyCommission)}
                            </p>
                            <p className="text-xs" style={{ color: COLORS.textMuted }}>
                              de {formatCurrencyCOP(day.dailyTotal)}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                          ) : (
                            <ChevronRight className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                          )}
                        </div>
                      </button>

                      {/* Expanded Services */}
                      {isExpanded && (
                        <div
                          className="border-t px-4 pb-4 pt-2"
                          style={{ borderColor: COLORS.border }}
                        >
                          <div className="space-y-2 ml-13">
                            {day.services.map((service, idx) => {
                              const time = new Date(service.date).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between py-2 px-3 rounded-lg"
                                  style={{ backgroundColor: COLORS.surface }}
                                >
                                  <div className="flex items-center gap-3">
                                    <Clock className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                                    <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>
                                      {time}
                                    </span>
                                    <Scissors className="w-4 h-4" style={{ color: COLORS.primary }} />
                                    <span className="text-sm" style={{ color: COLORS.textPrimary }}>
                                      {service.service_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>
                                      {service.commission_rate}%
                                    </span>
                                    <span className="font-semibold text-sm" style={{ color: COLORS.success }}>
                                      {formatCurrencyCOP(service.commission_amount)}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Debt Section with Progress */}
          {debt && debt.loans.length > 0 && (
            <div
              className="p-6 rounded-2xl border"
              style={{
                backgroundColor: COLORS.surfaceGlass,
                borderColor: debt.is_over_limit ? COLORS.error : debt.is_at_warning_threshold ? COLORS.warning : COLORS.border,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="w-5 h-5"
                    style={{ color: debt.is_over_limit ? COLORS.error : COLORS.warning }}
                  />
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    Préstamos Pendientes
                  </h2>
                </div>
                <span
                  className="text-xl font-bold"
                  style={{ color: debt.is_over_limit ? COLORS.error : COLORS.warning }}
                >
                  {formatCurrencyCOP(debt.total_pending)}
                </span>
              </div>

              {/* Debt Limit Progress */}
              {debt.limit && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: COLORS.textMuted }}>Límite de deuda</span>
                    <span style={{ color: COLORS.textSecondary }}>
                      {formatCurrencyCOP(debt.total_pending)} / {formatCurrencyCOP(debt.limit)}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: COLORS.surfaceSubtle }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((debt.total_pending / debt.limit) * 100, 100)}%`,
                        backgroundColor:
                          debt.is_over_limit
                            ? COLORS.error
                            : debt.is_at_warning_threshold
                            ? COLORS.warning
                            : COLORS.success,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {debt.loans.map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ backgroundColor: COLORS.surfaceSubtle }}
                  >
                    <div>
                      <p className="font-medium text-sm" style={{ color: COLORS.textPrimary }}>
                        {loan.concept}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>
                        {new Date(loan.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <span className="font-semibold" style={{ color: COLORS.error }}>
                      {formatCurrencyCOP(loan.remaining_amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deductLoans}
                    onChange={(e) => setDeductLoans(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm" style={{ color: COLORS.textPrimary }}>
                    Descontar del pago
                  </span>
                </label>

                {deductLoans && (
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
                      Monto a descontar (vacío = total)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      max={debt.total_pending}
                      value={deductAmount || ''}
                      onChange={(e) => setDeductAmount(e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-4 py-2 rounded-xl border text-sm"
                      style={{
                        borderColor: COLORS.border,
                        color: COLORS.textPrimary,
                        backgroundColor: COLORS.surface,
                      }}
                      placeholder={debt.total_pending.toLocaleString('es-CO')}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Receipt Generation */}
          <div
            className="p-6 rounded-2xl border"
            style={{
              backgroundColor: COLORS.surfaceGlass,
              borderColor: COLORS.border,
            }}
          >
            <div className="text-center mb-6">
              <h2
                className="text-xl font-bold mb-2"
                style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
              >
                Recibo de Pago
              </h2>
            </div>

            <div
              className="p-6 rounded-xl mb-6"
              style={{ backgroundColor: COLORS.surfaceSubtle }}
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: COLORS.textSecondary }}>Comisión servicios</span>
                  <span className="font-medium" style={{ color: COLORS.textPrimary }}>
                    {formatCurrencyCOP(commission.total_commission)}
                  </span>
                </div>

                {employee.payment_type === 'mixed' && (
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.textSecondary }}>Sueldo fijo</span>
                    <span className="font-medium" style={{ color: COLORS.textPrimary }}>
                      {formatCurrencyCOP(employee.fixed_salary || 0)}
                    </span>
                  </div>
                )}

                {deductLoans && (deductAmount ?? debt?.total_pending ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.error }}>(-) Préstamos</span>
                    <span className="font-medium" style={{ color: COLORS.error }}>
                      -{formatCurrencyCOP(deductAmount ?? debt?.total_pending ?? 0)}
                    </span>
                  </div>
                )}

                <div
                  className="flex justify-between pt-3 border-t"
                  style={{ borderColor: COLORS.border }}
                >
                  <span className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
                    NETO A PAGAR
                  </span>
                  <span className="text-2xl font-bold" style={{ color: COLORS.success }}>
                    {formatCurrencyCOP(netPayable)}
                  </span>
                </div>
              </div>
            </div>

            {success && (
              <div
                className="mb-4 p-4 rounded-xl flex items-center gap-3"
                style={{ backgroundColor: COLORS.successLight }}
              >
                <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.success }} />
                <span style={{ color: COLORS.success }}>¡Recibo generado correctamente!</span>
              </div>
            )}

            {error && (
              <div
                className="mb-4 p-4 rounded-xl flex items-center gap-3"
                style={{ backgroundColor: COLORS.errorLight }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: COLORS.error }} />
                <span style={{ color: COLORS.error }}>{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerateReceipt}
              disabled={generating || commission.services.length === 0}
              className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: COLORS.primary }}
            >
              {generating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Receipt className="w-5 h-5" />
              )}
              {generating ? 'Generando...' : 'Generar Recibo'}
            </button>
          </div>
        </>
      )}

      {/* Receipt History */}
      {receipts.length > 0 && (
        <div
          className="p-6 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
          >
            Historial de Recibos
          </h2>

          <div className="space-y-3">
            {receipts.slice(0, 5).map((receipt) => (
              <div
                key={receipt.id}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: COLORS.surfaceSubtle }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: COLORS.success + '15' }}
                  >
                    <Receipt className="w-5 h-5" style={{ color: COLORS.success }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: COLORS.textPrimary }}>
                      {new Date(receipt.payment_date).toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                      {receipt.period_start} - {receipt.period_end}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold" style={{ color: COLORS.success }}>
                    {formatCurrencyCOP(receipt.net_amount)}
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor:
                        receipt.status === 'paid' ? COLORS.successLight : COLORS.warningLight,
                      color:
                        receipt.status === 'paid' ? COLORS.success : COLORS.warning,
                    }}
                  >
                    {receipt.status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}