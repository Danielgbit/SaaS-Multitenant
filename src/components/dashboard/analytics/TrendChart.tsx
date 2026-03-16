'use client'

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const COLORS = {
  primary: '#0F4C5C',
  primaryLight: '#E6F1F4',
  success: '#16A34A',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
}

interface TrendChartProps {
  data: Array<{
    date: string
    label: string
    appointments: number
    completed: number
    revenue: number
  }>
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div 
      className="p-3 rounded-lg border shadow-lg"
      style={{ 
        backgroundColor: COLORS.surface, 
        borderColor: COLORS.border 
      }}
    >
      <p 
        className="text-sm font-medium mb-2"
        style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <p 
          key={index}
          className="text-xs flex items-center gap-2"
          style={{ color: entry.color }}
        >
          <span 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name === 'appointments' ? 'Citas' : 'Completadas'}: 
          <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

export function TrendChart({ data, loading }: TrendChartProps) {
  if (loading) {
    return (
      <div 
        className="p-6 rounded-2xl border animate-pulse"
        style={{ 
          backgroundColor: COLORS.surface, 
          borderColor: COLORS.border,
          height: '320px'
        }}
      >
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="h-48 bg-slate-100 rounded" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div 
        className="p-6 rounded-2xl border"
        style={{ 
          backgroundColor: COLORS.surface, 
          borderColor: COLORS.border,
          height: '320px'
        }}
      >
        <p 
          className="text-center"
          style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          No hay datos disponibles
        </p>
      </div>
    )
  }

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
        className="text-lg font-semibold mb-4"
        style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
      >
        Evolución de Citas
      </h3>
      
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false}
            stroke={COLORS.border}
          />
          <XAxis 
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ 
              fill: COLORS.textMuted, 
              fontSize: 11,
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ 
              fill: COLORS.textMuted, 
              fontSize: 11,
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="appointments"
            name="appointments"
            stroke={COLORS.primary}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAppointments)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
