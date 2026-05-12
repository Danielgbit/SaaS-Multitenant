'use client'

import { useThemeColors } from '@/hooks/useThemeColors'

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
    color: COLORS.warning,
    bgColor: COLORS.warningLight || 'rgba(245, 158, 11, 0.1)',
  },
]

export function QuickActionsWidget() {
  const COLORS = useThemeColors()

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