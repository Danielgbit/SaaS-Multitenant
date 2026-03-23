'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import {
  ArrowLeft,
  Settings,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Save
} from 'lucide-react'
import { updatePayrollSettings } from '@/actions/payroll/getPayrollSettings'
import type { PayrollType } from '@/types/payroll'

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

type PayrollSettings = {
  payroll_type: PayrollType
  week_starts_on: number
  month_day: number
  allow_advance_payments: boolean
}

interface PayrollSettingsClientProps {
  organizationId: string
  settings: PayrollSettings | null | undefined
}

const payrollTypeOptions: { value: PayrollType; label: string; description: string }[] = [
  { value: 'weekly', label: 'Semanal', description: 'Pago cada semana' },
  { value: 'biweekly', label: 'Quincenal', description: 'Pago cada 15 días' },
  { value: 'monthly', label: 'Mensual', description: 'Pago una vez al mes' },
  { value: 'adhoc', label: 'Pago inmediato', description: 'Sin período fijo, se paga cuando se necesita' },
]

const weekDayOptions = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

export function PayrollSettingsClient({
  organizationId,
  settings,
}: PayrollSettingsClientProps) {
  const COLORS = useColors()
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [payrollType, setPayrollType] = useState<PayrollType>('weekly')
  const [weekStartsOn, setWeekStartsOn] = useState(1)
  const [monthDay, setMonthDay] = useState(1)
  const [allowAdvancePayments, setAllowAdvancePayments] = useState(true)

  useEffect(() => {
    setMounted(true)
    if (settings) {
      setPayrollType(settings.payroll_type)
      setWeekStartsOn(settings.week_starts_on)
      setMonthDay(settings.month_day)
      setAllowAdvancePayments(settings.allow_advance_payments)
    }
  }, [settings])

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    const result = await updatePayrollSettings(organizationId, {
      payroll_type: payrollType,
      week_starts_on: weekStartsOn,
      month_day: monthDay,
      allow_advance_payments: allowAdvancePayments,
    })

    setSaving(false)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error || 'Error al guardar')
    }
  }

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
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              Configuración
            </p>
            <h1
              className="text-3xl font-bold text-white"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Nómina
            </h1>
            <p className="text-sm mt-1 text-white/80">
              Define cómo se calculan y realizan los pagos
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div
        className="p-6 rounded-2xl border space-y-6"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
        }}
      >
        {/* Payroll Type */}
        <div>
          <label
            className="block text-sm font-medium mb-3"
            style={{ color: COLORS.textPrimary }}
          >
            Tipo de Pago
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {payrollTypeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPayrollType(opt.value)}
                className="p-4 rounded-xl border-2 text-left transition-all duration-200"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: payrollType === opt.value ? COLORS.primary : COLORS.border,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5"
                    style={{
                      borderColor: payrollType === opt.value ? COLORS.primary : COLORS.border,
                      backgroundColor:
                        payrollType === opt.value ? COLORS.primary : 'transparent',
                    }}
                  >
                    {payrollType === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <p
                      className="font-medium"
                      style={{
                        color: payrollType === opt.value ? COLORS.primary : COLORS.textPrimary,
                      }}
                    >
                      {opt.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                      {opt.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Week Starts On */}
        {payrollType === 'weekly' && (
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textPrimary }}
            >
              Inicio de Semana
            </label>
            <select
              value={weekStartsOn}
              onChange={(e) => setWeekStartsOn(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border text-sm"
              style={{
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                backgroundColor: COLORS.surface,
              }}
            >
              {weekDayOptions.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              Los pagos se realizarán al final de cada semana
            </p>
          </div>
        )}

        {/* Month Day */}
        {payrollType === 'monthly' && (
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textPrimary }}
            >
              Día del Mes
            </label>
            <select
              value={monthDay}
              onChange={(e) => setMonthDay(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border text-sm"
              style={{
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                backgroundColor: COLORS.surface,
              }}
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Día {day}
                </option>
              ))}
            </select>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              Los pagos se realizarán el día {monthDay} de cada mes
            </p>
          </div>
        )}

        {/* Allow Advance Payments */}
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: COLORS.surfaceSubtle }}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowAdvancePayments}
              onChange={(e) => setAllowAdvancePayments(e.target.checked)}
              className="w-5 h-5 rounded mt-0.5"
            />
            <div>
              <p className="font-medium" style={{ color: COLORS.textPrimary }}>
                Permitir anticipos
              </p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                Los empleados pueden solicitar pagos fuera del período establecido
              </p>
            </div>
          </label>
        </div>

        {/* Success Message */}
        {success && (
          <div
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ backgroundColor: COLORS.successLight }}
          >
            <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.success }} />
            <span style={{ color: COLORS.success }}>¡Configuración guardada correctamente!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ backgroundColor: COLORS.errorLight }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: COLORS.error }} />
            <span style={{ color: COLORS.error }}>{error}</span>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 flex items-center gap-2"
            style={{ backgroundColor: COLORS.primary }}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}
