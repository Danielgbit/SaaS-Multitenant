'use client'

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { CalendarColors } from '@/types/calendar'

interface CalendarHeaderProps {
  COLORS: CalendarColors
  formatMonthYear: () => string
  getWeekRange: () => string
  goToToday: () => void
  goToPrevWeek: () => void
  goToNextWeek: () => void
  openNewModal: () => void
}

export function CalendarHeader({ 
  COLORS, 
  formatMonthYear, 
  getWeekRange, 
  goToToday, 
  goToPrevWeek, 
  goToNextWeek, 
  openNewModal 
}: CalendarHeaderProps) {
  return (
    <div 
      className="px-8 py-6 flex items-center justify-between"
      style={{ 
        borderBottom: `1px solid ${COLORS.border}`, 
        background: `linear-gradient(135deg, ${COLORS.surface} 0%, ${COLORS.surfaceSubtle} 100%)` 
      }}
    >
      <div className="flex items-center gap-6">
        <div>
          <h2 
            className="text-2xl font-semibold capitalize" 
            style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
          >
            {formatMonthYear()}
          </h2>
          <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>
            {getWeekRange()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={goToToday} 
          className="px-4 py-2.5 text-sm font-medium rounded-lg"
          style={{ 
            color: COLORS.primary, 
            backgroundColor: COLORS.surface, 
            border: `1px solid ${COLORS.border}` 
          }}
        >
          Hoy
        </button>
        <div className="flex rounded-lg" style={{ border: `1px solid ${COLORS.border}` }}>
          <button 
            onClick={goToPrevWeek} 
            className="p-2.5" 
            style={{ backgroundColor: COLORS.surface }} 
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: COLORS.primary }} />
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: COLORS.border }} />
          <button 
            onClick={goToNextWeek} 
            className="p-2.5" 
            style={{ backgroundColor: COLORS.surface }} 
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" style={{ color: COLORS.primary }} />
          </button>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm"
          style={{ 
            backgroundColor: COLORS.primary, 
            color: '#FFF', 
            boxShadow: '0 4px 12px rgba(15,76,92,0.25)' 
          }}
        >
          <Plus className="w-4 h-4" />
          Nueva cita
        </button>
      </div>
    </div>
  )
}
