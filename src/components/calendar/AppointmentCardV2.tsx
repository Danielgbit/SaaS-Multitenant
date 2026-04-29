'use client'

import React from 'react'
import { Clock, Building2 } from 'lucide-react'
import type { AppointmentWithDetails, CalendarColors } from '@/types/calendar'

interface AppointmentCardV2Props {
  apt: AppointmentWithDetails
  COLORS: CalendarColors
  STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }>
  formatTime: (dateString: string) => string
  onClick: () => void
  showEmployeeDot?: boolean
  employeeColors?: Record<string, string>
}

const DEFAULT_EMPLOYEE_COLORS = [
  '#0F4C5C', '#38BDF8', '#16A34A', '#EA580C', '#8B5CF6',
  '#EC4899', '#F59E0B', '#06B6D4', '#84CC16', '#F43F5E'
]

function getEmployeeColor(employeeId: string, index: number): string {
  return DEFAULT_EMPLOYEE_COLORS[index % DEFAULT_EMPLOYEE_COLORS.length]
}

export function AppointmentCardV2({
  apt,
  COLORS,
  STATUS_CONFIG,
  formatTime,
  onClick,
  showEmployeeDot = false,
  employeeColors = {}
}: AppointmentCardV2Props) {
  const st = STATUS_CONFIG[apt.status] || {
    color: COLORS.textSecondary,
    bg: COLORS.borderLight,
    label: apt.status,
    icon: null
  }

  const clientInitial = apt.client?.name?.charAt(0).toUpperCase() || 'C'

  const employeeColor = employeeColors[apt.employee_id] || COLORS.primary

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer group relative overflow-hidden"
      style={{
        backgroundColor: st.bg,
        border: `1px solid ${st.color}30`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {showEmployeeDot && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: employeeColor }}
        />
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" style={{ color: st.color }} />
          <span className="text-xs font-bold" style={{ color: st.color }}>
            {formatTime(apt.start_time)}
          </span>
        </div>
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{
            backgroundColor: COLORS.isDark ? `${st.color}20` : st.color + '15',
            color: st.color,
          }}
        >
          {apt.service?.name?.slice(0, 10) || 'Servicio'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: COLORS.primary }}
        >
          {clientInitial}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: COLORS.textPrimary }}
          >
            {apt.client?.name || 'Cliente'}
          </p>
          {showEmployeeDot && apt.employee && (
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3 flex-shrink-0" style={{ color: COLORS.textMuted }} />
              <span
                className="text-xs truncate"
                style={{ color: COLORS.textSecondary }}
              >
                {apt.employee.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {apt.service && (
        <div
          className="mt-2 pt-2 border-t text-xs"
          style={{ borderColor: st.color + '40', color: COLORS.textMuted }}
        >
          {apt.service.name}
        </div>
      )}
    </button>
  )
}
