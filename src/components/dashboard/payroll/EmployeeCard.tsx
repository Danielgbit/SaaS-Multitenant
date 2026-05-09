'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Briefcase, Clock } from 'lucide-react'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import type { ThemeColors } from '@/hooks/useThemeColors'

export interface EmployeeCardData {
  id: string
  name: string
  contract_type: string | null
  payment_type: string | null
  percentage: number | null
  base_salary: number | null
  employment_type?: string
  part_time_percentage?: number
}

interface EmployeeCardProps {
  employee: EmployeeCardData
  selected: boolean
  onToggle: () => void
  COLORS: ThemeColors
  showPartTime?: boolean
  index?: number
}

function getInitials(name: string) {
  const parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

export default function EmployeeCard({
  employee, selected, onToggle, COLORS, showPartTime = false, index = 0,
}: EmployeeCardProps) {
  const [expanded, setExpanded] = useState(false)

  const badge = employee.payment_type === 'porcentaje'
    ? { label: `${employee.percentage || 60}% comisión`, color: COLORS.success, bg: COLORS.success + '15' }
    : employee.payment_type === 'mixed'
      ? { label: 'Mixto', color: COLORS.warning, bg: COLORS.warning + '15' }
      : { label: 'Sueldo fijo', color: COLORS.primary, bg: COLORS.primary + '15' }

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer group"
      style={{
        backgroundColor: selected ? COLORS.primary + '08' : COLORS.surface,
        borderColor: selected ? COLORS.primary : COLORS.border,
        boxShadow: selected ? `0 0 0 1px ${COLORS.primary}` : 'none',
        animationDelay: `${index * 50}ms`,
      }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() }
      }}
      aria-label={`Seleccionar empleado ${employee.name}`}
      aria-pressed={selected}
    >
      <div className="flex items-center p-4">
        <div
          className="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 mr-3 flex-shrink-0"
          style={{
            borderColor: selected ? COLORS.primary : COLORS.border,
            backgroundColor: selected ? COLORS.primary : 'transparent',
            transform: selected ? 'scale(1)' : 'scale(0.95)',
          }}
        >
          {selected && <Check className="w-3.5 h-3.5 text-white" />}
        </div>

        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 transition-all duration-200 group-hover:scale-105"
          style={{
            backgroundColor: selected ? COLORS.primary + '20' : COLORS.primary + '10',
            color: COLORS.primary,
          }}
        >
          {getInitials(employee.name)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" style={{ color: COLORS.textPrimary }}>
            {employee.name}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: COLORS.surfaceSubtle || COLORS.primary + '08', color: COLORS.textMuted }}>
              {employee.contract_type === 'laboral' ? 'Laboral' : 'Prestación'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
            {showPartTime && employee.part_time_percentage && (
              <span className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1" style={{ backgroundColor: COLORS.warning + '15', color: COLORS.warning }}>
                <Clock className="w-3 h-3" />
                {employee.part_time_percentage}%
              </span>
            )}
          </div>
        </div>

        {employee.payment_type !== 'porcentaje' && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="p-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: COLORS.textMuted }}
            aria-label={expanded ? 'Colapsar detalles' : 'Expandir detalles'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && employee.payment_type !== 'porcentaje' && (
        <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '10' }}>
              <Briefcase className="w-4 h-4" style={{ color: COLORS.primary }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>Salario base</p>
              <p className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                {formatCurrencyCOP(employee.base_salary || 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
