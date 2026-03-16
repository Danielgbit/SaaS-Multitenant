'use client'

import { Clock, Building2, Calendar } from 'lucide-react'
import { AppointmentWithDetails, CalendarColors, StatusConfig } from '@/types/calendar'
import React from 'react'

interface AppointmentCardProps {
  apt: AppointmentWithDetails
  COLORS: CalendarColors
  STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }>
  formatTime: (dateString: string) => string
  onClick: () => void
}

export function AppointmentCard({ 
  apt, 
  COLORS, 
  STATUS_CONFIG, 
  formatTime,
  onClick 
}: AppointmentCardProps) {
  const st = STATUS_CONFIG[apt.status] || { 
    color: COLORS.textSecondary, 
    bg: COLORS.borderLight, 
    label: apt.status, 
    icon: null 
  }

  return (
    <button 
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl transition-all hover:scale-[1.02]"
      style={{ 
        backgroundColor: st.bg, 
        border: `1px solid ${st.color}30`, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)' 
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-3.5 h-3.5" style={{ color: st.color }} />
        <span className="text-xs font-semibold" style={{ color: st.color }}>
          {formatTime(apt.start_time)}
        </span>
      </div>
      <p className="text-sm font-semibold truncate" style={{ color: COLORS.textPrimary }}>
        {apt.client?.name || 'Cliente'}
      </p>
      <div className="flex items-center gap-1.5">
        <Building2 className="w-3 h-3" style={{ color: COLORS.textMuted }} />
        <span className="text-xs truncate" style={{ color: COLORS.textSecondary }}>
          {apt.employee?.name || 'Empleado'}
        </span>
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

interface EmptyDayProps {
  COLORS: CalendarColors
}

export function EmptyDay({ COLORS }: EmptyDayProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8">
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
        style={{ backgroundColor: COLORS.borderLight }}
      >
        <Calendar className="w-5 h-5" style={{ color: COLORS.textMuted }} />
      </div>
      <p className="text-xs" style={{ color: COLORS.textMuted }}>Sin citas</p>
    </div>
  )
}
