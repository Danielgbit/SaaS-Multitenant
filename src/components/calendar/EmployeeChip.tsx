'use client'

import React from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import type { EmployeeWithWorkload, CalendarColors } from '@/types/calendar'

interface EmployeeChipProps {
  employee: EmployeeWithWorkload
  isSelected: boolean
  onClick: () => void
  variant: 'full' | 'compact'
  COLORS: CalendarColors
}

const WORKLOAD_COLORS = {
  low: { bg: '#D1FAE5', text: '#16A34A', border: '#16A34A' },
  normal: { bg: '#F1F5F9', text: '#5A6B70', border: '#E8ECEE' },
  busy: { bg: '#FFF7ED', text: '#EA580C', border: '#EA580C' },
  overloaded: { bg: '#FEE2E2', text: '#DC2626', border: '#DC2626' }
}

export function EmployeeChip({
  employee,
  isSelected,
  onClick,
  variant,
  COLORS
}: EmployeeChipProps) {
  const workloadColors = WORKLOAD_COLORS[employee.workloadLevel]
  const initial = employee.name.charAt(0).toUpperCase()

  const getInitials = (name: string): string => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }
    return initial
  }

  const initials = getInitials(employee.name)

  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 rounded-xl transition-all duration-200 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${variant === 'full' ? 'px-3 py-2' : 'px-2.5 py-2'}
      `}
      style={{
        backgroundColor: isSelected
          ? `${COLORS.primary}15`
          : COLORS.surfaceSubtle,
        border: `2px solid ${
          isSelected ? COLORS.primary : COLORS.border
        }`,
        boxShadow: isSelected
          ? `0 0 0 3px ${COLORS.primary}20`
          : '0 2px 4px rgba(0,0,0,0.04)',
        transform: isSelected ? 'scale(1)' : 'scale(1)',
      }}
      aria-label={`Filtrar por ${employee.name}, ${employee.weeklyCount} citas esta semana`}
      aria-checked={isSelected}
      role="radio"
    >
      <div
        className="flex items-center justify-center rounded-full font-semibold text-white transition-transform duration-200 hover:scale-110"
        style={{
          width: variant === 'full' ? 32 : 28,
          height: variant === 'full' ? 32 : 28,
          backgroundColor: isSelected ? COLORS.primary : COLORS.primary + '80',
          fontSize: variant === 'full' ? 13 : 11,
          minWidth: variant === 'full' ? 32 : 28,
        }}
      >
        {initials}
      </div>

      {variant === 'full' && (
        <span
          className="font-semibold whitespace-nowrap"
          style={{
            color: COLORS.textPrimary,
            fontSize: 14,
          }}
        >
          {employee.name.split(' ')[0]}
        </span>
      )}

      <span
        className={`
          inline-flex items-center justify-center px-1.5 py-0.5 rounded-full font-medium
          ${employee.workloadLevel === 'overloaded' ? 'animate-pulse' : ''}
        `}
        style={{
          backgroundColor: workloadColors.bg,
          color: workloadColors.text,
          fontSize: variant === 'full' ? 12 : 10,
          minWidth: variant === 'full' ? 20 : 18,
          border: `1px solid ${workloadColors.border}30`
        }}
      >
        {employee.weeklyCount}
      </span>

      {isSelected && (
        <div
          className="absolute -top-1 -right-1"
          style={{ color: COLORS.primary }}
        >
          <CheckCircle2 className="w-4 h-4 fill-current" />
        </div>
      )}

      {!employee.hasConfiguredSchedule && (
        <div
          className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#F59E0B' }}
          title="Sin horarios configurados"
        >
          <AlertTriangle className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  )
}
