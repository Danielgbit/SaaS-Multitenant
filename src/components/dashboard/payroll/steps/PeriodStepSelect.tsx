'use client'

import { ChevronLeft, Calendar, Clock, Sparkles, Copy, Plus, AlertCircle, ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import type { ThemeColors } from '@/hooks/useThemeColors'

const MONTHS = [
  { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' }, { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
]

interface PeriodStepSelectProps {
  COLORS: ThemeColors
  mounted: boolean
  selectedMonth: string
  selectedYear: string
  onMonthChange: (m: string) => void
  onYearChange: (y: string) => void
  periodExists: boolean
  periodLabel: string
  employeesCount: number
  previousPeriod: { period: string; total_employees: number } | null | undefined
  previousPeriodLabel: string | null
  onCopyPrevious: () => void
  onStartEmpty: () => void
}

export default function PeriodStepSelect({
  COLORS, mounted, selectedMonth, selectedYear, onMonthChange, onYearChange,
  periodExists, periodLabel, employeesCount,
  previousPeriod, previousPeriodLabel, onCopyPrevious, onStartEmpty,
}: PeriodStepSelectProps) {
  return (
    <div className={`min-h-screen p-6 md:p-8 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/nomina" className="p-2 rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" style={{ color: COLORS.textSecondary }} aria-label="Volver a nómina">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Nómina</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>Paso 1 de 2</span>
            </div>
            <h1 className="text-2xl font-bold font-heading" style={{ color: COLORS.textPrimary }}>Crear Período</h1>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primary}dd 100%)`, borderColor: COLORS.primary + '40' }}>
          <div className="absolute inset-0 opacity-10"><div className="absolute top-4 right-4"><Calendar className="w-24 h-24 text-white" /></div></div>
          <div className="p-6 md:p-8 text-center relative z-10">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-transform duration-300" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 font-heading">{periodLabel}</h2>
            <p className="text-white/70 text-sm">¿Cómo quieres crear este período?</p>
            {periodExists && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-medium">Período ya existe</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl border transition-all duration-200" style={{ backgroundColor: COLORS.surfaceGlass || COLORS.surface, borderColor: COLORS.border, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5" style={{ color: COLORS.primary }} />
            <h3 className="text-lg font-semibold font-heading" style={{ color: COLORS.textPrimary }}>Seleccionar Período</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                <Calendar className="w-4 h-4" /> Mes
              </label>
              <div className="relative">
                <select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl border transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2"
                  style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary }}>
                  {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: COLORS.textMuted }} />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                <Clock className="w-4 h-4" /> Año
              </label>
              <div className="relative">
                <select value={selectedYear} onChange={(e) => onYearChange(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl border transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2"
                  style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary }}>
                  <option value={String(new Date().getFullYear())}>{new Date().getFullYear()}</option>
                  <option value={String(new Date().getFullYear() + 1)}>{new Date().getFullYear() + 1}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: COLORS.textMuted }} />
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: COLORS.surfaceSubtle || COLORS.primary + '08' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                <Sparkles className="w-5 h-5" style={{ color: COLORS.primary }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>Período seleccionado</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>{employeesCount} empleados activos disponibles</p>
              </div>
            </div>
            <p className="text-lg font-bold font-heading" style={{ color: COLORS.primary }}>{periodLabel}</p>
          </div>
          {periodExists && (
            <div className="mt-4 p-4 rounded-xl flex items-center gap-3 animate-pulse" style={{ backgroundColor: COLORS.error + '15' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.error }} />
              <p className="text-sm" style={{ color: COLORS.error }}>Ya existe un período para {periodLabel}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {previousPeriod && (
            <button onClick={onCopyPrevious} disabled={periodExists}
              className="w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer hover:shadow-md"
              style={{ borderColor: periodExists ? COLORS.border : COLORS.primary + '40', backgroundColor: COLORS.surface }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105" style={{ backgroundColor: COLORS.primary + '15' }}>
                  <Copy className="w-6 h-6" style={{ color: COLORS.primary }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold" style={{ color: COLORS.textPrimary }}>Copiar de {previousPeriodLabel}</p>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>Recomendado</span>
                  </div>
                  <p className="text-sm" style={{ color: COLORS.textMuted }}>Usa los {previousPeriod.total_employees} empleados del período anterior</p>
                </div>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" style={{ color: COLORS.textMuted }} />
              </div>
            </button>
          )}
          <button onClick={onStartEmpty} disabled={periodExists}
            className="w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer hover:shadow-md"
            style={{ borderColor: periodExists ? COLORS.border : COLORS.border, backgroundColor: COLORS.surface }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105" style={{ backgroundColor: COLORS.surfaceSubtle || COLORS.primary + '08' }}>
                <Plus className="w-6 h-6" style={{ color: COLORS.textSecondary }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold" style={{ color: COLORS.textPrimary }}>Crear desde cero</p>
                <p className="text-sm" style={{ color: COLORS.textMuted }}>Selecciona los empleados manualmente</p>
              </div>
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" style={{ color: COLORS.textMuted }} />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
