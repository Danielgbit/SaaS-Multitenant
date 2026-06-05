'use client'

/**
 * 🔒 DESIGN SYSTEM LOCK v1
 *
 * Este archivo es la fuente única de verdad del sistema de colores.
 *
 * ❗ PROHIBIDO:
 * - Agregar nuevos tokens sin migración formal
 * - Reintroducir hex hardcoded en UI
 *
 * 🟡 Tokens deprecated (no usar en nuevos componentes):
 * - danger, dangerLight
 * - amber, amberLight
 * - gold, goldLight
 * - glass
 *
 * 🟢 Fuente oficial: useThemeColors()
 */

import { useMemo, useSyncExternalStore } from 'react'

export interface ThemeColors {
  primary: string
  primaryLight: string
  primaryGradient: string
  gradientFrom: string
  gradientTo: string
  gradientRefined: string
  primarySubtle: string
  accentTeal: string
  accentTealLight: string
  accentTealSubtle: string
  surface: string
  surfaceSubtle: string
  surfaceGlass: string
  surfaceGlassStrong?: string
  surfaceHover: string
  border: string
  borderLight?: string
  borderFocus: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  success: string
  successLight?: string
  warning: string
  warningLight?: string
  error: string
  errorLight?: string
  danger: string
  dangerLight: string
  amber: string
  amberLight: string
  gold: string
  goldLight: string
  info: string
  infoLight?: string
  orange: string
  orangeLight: string
  overlay?: string
  glass: string
  radius: { sm: string; md: string; lg: string; xl: string; button: string; card: string; modal: string }
  shadow: { sm: string; md: string; lg: string; xl: string; tealSm: string; tealMd: string; tealLg: string; tealXl: string }
  shadowInput: string
  transition: string
  headerBg: string
  headerText: string
  headerTextMuted: string
  whatsapp: string
  whatsappLight: string
  textOnPrimary: string
  textOnSuccess: string
  textOnWarning: string
  textOnError: string
  isDark: boolean
}

const RADIUS = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
  button: '12px',
  card: '20px',
  modal: '28px',
} as const

const TRANSITION = 'all 200ms ease' as const

const DARK_SHADOWS = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.1)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  xl: '0 20px 25px rgba(0,0,0,0.15)',
  tealSm: '0 2px 8px rgba(0,0,0,0.2)',
  tealMd: '0 4px 24px rgba(0,0,0,0.3)',
  tealLg: '0 8px 40px rgba(0,0,0,0.4)',
  tealXl: '0 16px 64px rgba(0,0,0,0.5)',
} as const

const LIGHT_SHADOWS = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.1)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  xl: '0 20px 25px rgba(0,0,0,0.15)',
  tealSm: '0 2px 8px rgba(15,76,92,0.04)',
  tealMd: '0 4px 24px rgba(15,76,92,0.06)',
  tealLg: '0 8px 40px rgba(15,76,92,0.10)',
  tealXl: '0 16px 64px rgba(15,76,92,0.14)',
} as const

function getDarkSnapshot() {
  return document.documentElement.classList.contains('dark')
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

export function useThemeColors(): ThemeColors {
  const isDark = useSyncExternalStore(
    subscribe,
    getDarkSnapshot,
    () => false,
  )

  return useMemo(() => ({
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#2DD4BF' : '#14B8A6',
    primaryGradient: isDark
      ? 'linear-gradient(135deg, #38BDF8 0%, #2DD4BF 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #115E59 100%)',
    gradientFrom: isDark ? '#38BDF8' : '#0F4C5C',
    gradientTo: isDark ? '#2DD4BF' : '#115E59',
    gradientRefined: isDark
      ? 'linear-gradient(135deg, #38BDF8 0%, #2DD4BF 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #134E4A 100%)',
    primarySubtle: isDark ? '#38BDF815' : '#0F4C5C10',
    accentTeal: isDark ? '#2DD4BF' : '#14B8A6',
    accentTealLight: isDark ? '#14B8A615' : '#14B8A610',
    accentTealSubtle: isDark ? '#2DD4BF20' : '#2DD4BF15',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    surfaceGlassStrong: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.95)',
    surfaceHover: isDark ? '#334155' : '#F1F5F9',
    border: isDark ? '#334155' : '#E2E8F0',
    borderLight: isDark ? '#1E293B' : '#F0F3F4',
    borderFocus: isDark ? '#38BDF8' : '#0F4C5C',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    warning: '#D97706',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    danger: '#DC2626',
    dangerLight: isDark ? '#450A0A' : '#FEE2E2',
    amber: '#F59E0B',
    amberLight: isDark ? '#78350F' : '#FEF3C7',
    gold: '#F59E0B',
    goldLight: isDark ? '#78350F' : '#FEF3C7',
    info: '#0EA5E9',
    infoLight: isDark ? '#0C4A6E' : '#E0F2FE',
    orange: '#F97316',
    orangeLight: isDark ? '#7C2D12' : '#FFF7ED',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)',
    glass: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    radius: RADIUS,
    shadow: isDark ? DARK_SHADOWS : LIGHT_SHADOWS,
    shadowInput: isDark
      ? '0 1px 2px rgba(0,0,0,0.3)'
      : '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
    transition: TRANSITION,
    headerBg: isDark ? '#1E293B' : '#FAFAF9',
    headerText: isDark ? '#F1F5F9' : '#0F172A',
    headerTextMuted: isDark ? '#94A3B8' : '#475569',
    whatsapp: isDark ? '#25D366' : '#0F4C5C',
    whatsappLight: isDark ? '#25D36615' : '#0F4C5C10',
    textOnPrimary: isDark ? '#0F172A' : '#FFFFFF',
    textOnSuccess: '#FFFFFF',
    textOnWarning: '#FFFFFF',
    textOnError: '#FFFFFF',
    isDark,
  }), [isDark])
}
