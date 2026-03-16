'use client'

import { useTheme } from 'next-themes'
import { CalendarColors } from '@/types/calendar'

export function useCalendarColors(): CalendarColors {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFB',
    surfaceHover: isDark ? '#334155' : '#F1F5F9',
    border: isDark ? '#334155' : '#E8ECEE',
    borderLight: isDark ? '#1E293B' : '#F0F3F4',
    textPrimary: isDark ? '#F1F5F9' : '#1A2B32',
    textSecondary: isDark ? '#94A3B8' : '#5A6B70',
    textMuted: isDark ? '#64748B' : '#8A9A9E',
    success: '#059669',
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    warning: '#D97706',
    warningLight: isDark ? '#451A03' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(15,23,42,0.5)',
    glass: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.9)',
  }
}
