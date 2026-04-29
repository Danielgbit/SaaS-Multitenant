'use client'

import React from 'react'
import { AlertTriangle, Calendar, ChevronRight, X } from 'lucide-react'
import type { CalendarColors } from '@/types/calendar'

interface ScheduleWarningBannerProps {
  employeeName: string
  onConfigure: () => void
  onDismiss?: () => void
  COLORS: CalendarColors
}

export function ScheduleWarningBanner({
  employeeName,
  onConfigure,
  onDismiss,
  COLORS
}: ScheduleWarningBannerProps) {
  return (
    <div
      className="relative rounded-xl overflow-hidden animate-in fade-in duration-200"
      style={{
        backgroundColor: COLORS.isDark ? '#451A0320' : '#FEF3C7',
        border: `1px solid ${COLORS.isDark ? '#F59E0B40' : '#FDE68A'}`,
        borderLeft: `4px solid #F59E0B`,
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#F59E0B20' }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: '#F59E0B' }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4
                className="font-semibold text-sm"
                style={{ color: COLORS.isDark ? '#FBBF24' : '#92400E', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Sin horarios configurados
              </h4>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 hover:opacity-70"
                  style={{ backgroundColor: 'transparent' }}
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" style={{ color: COLORS.textSecondary }} />
                </button>
              )}
            </div>

            <p
              className="text-sm mt-1"
              style={{ color: COLORS.isDark ? '#FCD34D' : '#B45309', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              <span className="font-medium">{employeeName}</span> no tiene horarios configurados. Necesita configurar su disponibilidad para poder recibir citas.
            </p>

            <button
              onClick={onConfigure}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:brightness-110 cursor-pointer"
              style={{
                backgroundColor: '#F59E0B',
                color: '#FFFFFF',
                fontFamily: 'Plus Jakarta Sans, sans-serif'
              }}
              aria-label="Configurar horarios del empleado"
            >
              <Calendar className="w-4 h-4" />
              <span>Configurar horarios</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}