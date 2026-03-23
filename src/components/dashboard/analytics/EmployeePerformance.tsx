'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Trophy, TrendingUp, Loader2, User } from 'lucide-react'
import { getEmployeePerformance } from '@/actions/analytics/getEmployeePerformance'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)' 
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    primarySubtle: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 76, 92, 0.08)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#DCFCE7',
    warning: '#F59E0B',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    isDark,
  }
}

interface EmployeeData {
  employee_id: string
  employee_name: string
  appointments: number
  revenue: number
  completed: number
}

type Period = 'today' | 'week' | 'month' | 'year' | 'last7days' | 'last30days'

interface EmployeePerformanceProps {
  organizationId: string
  period?: Period
}

export function EmployeePerformance({ organizationId, period = 'month' }: EmployeePerformanceProps) {
  const COLORS = useColors()
  const [employees, setEmployees] = useState<EmployeeData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [organizationId, period])

  const loadData = async () => {
    setLoading(true)
    const result = await getEmployeePerformance(organizationId, period)
    if (result.success && result.data) {
      setEmployees(result.data)
    }
    setLoading(false)
  }

  const maxRevenue = Math.max(...employees.map(e => e.revenue), 1)

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border" style={{ 
        backgroundColor: COLORS.surfaceGlass,
        backdropFilter: 'blur(12px)',
        borderColor: COLORS.border,
      }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySubtle }}>
            <Trophy className="w-5 h-5" style={{ color: COLORS.primary }} />
          </div>
          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Rendimiento Staff</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: COLORS.surfaceSubtle }} />
                <div className="h-4 w-24 rounded" style={{ backgroundColor: COLORS.surfaceSubtle }} />
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: COLORS.surfaceSubtle }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div 
      className="p-6 rounded-2xl border transition-all duration-300"
      style={{ 
        backgroundColor: COLORS.surfaceGlass,
        backdropFilter: 'blur(12px)',
        borderColor: COLORS.border,
        boxShadow: '0 4px 24px rgba(15, 76, 92, 0.08)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySubtle }}>
          <Trophy className="w-5 h-5" style={{ color: COLORS.primary }} />
        </div>
        <div>
          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Rendimiento Staff</h3>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Top 5 por ingresos</p>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <User className="w-6 h-6" style={{ color: COLORS.textMuted }} />
          </div>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>Sin datos de empleados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {employees.map((emp, index) => {
            const percentage = (emp.revenue / maxRevenue) * 100
            const isTop = index === 0
            
            return (
              <div key={emp.employee_id} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {isTop && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.warningLight, color: COLORS.warning }}>
                        Top
                      </span>
                    )}
                    <span className="font-medium text-sm" style={{ color: COLORS.textPrimary }}>
                      {emp.employee_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm" style={{ color: COLORS.success }}>
                      COP {emp.revenue.toLocaleString('es-CO')}
                    </span>
                    <span className="text-xs ml-2" style={{ color: COLORS.textMuted }}>
                      {emp.completed} citas
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      background: isTop 
                        ? `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.success})`
                        : COLORS.primary + '80'
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
