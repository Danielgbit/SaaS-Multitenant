'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { differenceInSeconds } from 'date-fns'
import { BarChart3, TrendingUp, TrendingDown, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Card } from '@/components/ui/Card'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import type { TodayPulse as TodayPulseType } from '@/types/analytics'

interface TodayPulseProps {
  data: TodayPulseType
  dataUpdatedAt: number
}

export function TodayPulse({ data, dataUpdatedAt }: TodayPulseProps) {
  const COLORS = useThemeColors()
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    const update = () => {
      setSecondsAgo(differenceInSeconds(new Date(), new Date(dataUpdatedAt)))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [dataUpdatedAt])

  const formatSeconds = (secs: number) => {
    if (secs < 60) return `${secs}s`
    if (secs < 3600) return `${Math.floor(secs / 60)}m`
    return `${Math.floor(secs / 3600)}h`
  }

  const revenueIsPositive = data.revenueChange >= 0
  const revenueChangeColor = revenueIsPositive ? COLORS.success : COLORS.error
  const RevenueChangeIcon = revenueIsPositive ? TrendingUp : TrendingDown

  const capacityColor = data.capacityPercentToday >= 70
    ? COLORS.success
    : data.capacityPercentToday >= 40
      ? COLORS.warning
      : COLORS.error

  return (
    <Card variant="surface" className="p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: COLORS.primarySubtle }}
          >
            <BarChart3 className="w-5 h-5" style={{ color: COLORS.primary }} />
          </div>
          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>
            Hoy en tu negocio
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: COLORS.textMuted }}>
            Actualizado hace {formatSeconds(secondsAgo)}
          </span>
          <RefreshCw className="w-3 h-3 animate-spin opacity-0" style={{ color: COLORS.textMuted }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>Ingresos</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
            {formatCurrencyCOP(data.revenue)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <RevenueChangeIcon className="w-3 h-3" style={{ color: revenueChangeColor }} />
            <span className="text-xs font-medium" style={{ color: revenueChangeColor }}>
              {revenueIsPositive ? '+' : ''}{data.revenueChange}%
            </span>
            <span className="text-xs" style={{ color: COLORS.textMuted }}>vs ayer</span>
          </div>
        </div>

        <div>
          <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>Citas</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
            {data.completedToday}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: capacityColor }}
            />
            <span className="text-xs" style={{ color: capacityColor }}>
              Capacidad: {data.capacityPercentToday}%
            </span>
          </div>
        </div>
      </div>

      <div
        className="w-full h-px mb-4"
        style={{ backgroundColor: COLORS.border }}
      />

      <div className="space-y-3">
        {data.pendingConfirmations > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" style={{ color: COLORS.warning }} />
              <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                {data.pendingConfirmations} por confirmar
              </span>
            </div>
            <Link
              href="/confirmations"
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: COLORS.primary }}
            >
              Ver
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {data.noShowsToday > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" style={{ color: COLORS.error }} />
              <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                {data.noShowsToday} no-show{data.noShowsToday > 1 ? 's' : ''} ({formatCurrencyCOP(data.noShowImpact)})
              </span>
            </div>
            <Link
              href="/clients"
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: COLORS.error }}
            >
              Contactar
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {data.pendingConfirmations === 0 && data.noShowsToday === 0 && (
          <p className="text-sm text-center py-2" style={{ color: COLORS.success }}>
            Todo en orden hoy
          </p>
        )}
      </div>
    </Card>
  )
}
