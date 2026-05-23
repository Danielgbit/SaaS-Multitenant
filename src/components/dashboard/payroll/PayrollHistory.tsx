'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Search } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { PAYROLL_STATUS_CONFIG } from '@/lib/payroll/constants'
import type { PayrollPeriodWithEmployees } from '@/types/payroll'

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function parsePeriod(period: string) {
  const [year, month] = period.split('-').map(Number)
  return `${MONTHS_ES[month - 1]} ${year}`
}

function StatusBadge({ status }: { status: string }) {
  const COLORS = useThemeColors()
  const config = {
    paid: {
      bg: COLORS.success + '20',
      color: COLORS.success,
      label: PAYROLL_STATUS_CONFIG.paid.label,
    },
  }[status] || { bg: COLORS.textMuted + '20', color: COLORS.textMuted, label: status }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}

interface PayrollHistoryProps {
  periods: PayrollPeriodWithEmployees[]
}

export function PayrollHistory({ periods }: PayrollHistoryProps) {
  const COLORS = useThemeColors()

  const years = [...new Set(periods.map((p) => p.period.split('-')[0]))].sort(
    (a, b) => Number(b) - Number(a)
  )

  const [selectedYear, setSelectedYear] = useState<string>('all')

  const filtered = selectedYear === 'all'
    ? periods
    : periods.filter((p) => p.period.startsWith(selectedYear))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: COLORS.primaryGradient }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <Link
            href="/payroll"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Nómina
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Historial
              </p>
              <h1
                className="text-3xl font-bold text-white font-heading"
              >
                Períodos Anteriores
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Filter by year */}
      <div className="flex items-center gap-3">
        <Search className="w-4 h-4" style={{ color: COLORS.textMuted }} />
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm font-medium border"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: COLORS.border,
            color: COLORS.textPrimary,
          }}
        >
          <option value="all">Todos los años</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <span className="text-xs" style={{ color: COLORS.textMuted }}>
          {filtered.length} período{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Periods grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((period) => (
            <Link
              key={period.id}
              href={`/payroll/period/${period.id}`}
              className="rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg"
              style={{
                backgroundColor: COLORS.surfaceGlass,
                borderColor: COLORS.border,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <h3
                  className="text-lg font-semibold font-heading"
                  style={{ color: COLORS.textPrimary }}
                >
                  {parsePeriod(period.period)}
                </h3>
                <StatusBadge status={period.status} />
              </div>
              <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>
                {period.total_employees || 0} empleados
              </p>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: COLORS.textMuted }}>Neto pagado</span>
                <span className="font-semibold" style={{ color: COLORS.success }}>
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                  }).format(period.total_net_pay || 0)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div
          className="text-center py-16 px-6 rounded-2xl border border-dashed"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.textMuted }} />
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            No hay períodos pagados en {selectedYear}
          </p>
        </div>
      )}
    </div>
  )
}
