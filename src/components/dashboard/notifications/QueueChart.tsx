'use client'

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'

interface QueueChartProps {
  hourlyStats: { hour: string; count: number }[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl border p-3 shadow-lg"
        style={{
          backgroundColor: 'hsl(var(--background) / 0.8)',
          backdropFilter: 'blur(6px)',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <p className="text-xs font-medium mb-1" style={{ color: 'hsl(var(--text-secondary))' }}>
          {label}
        </p>
        <p className="font-mono text-lg font-bold" style={{ color: 'hsl(var(--primary))' }}>
          {payload[0].value} eventos
        </p>
      </div>
    )
  }
  return null
}

export function QueueChart({ hourlyStats }: QueueChartProps) {
  const data = hourlyStats.map((item) => ({
    hour: new Date(item.hour).toLocaleString('es-CO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    }),
    count: item.count,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border bg-background/70 backdrop-blur-[6px] p-4"
      style={{
        borderColor: 'hsl(var(--border))',
      }}
    >
      <h3 className="mb-4 font-semibold text-sm" style={{ color: 'hsl(var(--text-primary))' }}>
        Eventos por Hora (últimas 24h)
      </h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }}
              angle={-45}
              textAnchor="end"
              height={60}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--text-muted))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              animationBegin={0}
              animationDuration={600}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
