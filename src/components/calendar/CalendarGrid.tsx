'use client'

import { CalendarColors, AppointmentWithDetails } from '@/types/calendar'
import { AppointmentCard, EmptyDay } from './AppointmentCard'
import React from 'react'

interface CalendarGridProps {
  weekDates: Date[]
  appointmentsByDay: Record<string, AppointmentWithDetails[]>
  COLORS: CalendarColors
  STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }>
  formatTime: (dateString: string) => string
  formatDateKey: (d: Date) => string
  isToday: (d: Date) => boolean
  onSelectAppointment: (apt: AppointmentWithDetails) => void
}

export function CalendarGrid({ 
  weekDates, 
  appointmentsByDay, 
  COLORS, 
  STATUS_CONFIG, 
  formatTime, 
  formatDateKey, 
  isToday,
  onSelectAppointment 
}: CalendarGridProps) {
  return (
    <>
      {/* Week days header */}
      <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        {weekDates.map((date, i) => (
          <div 
            key={i} 
            className={`py-4 text-center ${i !== 6 ? 'border-r' : ''}`}
            style={{ 
              borderColor: COLORS.border, 
              backgroundColor: isToday(date) ? COLORS.primary + '08' : COLORS.surfaceSubtle 
            }}
          >
            <p className="text-xs font-medium uppercase" style={{ color: COLORS.textMuted }}>
              {date.toLocaleDateString('es-ES', { weekday: 'short' })}
            </p>
            <p 
              className="text-lg font-semibold mt-1"
              style={{ 
                color: isToday(date) ? COLORS.primary : COLORS.textPrimary, 
                fontFamily: 'Cormorant Garamond, serif' 
              }}
            >
              {date.getDate()}
            </p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 min-h-[500px]">
        {weekDates.map((date, i) => {
          const dayKey = formatDateKey(date)
          const dayAppts = appointmentsByDay[dayKey] || []
          return (
            <div 
              key={i} 
              className={`${i !== 6 ? 'border-r' : ''} p-3`}
              style={{ 
                borderColor: COLORS.border, 
                backgroundColor: isToday(date) ? COLORS.primary + '05' : COLORS.surface 
              }}
            >
              {dayAppts.length === 0 ? (
                <EmptyDay COLORS={COLORS} />
              ) : (
                <div className="space-y-2">
                  {dayAppts.map(apt => (
                    <AppointmentCard
                      key={apt.id}
                      apt={apt}
                      COLORS={COLORS}
                      STATUS_CONFIG={STATUS_CONFIG}
                      formatTime={formatTime}
                      onClick={() => onSelectAppointment(apt)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
