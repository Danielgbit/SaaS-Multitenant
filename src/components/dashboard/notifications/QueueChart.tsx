'use client'

import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface QueueChartProps {
  hourlyStats: { hour: string; count: number }[]
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
    <div className="rounded-lg border p-4">
      <h3 className="mb-4 font-semibold">Eventos por Hora (últimas 24h)</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              labelStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
