'use client'

import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react'
import { EmployeeSelectorBar } from '@/components/calendar/EmployeeSelectorBar'
import { ScheduleWarningBanner } from '@/components/calendar/ScheduleWarningBanner'
import type { EmployeeWithWorkload, EmployeeFilter } from '@/types/calendar'
import type { ThemeColors } from '@/hooks/useThemeColors'

interface CalendarToolbarProps {
  COLORS: ThemeColors
  weekDates: Date[]
  employeesWithLoad: EmployeeWithWorkload[]
  selectedEmployeeId: EmployeeFilter
  userRole: string
  showScheduleWarning: boolean
  totalAppointments: number
  formatMonthYear: () => string
  getWeekRange: () => string
  isToday: (d: Date) => boolean
  goToPrevWeek: () => void
  goToNextWeek: () => void
  goToToday: () => void
  setSelectedEmployeeId: (id: EmployeeFilter) => void
  onNewAppointment: () => void
  onDismissWarning: () => void
  onConfigureSchedule: () => void
}

export function CalendarToolbar({
  COLORS,
  weekDates,
  employeesWithLoad,
  selectedEmployeeId,
  userRole,
  showScheduleWarning,
  totalAppointments,
  formatMonthYear,
  getWeekRange,
  isToday,
  goToPrevWeek,
  goToNextWeek,
  goToToday,
  setSelectedEmployeeId,
  onNewAppointment,
  onDismissWarning,
  onConfigureSchedule,
}: CalendarToolbarProps) {
  return (
    <>
      {/* Header */}
      <div className="px-6 md:px-8 py-5 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden" style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
      }}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="flex items-center gap-6 relative z-10">
          <div className="hidden md:block w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold capitalize text-white font-heading">{formatMonthYear()}</h2>
            <p className="text-sm mt-1 text-white/80">{getWeekRange()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 relative z-10">
          <button
            onClick={goToToday}
            className="px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-white/20"
            // eslint-disable-next-line no-restricted-syntax -- glass effect on gradient header
            style={{ color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            Hoy
          </button>
          <div className="flex rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
            <button
              onClick={goToPrevWeek}
              className="p-2.5 transition-colors duration-200 hover:bg-white/20 rounded-l-lg"
              style={{ backgroundColor: 'transparent' }}
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <button
              onClick={goToNextWeek}
              className="p-2.5 transition-colors duration-200 hover:bg-white/20 rounded-r-lg"
              style={{ backgroundColor: 'transparent' }}
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
          {(userRole === 'owner' || userRole === 'admin') && (
            <button
              onClick={onNewAppointment}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{ backgroundColor: COLORS.surface, color: COLORS.primary, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva cita</span>
            </button>
          )}
        </div>
      </div>

      {/* Employee Selector Bar */}
      {employeesWithLoad.length > 0 && (
        <EmployeeSelectorBar
          employees={employeesWithLoad}
          selectedEmployeeId={selectedEmployeeId}
          onSelect={setSelectedEmployeeId}
          totalAppointments={totalAppointments}
          COLORS={COLORS}
          visibleCount={5}
        />
      )}

      {/* Schedule Warning */}
      {selectedEmployeeId !== 'all' && showScheduleWarning && (() => {
        const selectedEmployee = employeesWithLoad.find(e => e.id === selectedEmployeeId)
        if (selectedEmployee && !selectedEmployee.hasConfiguredSchedule) {
          return (
            <div className="px-4 py-3">
              <ScheduleWarningBanner
                employeeName={selectedEmployee.name.split(' ')[0]}
                onConfigure={onConfigureSchedule}
                onDismiss={onDismissWarning}
                COLORS={COLORS}
              />
            </div>
          )
        }
        return null
      })()}

      {/* Week day headers */}
      <div className="grid grid-cols-1 sm:grid-cols-7" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        {weekDates.map((date, i) => (
          <div
            key={i}
            className={`py-3 md:py-4 text-center transition-colors duration-200 ${i !== 6 ? 'border-r' : ''}`}
            style={{
              borderColor: COLORS.border,
              backgroundColor: isToday(date) ? `${COLORS.primary}10` : COLORS.surfaceSubtle
            }}
          >
            <p className="text-xs font-medium uppercase" style={{ color: COLORS.textMuted }}>
              {date.toLocaleDateString('es-ES', { weekday: 'short' })}
            </p>
            <div
              className="inline-flex items-center justify-center mt-1 w-8 h-8 md:w-9 md:h-9 rounded-full transition-all duration-200 font-heading"
              style={{
                color: isToday(date) ? COLORS.primary : COLORS.textPrimary,
                backgroundColor: isToday(date) ? `${COLORS.primary}20` : 'transparent',
                boxShadow: isToday(date) ? `0 0 0 2px ${COLORS.surface}, 0 0 0 4px ${COLORS.primary}` : 'none'
              }}
            >
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
