'use client'

import { useTheme } from 'next-themes'
import { Scissors, Sparkles } from 'lucide-react'

interface TopServicesListProps {
  services: Array<{
    serviceId: string
    serviceName: string
    count: number
    percentage: number
    revenue: number
  }>
  loading?: boolean
}

export function TopServicesList({ services, loading }: TopServicesListProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const COLORS = {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    success: '#16A34A',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceGlass: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    gold: '#D97706',
    goldLight: '#FEF3C7',
  }

  if (loading) {
    return (
      <div 
        className="p-6 rounded-2xl border animate-pulse"
        style={{ 
          backgroundColor: COLORS.surface, 
          borderColor: COLORS.border 
        }}
      >
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!services || services.length === 0) {
    return (
      <div 
        className="p-6 rounded-2xl border flex flex-col items-center justify-center"
        style={{ 
          backgroundColor: COLORS.surfaceGlass, 
          borderColor: COLORS.border,
          backdropFilter: 'blur(12px)'
        }}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.primary + '15' }}>
          <Scissors className="w-8 h-8" style={{ color: COLORS.primary }} />
        </div>
        <p 
          className="text-center font-medium"
          style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          No hay datos disponibles
        </p>
        <p 
          className="text-sm mt-1 text-center"
          style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Los servicios populares aparecerán aquí
        </p>
      </div>
    )
  }

  const maxPercentage = Math.max(...services.map(s => s.percentage))

  return (
    <div 
      className="p-6 rounded-2xl border"
      style={{ 
        backgroundColor: COLORS.surfaceGlass, 
        borderColor: COLORS.border,
        boxShadow: '0 4px 24px rgba(15, 76, 92, 0.08)',
        backdropFilter: 'blur(12px)'
      }}
    >
      <h3 
        className="text-lg font-semibold mb-6 flex items-center gap-2"
        style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
      >
        <Sparkles className="w-5 h-5" style={{ color: COLORS.primary }} />
        Servicios Populares
      </h3>

      <div className="space-y-4">
        {services.map((service, index) => (
          <div 
            key={service.serviceId} 
            className="group p-3 rounded-xl transition-all duration-200 hover:bg-white/50 dark:hover:bg-white/5"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span 
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-transform duration-200 group-hover:scale-110"
                  style={{ 
                    backgroundColor: index === 0 ? (isDark ? '#FEF3C7' : COLORS.goldLight) : COLORS.surfaceSubtle,
                    color: index === 0 ? COLORS.gold : COLORS.textMuted
                  }}
                >
                  {index + 1}
                </span>
                <span 
                  className="text-sm font-medium"
                  style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {service.serviceName}
                </span>
              </div>
              <span 
                className="text-sm font-bold px-2 py-1 rounded-lg"
                style={{ 
                  color: COLORS.primary,
                  backgroundColor: isDark ? `${COLORS.primary}20` : `${COLORS.primary}15`,
                  fontFamily: 'Plus Jakarta Sans, sans-serif'
                }}
              >
                {service.count}
              </span>
            </div>
            
            <div className="flex items-center gap-3 ml-10">
              <div 
                className="h-2 rounded-full overflow-hidden flex-1"
                style={{ backgroundColor: COLORS.surfaceSubtle }}
              >
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${(service.percentage / maxPercentage) * 100}%`,
                    background: index === 0 
                      ? `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.gold}80 100%)`
                      : `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.primary}80 100%)`
                  }}
                />
              </div>
              <span 
                className="text-xs w-10 text-right font-medium"
                style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {service.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
