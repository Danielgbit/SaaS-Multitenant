'use client'

import { useId } from 'react'
import { Calendar, TrendingUp } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts'
import type { TrendChartProps } from './types'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  const COLORS = useThemeColors()

  if (!active || !payload?.length) return null

  return (
    <Card variant="glass" className="p-4">
      <p className="text-sm font-semibold mb-2" style={{ color: COLORS.textPrimary }}>
        {label}
      </p>
      {payload.map((entry, index) => (
        <p
          key={index}
          className="text-xs flex items-center gap-2 mb-1"
          style={{ color: entry.color }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name === 'appointments' ? 'Citas' : 'Completadas'}:{' '}
          <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </Card>
  )
}

export function TrendChart({ data, loading }: TrendChartProps) {
  const COLORS = useThemeColors()
  const gradientId = useId()

  if (loading) {
    return (
      <Card variant="glass" className="p-6">
        <Skeleton variant="text" width="w-48" height="h-6" className="mb-4" />
        <Skeleton variant="rectangular" height="h-48" />
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card variant="glass" className="p-6" style={{ height: '340px' }}>
        <EmptyState
          icon={<Calendar className="w-8 h-8" style={{ color: COLORS.primary }} />}
          title="No hay datos disponibles"
          description="Las citas que crees aparecerán aquí"
        />
      </Card>
    )
  }

  return (
    <Card variant="glass" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 font-serif" style={{ color: COLORS.textPrimary }}>
          <TrendingUp className="w-5 h-5" style={{ color: COLORS.primary }} />
          Evolución de Citas
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={COLORS.isDark ? 0.3 : 0.2} />
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: COLORS.textMuted, fontSize: 11 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: COLORS.textMuted, fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="appointments"
            name="appointments"
            stroke={COLORS.primary}
            strokeWidth={2.5}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
