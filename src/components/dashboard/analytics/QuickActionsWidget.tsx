'use client'

import { useTheme } from 'next-themes'
import Link from 'next/link'
import { 
  Plus, 
  Calendar, 
  DollarSign, 
  UserPlus,
  Receipt,
  Wallet,
  Settings
} from 'lucide-react'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    warning: '#F59E0B',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    isDark,
  }
}

const quickActions = [
  {
    label: 'Nueva Cita',
    href: '/calendar',
    icon: Plus,
    color: '#0F4C5C',
    bgColor: 'rgba(15, 76, 92, 0.1)',
  },
  {
    label: 'Confirmaciones',
    href: '/confirmations',
    icon: Calendar,
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
  {
    label: 'Cobrar',
    href: '/clients/accounts',
    icon: Wallet,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  {
    label: 'Nómina',
    href: '/payroll',
    icon: Receipt,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
]

export function QuickActionsWidget() {
  const COLORS = useColors()

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      <div 
        className="p-4 border-b"
        style={{ borderColor: COLORS.border }}
      >
        <h3 
          className="font-semibold text-sm"
          style={{ 
            fontFamily: "'Cormorant Garamond', serif",
            color: COLORS.textPrimary 
          }}
        >
          Acciones Rápidas
        </h3>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                style={{
                  backgroundColor: action.bgColor,
                  borderColor: COLORS.border,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color + '50'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: action.color + '20',
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <span 
                  className="text-xs font-medium text-center"
                  style={{ color: COLORS.textPrimary }}
                >
                  {action.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}