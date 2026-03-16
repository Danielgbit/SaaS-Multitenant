'use client'

import { Scissors, TrendingUp } from 'lucide-react'

const COLORS = {
  primary: '#0F4C5C',
  success: '#16A34A',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
}

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
  if (loading) {
    return (
      <div 
        className="p-6 rounded-2xl border animate-pulse"
        style={{ 
          backgroundColor: COLORS.surface, 
          borderColor: COLORS.border 
        }}
      >
        <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-slate-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-slate-200 rounded mb-1" />
              <div className="h-3 w-16 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!services || services.length === 0) {
    return (
      <div 
        className="p-6 rounded-2xl border"
        style={{ 
          backgroundColor: COLORS.surface, 
          borderColor: COLORS.border 
        }}
      >
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
        >
          Servicios Populares
        </h3>
        <p 
          className="text-center py-8"
          style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          No hay datos disponibles
        </p>
      </div>
    )
  }

  const maxPercentage = Math.max(...services.map(s => s.percentage))

  return (
    <div 
      className="p-6 rounded-2xl border"
      style={{ 
        backgroundColor: COLORS.surface, 
        borderColor: COLORS.border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <h3 
        className="text-lg font-semibold mb-4 flex items-center gap-2"
        style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
      >
        <Scissors className="w-5 h-5" style={{ color: COLORS.primary }} />
        Servicios Populares
      </h3>

      <div className="space-y-3">
        {services.map((service, index) => (
          <div key={service.serviceId} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span 
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold"
                  style={{ 
                    backgroundColor: index === 0 ? '#FEF3C7' : COLORS.surfaceSubtle,
                    color: index === 0 ? '#D97706' : COLORS.textMuted
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
                className="text-sm font-semibold"
                style={{ color: COLORS.primary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {service.count}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div 
                className="h-2 rounded-full overflow-hidden flex-1"
                style={{ backgroundColor: COLORS.surfaceSubtle }}
              >
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(service.percentage / maxPercentage) * 100}%`,
                    backgroundColor: index === 0 ? '#D97706' : COLORS.primary
                  }}
                />
              </div>
              <span 
                className="text-xs w-10 text-right"
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
