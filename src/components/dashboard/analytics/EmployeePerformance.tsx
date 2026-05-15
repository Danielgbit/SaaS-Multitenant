'use client'

import { Trophy, User } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'

interface EmployeeData {
  employee_id: string
  employee_name: string
  appointments: number
  revenue: number
  completed: number
}

interface EmployeePerformanceProps {
  employees: EmployeeData[]
  loading: boolean
}

export function EmployeePerformance({ employees, loading }: EmployeePerformanceProps) {
  const COLORS = useThemeColors()
  const maxRevenue = Math.max(...employees.map(e => e.revenue), 1)

  if (loading) {
    return (
      <Card variant="glass" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySubtle }}>
            <Trophy className="w-5 h-5" style={{ color: COLORS.primary }} />
          </div>
          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Rendimiento Staff</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width="w-8" height="h-8" />
                <Skeleton variant="text" width="w-24" />
              </div>
              <Skeleton variant="rectangular" height="h-2" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card variant="glass" className="p-6">
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
        <EmptyState
          icon={<User className="w-6 h-6" style={{ color: COLORS.textMuted }} />}
          title="Sin datos de empleados"
        />
      ) : (
        <div className="space-y-4">
          {employees.map((emp, index) => {
            const percentage = (emp.revenue / maxRevenue) * 100
            const isTop = index === 0
            
            return (
              <div key={emp.employee_id} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {isTop && <Badge variant="gold" size="sm">Top</Badge>}
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
    </Card>
  )
}
