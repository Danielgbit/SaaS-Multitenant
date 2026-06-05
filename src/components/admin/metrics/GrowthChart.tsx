'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Card } from '@/components/ui/Card'
import type { MonthlyPoint } from '@/lib/admin/types'

interface GrowthChartProps {
  title: string
  data: MonthlyPoint[]
  color?: string
  formatValue?: (value: number) => string
}

export function GrowthChart({ title, data, color: barColor, formatValue }: GrowthChartProps) {
  const COLORS = useThemeColors()
  const color = barColor || COLORS.primary

  if (!data || data.length === 0) {
    return (
      <Card variant="surface" className="p-6">
        <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white font-heading mb-4">{title}</h3>
        <p className="text-sm text-[#94A3B8] dark:text-slate-500 text-center py-8">Sin datos de crecimiento aún</p>
      </Card>
    )
  }

  return (
    <Card variant="surface" className="p-6">
      <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white font-heading mb-4">{title}</h3>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: COLORS.textMuted, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: COLORS.border }}
            />
            <YAxis
              tick={{ fill: COLORS.textMuted, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: COLORS.surfaceGlass,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
              }}
              formatter={(value) => [formatValue ? formatValue(value as number) : value, title]}
              labelFormatter={(label) => label}
            />
            <Bar
              dataKey="count"
              fill={color}
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
