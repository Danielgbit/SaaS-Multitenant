'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { AppointmentWithDetails, CalendarColors } from '@/types/calendar'
import type { ClusterGroup } from '@/hooks/useAppointmentClusters'

interface AppointmentClusterCardProps {
  cluster: ClusterGroup
  COLORS: CalendarColors
  STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }>
  formatTime: (dateString: string) => string
  onAppointmentClick: (apt: AppointmentWithDetails) => void
  employeeColors: Record<string, string>
}

const DEFAULT_EMPLOYEE_COLORS = [
  '#0F4C5C', '#38BDF8', '#16A34A', '#EA580C', '#8B5CF6',
  '#EC4899', '#F59E0B', '#06B6D4', '#84CC16', '#F43F5E'
]

function getEmployeeInitials(name: string | undefined): string {
  if (!name) return 'N/A'
  const parts = name.split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase() + '.'
  return parts[0].charAt(0).toUpperCase() + '. ' + parts.slice(1).join(' ')
}

export function AppointmentClusterCard({
  cluster,
  COLORS,
  STATUS_CONFIG,
  formatTime,
  onAppointmentClick,
  employeeColors
}: AppointmentClusterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const primaryApt = cluster.primaryApt
  const otherCount = cluster.totalCount - 1

  const uniqueEmployeeIds = [...new Set(cluster.appointments.map(a => a.employee_id))]

  const borderGradient = uniqueEmployeeIds.length >= 2
    ? `linear-gradient(180deg, ${uniqueEmployeeIds.map((id, idx) => {
        const color = employeeColors[id] || DEFAULT_EMPLOYEE_COLORS[idx % DEFAULT_EMPLOYEE_COLORS.length]
        return color
      }).join(', ')})`
    : employeeColors[primaryApt.employee_id] || COLORS.primary

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleAppointmentClick = (apt: AppointmentWithDetails, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isExpanded) {
      onAppointmentClick(apt)
    }
  }

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        borderColor: COLORS.border,
        backgroundColor: COLORS.surfaceSubtle,
      }}
    >
      {/* Header Button - Responsive, no avatar */}
      <button
        onClick={handleToggle}
        className="w-full text-left p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 hover:brightness-95 relative group"
        style={{
          backgroundColor: COLORS.surfaceSubtle,
        }}
        aria-expanded={isExpanded}
        aria-label={`${cluster.totalCount} citas a las ${formatTime(primaryApt.start_time)}`}
      >
        {/* Gradient border left */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ background: borderGradient }}
        />

        <div className="flex items-center justify-between pl-2 sm:pl-3">
          {/* Left section - Client + Service */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <span
              className="text-xs sm:text-sm font-semibold truncate"
              style={{ color: COLORS.textPrimary }}
            >
              {primaryApt.client?.name || 'Cliente'}
            </span>
            <span
              className="text-[10px] sm:text-xs flex-shrink-0"
              style={{ color: COLORS.textMuted }}
            >
              ·
            </span>
            <span
              className="text-xs sm:text-sm truncate"
              style={{ color: COLORS.textSecondary }}
            >
              {primaryApt.service?.name || 'Servicio'}
            </span>
          </div>

          {/* Right section - Time + Count badge + Chevron */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <span
              className="text-[10px] sm:text-xs"
              style={{ color: COLORS.textSecondary }}
            >
              {formatTime(primaryApt.start_time)}
            </span>
            <span
              className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-0.5 sm:gap-1"
              style={{
                backgroundColor: COLORS.isDark ? '#38BDF820' : '#38BDF810',
                color: COLORS.isDark ? '#38BDF8' : '#0F4C5C',
              }}
            >
              +{otherCount}
            </span>
            <div
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-transform duration-200"
              style={{
                backgroundColor: COLORS.isDark ? COLORS.border : COLORS.borderLight,
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            >
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: COLORS.textSecondary }} />
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Content - Mini-cards con más info, responsive */}
      {isExpanded && (
        <div
          className="px-2 sm:px-4 pt-2 sm:pt-3 pb-3 sm:pb-4 space-y-1.5 sm:space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          {cluster.appointments.map((apt) => {
            const st = STATUS_CONFIG[apt.status] || {
              color: COLORS.textSecondary,
              bg: COLORS.borderLight,
              label: apt.status
            }
            const empColor = employeeColors[apt.employee_id] || COLORS.primary
            const employeeInitials = getEmployeeInitials(apt.employee?.name)

            return (
              <button
                key={apt.id}
                onClick={(e) => handleAppointmentClick(apt, e)}
                className="w-full text-left px-2 py-2 sm:px-3 sm:py-3 rounded-lg cursor-pointer transition-all duration-150 hover:brightness-95"
                style={{
                  backgroundColor: COLORS.surface,
                  borderLeft: `3px solid ${empColor}`,
                }}
              >
                {/* Línea 1: Nombre + Hora */}
                <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                  <p
                    className="text-xs sm:text-sm font-medium truncate"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {apt.client?.name || 'Cliente'}
                  </p>
                  <span
                    className="text-[10px] sm:text-xs ml-1.5 sm:ml-2 flex-shrink-0"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {formatTime(apt.start_time)}
                  </span>
                </div>

                {/* Línea 2: Servicio · Empleado + Estado */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                    <span
                      className="text-[10px] sm:text-xs truncate"
                      style={{ color: COLORS.textSecondary }}
                    >
                      {apt.service?.name || 'Servicio'}
                    </span>
                    <span style={{ color: COLORS.textMuted }}>·</span>
                    <span
                      className="text-[10px] sm:text-xs truncate"
                      style={{ color: empColor, fontWeight: 500 }}
                    >
                      {employeeInitials}
                    </span>
                  </div>
                  <span
                    className="text-[10px] sm:text-xs font-medium ml-1.5 sm:ml-2 flex-shrink-0"
                    style={{ color: st.color }}
                  >
                    {st.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}