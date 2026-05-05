import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

export interface ThemeColors {
  primary: string
  primaryLight: string
  primaryGradient: string
  surface: string
  surfaceSubtle: string
  surfaceGlass: string
  surfaceGlassStrong?: string
  border: string
  borderLight?: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  success: string
  successLight?: string
  warning: string
  warningLight?: string
  error: string
  errorLight?: string
  amber?: string
  amberLight?: string
  overlay?: string
  gradientFrom?: string
  gradientTo?: string
  isDark: boolean
}

export function useThemeColors(): ThemeColors {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === 'dark' : false

  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    primaryGradient: isDark
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    surfaceGlassStrong: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.95)',
    border: isDark ? '#334155' : '#E2E8F0',
    borderLight: isDark ? '#1E293B' : '#F0F3F4',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    warning: '#D97706',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    amber: '#F59E0B',
    amberLight: isDark ? '#78350F' : '#FEF3C7',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)',
    isDark,
  }
}