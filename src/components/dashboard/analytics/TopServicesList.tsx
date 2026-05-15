'use client'

import { Scissors, Sparkles } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import type { TopServicesListProps } from './types'

export function TopServicesList({ services, loading }: TopServicesListProps) {
  const COLORS = useThemeColors()
  const maxPercentage = services && services.length > 0
    ? Math.max(...services.map(s => s.percentage))
    : 1

  if (loading) {
    return (
      <Card variant="glass" className="p-6">
        <Skeleton variant="text" width="w-32" height="h-6" className="mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="rectangular" width="w-8" height="h-8" />
              <div className="flex-1">
                <Skeleton variant="text" width="w-24" className="mb-1" />
                <Skeleton variant="text" width="w-16" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (!services || services.length === 0) {
    return (
      <Card variant="glass" className="p-6">
        <EmptyState
          icon={<Scissors className="w-8 h-8" style={{ color: COLORS.primary }} />}
          title="No hay datos disponibles"
          description="Los servicios populares aparecerán aquí"
        />
      </Card>
    )
  }

  return (
    <Card variant="glass" className="p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 font-serif" style={{ color: COLORS.textPrimary }}>
        <Sparkles className="w-5 h-5" style={{ color: COLORS.primary }} />
        Servicios Populares
      </h3>

      <div className="space-y-4">
        {services.map((service, index) => {
          const isTop = index === 0

          return (
            <div
              key={service.serviceId}
              className="group p-3 rounded-xl transition-colors hover:bg-white/50 dark:hover:bg-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-transform duration-200 group-hover:scale-110"
                    style={{
                      backgroundColor: isTop ? COLORS.goldLight : COLORS.surfaceSubtle,
                      color: isTop ? COLORS.gold : COLORS.textMuted,
                    }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                    {service.serviceName}
                  </span>
                </div>
                <Badge variant="primary" size="sm">
                  {service.count}
                </Badge>
              </div>

              <div className="flex items-center gap-3 ml-10">
                <div className="h-2 rounded-full overflow-hidden flex-1" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${(service.percentage / maxPercentage) * 100}%`,
                      background: isTop
                        ? `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.gold}80 100%)`
                        : `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.primary}80 100%)`,
                    }}
                  />
                </div>
                <span className="text-xs w-10 text-right font-medium" style={{ color: COLORS.textMuted }}>
                  {service.percentage}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
