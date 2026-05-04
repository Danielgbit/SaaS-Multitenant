'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  ChevronLeft,
  Loader2,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
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
    warning: '#F59E0B',
    error: '#DC2626',
    isDark,
  }
}

const MONTHS = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

interface CreatePeriodPageProps {
  organizationId: string
  employees: Array<{
    id: string
    name: string
    contract_type: string | null
    payment_type: string | null
    percentage: number | null
    base_salary: number | null
  }>
  existingPeriods: string[]
}

export function CreatePeriodPage({
  organizationId,
  employees,
  existingPeriods,
}: CreatePeriodPageProps) {
  const COLORS = useColors()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'))
  const [notes, setNotes] = useState('')

  const period = `${selectedYear}-${selectedMonth}`
  const periodExists = existingPeriods.includes(period)

  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || ''
  const periodLabel = `${monthLabel} ${selectedYear}`

  const handleCreate = async () => {
    if (periodExists) return
    setLoading(true)
    setError(null)

    try {
      const { createPayrollPeriod } = await import('@/actions/payroll/createPayrollPeriod')
      const result = await createPayrollPeriod({
        organization_id: organizationId,
        period,
        notes: notes || undefined,
      })

      if (result.success && result.data) {
        router.push(`/payroll/${result.data.period_id}`)
      } else {
        setError(result.error || 'Error al crear período')
      }
    } catch (e) {
      setError('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/payroll"
            className="p-2 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: COLORS.textSecondary }}
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>
              Nómina
            </p>
            <h1
              className="text-2xl font-bold"
              style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
            >
              Crear Período
            </h1>
          </div>
        </div>

        {/* Period Preview Card */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: COLORS.primaryGradient,
          }}
        >
          <div className="p-6 md:p-8 text-center">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h2
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              {periodLabel}
            </h2>
            <p className="text-white/70 text-sm">
              {employees.length} empleados activos
            </p>
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
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
          >
            Seleccionar Período
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.textSecondary }}
              >
                Mes
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border transition-colors"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                }}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: COLORS.textSecondary }}
              >
                Año
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border transition-colors"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                }}
              >
                <option value={now.getFullYear()}>{now.getFullYear()}</option>
                <option value={now.getFullYear() + 1}>{now.getFullYear() + 1}</option>
              </select>
            </div>
          </div>

          {periodExists && (
            <div
              className="mt-4 p-4 rounded-xl flex items-center gap-3"
              style={{ backgroundColor: COLORS.error + '15' }}
            >
              <AlertCircle className="w-5 h-5" style={{ color: COLORS.error }} />
              <p className="text-sm" style={{ color: COLORS.error }}>
                Ya existe un período para {periodLabel}
              </p>
            </div>
          )}
        </div>

        {/* Employees Preview */}
        <div
          className="p-6 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5" style={{ color: COLORS.primary }} />
            <h3
              className="text-lg font-semibold"
              style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
            >
              Empleados a incluir
            </h3>
          </div>

          <div className="space-y-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ backgroundColor: COLORS.surfaceSubtle }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: COLORS.primary + '15',
                      color: COLORS.primary,
                    }}
                  >
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: COLORS.textPrimary }}>
                      {emp.name}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                      {emp.contract_type === 'laboral' ? 'Laboral' : 'Prestación de servicios'}
                      {' · '}
                      {emp.payment_type === 'porcentaje' ? `${emp.percentage || 60}% comisión` : 'Sueldo fijo'}
                    </p>
                  </div>
                </div>
                <CheckCircle className="w-4 h-4" style={{ color: COLORS.success }} />
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div
          className="p-6 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
          >
            Notas (opcional)
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Agregar notas sobre este período..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border resize-none"
            style={{
              backgroundColor: COLORS.surface,
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ backgroundColor: COLORS.error + '15' }}
          >
            <AlertCircle className="w-5 h-5" style={{ color: COLORS.error }} />
            <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/payroll"
            className="flex-1 px-6 py-3 rounded-xl text-sm font-medium text-center transition-colors"
            style={{
              backgroundColor: COLORS.surfaceSubtle,
              color: COLORS.textSecondary,
            }}
          >
            Cancelar
          </Link>
          <button
            onClick={handleCreate}
            disabled={periodExists || loading}
            className="flex-1 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: COLORS.primary,
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando...
              </span>
            ) : 'Crear Período'}
          </button>
        </div>
      </div>
    </div>
  )
}