'use client'

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import { useThemeColors } from '@/hooks/useThemeColors'

interface QueueChartProps {
  hourlyStats: { hour: string; count: number }[]
}

function CustomTooltip({ active, payload, label, COLORS }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl border p-3 shadow-lg"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          backdropFilter: 'blur(6px)',
          borderColor: COLORS.border,
        }}
      >
        <p className="text-xs font-medium mb-0.5" style={{ color: COLORS.textSecondary }}>
          {label}
        </p>
        <p className="font-mono text-lg font-bold tracking-tight" style={{ color: COLORS.primary }}>
          {payload[0].value}
        </p>
        <p className="text-[11px] font-mono mt-0.5" style={{ color: COLORS.textMuted }}>
          eventos en esta hora
        </p>
      </div>
    )
  }
  return null
}

export function QueueChart({ hourlyStats }: QueueChartProps) {
  const COLORS = useThemeColors()
  const data = hourlyStats.map((item) => ({
    hour: new Date(item.hour).toLocaleString('es-CO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    }),
    count: item.count,
  }))

  const hasData = data.length > 0 && data.some((d) => d.count > 0)

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-xl border bg-background/70 backdrop-blur-[6px] p-4"
        style={{
          borderColor: COLORS.border,
        }}
      >
        <h3 className="mb-4 font-semibold text-sm" style={{ color: COLORS.textPrimary }}>
          Eventos por Hora (últimas 24h)
        </h3>
        <div className="h-[200px] flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
              Sin datos
            </p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              No hay eventos en las últimas 24 horas
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border bg-background/70 backdrop-blur-[6px] p-4"
      style={{
        borderColor: COLORS.border,
      }}
    >
      <h3 className="mb-4 font-semibold text-sm" style={{ color: COLORS.textPrimary }}>
        Eventos por Hora (últimas 24h)
      </h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.primary} stopOpacity={1} />
                <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={COLORS.border}
              strokeOpacity={0.3}
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10, fill: COLORS.textMuted }}
              angle={-45}
              textAnchor="end"
              height={60}
              tickLine={false}
              axisLine={{ stroke: COLORS.border, strokeWidth: 1, strokeOpacity: 0.5 }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: COLORS.textMuted }}
              tickLine={false}
              axisLine={{ stroke: COLORS.border, strokeWidth: 1, strokeOpacity: 0.5 }}
            />
            <Tooltip
              content={<CustomTooltip COLORS={COLORS} />}
              cursor={{ fill: COLORS.surfaceSubtle }}
            />
            <Bar
              dataKey="count"
              fill="url(#barGradient)"
              radius={[6, 6, 0, 0]}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
