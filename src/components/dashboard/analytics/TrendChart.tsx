'use client'

import { useTheme } from 'next-themes'
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
import { Calendar, TrendingUp } from 'lucide-react'

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

export function TrendChart({ data, loading }: TrendChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const COLORS = {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#E6F1F4',
    success: '#16A34A',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceGlass: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
  }

  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null

    return (
      <div 
        className="p-4 rounded-xl border shadow-xl backdrop-blur-xl"
        style={{ 
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : COLORS.surface, 
          borderColor: COLORS.border 
        }}
      >
        <p 
          className="text-sm font-semibold mb-2"
          style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p 
            key={index}
            className="text-xs flex items-center gap-2 mb-1"
            style={{ color: entry.color }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name === 'appointments' ? 'Citas' : 'Completadas'}: 
            <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div 
        className="p-6 rounded-2xl border animate-pulse"
        style={{ 
          backgroundColor: COLORS.surface, 
          borderColor: COLORS.border,
          height: '340px'
        }}
      >
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div 
        className="p-6 rounded-2xl border flex flex-col items-center justify-center"
        style={{ 
          backgroundColor: COLORS.surfaceGlass, 
          borderColor: COLORS.border,
          height: '340px',
          backdropFilter: 'blur(12px)'
        }}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.primary + '15' }}>
          <Calendar className="w-8 h-8" style={{ color: COLORS.primary }} />
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
          Las citas que crees aparecerán aquí
        </p>
      </div>
    )
  }

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
      <div className="flex items-center justify-between mb-6">
        <h3 
          className="text-lg font-semibold flex items-center gap-2"
          style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
        >
          <TrendingUp className="w-5 h-5" style={{ color: COLORS.primary }} />
          Evolución de Citas
        </h3>
      </div>
      
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={isDark ? 0.3 : 0.2}/>
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
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorAppointments)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
