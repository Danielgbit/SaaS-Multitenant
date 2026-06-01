'use client'
import { useState, useMemo } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Scissors, ShoppingBag, Receipt, Users, Package, ChevronDown, TrendingUp } from 'lucide-react'

function fmt(n: number) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) }

interface DailyMetricsCardProps {
  entries: any[]
}

interface MetricRow {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}

export function DailyMetricsCard({ entries }: DailyMetricsCardProps) {
  const COLORS = useThemeColors()
  const [expanded, setExpanded] = useState(false)

  const metrics = useMemo(() => {
    const r = { income: 0, product_sale: 0, expense: 0, payroll_expense: 0, inventory_purchase: 0 }
    for (const e of entries) {
      if (e.direction === 'in' && e.entry_type === 'income') r.income += e.amount
      if (e.direction === 'in' && e.entry_type === 'product_sale') r.product_sale += e.amount
      if (e.direction === 'out' && e.entry_type === 'expense') r.expense += e.amount
      if (e.direction === 'out' && e.entry_type === 'payroll_expense') r.payroll_expense += e.amount
      if (e.direction === 'out' && e.entry_type === 'inventory_purchase') r.inventory_purchase += e.amount
    }
    return r
  }, [entries])

  const netDay = metrics.income + metrics.product_sale - metrics.expense - metrics.payroll_expense - metrics.inventory_purchase

  const rows: MetricRow[] = [
    { label: 'Servicios', value: metrics.income, icon: <Scissors className="w-3.5 h-3.5" />, color: COLORS.success },
    { label: 'Productos', value: metrics.product_sale, icon: <ShoppingBag className="w-3.5 h-3.5" />, color: COLORS.success },
    { label: 'Gastos', value: metrics.expense, icon: <Receipt className="w-3.5 h-3.5" />, color: COLORS.error },
    { label: 'Nomina', value: metrics.payroll_expense, icon: <Users className="w-3.5 h-3.5" />, color: COLORS.error },
    { label: 'Compra inv.', value: metrics.inventory_purchase, icon: <Package className="w-3.5 h-3.5" />, color: COLORS.error },
  ]

  const hasMetrics = rows.some(r => r.value > 0)

  if (!hasMetrics) return null

  return (
    <div
      className="p-3 sm:p-4 lg:p-5 rounded-[20px] border"
      style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, boxShadow: COLORS.shadow.md }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8] rounded-lg px-1 py-0.5"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: COLORS.primary }} />
          <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Métricas del día</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          style={{ color: COLORS.textMuted }}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {rows.map((row) =>
            row.value > 0 ? (
              <div key={row.label} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span style={{ color: COLORS.textMuted }}>{row.icon}</span>
                  <span className="text-xs" style={{ color: COLORS.textMuted }}>{row.label}</span>
                </div>
                <span className="text-xs font-medium" style={{ color: row.color }}>
                  {row.value > 0 ? '+' : ''}{fmt(row.value)}
                </span>
              </div>
            ) : null
          )}
          <div className="border-t pt-2 mt-2 flex justify-between items-center" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: COLORS.textPrimary }} />
              <span className="text-xs font-semibold" style={{ color: COLORS.textPrimary }}>Neto del dia</span>
            </div>
            <span
              className="text-sm font-bold"
              style={{ color: netDay >= 0 ? COLORS.success : COLORS.error }}
            >
              {netDay >= 0 ? '+' : ''}{fmt(netDay)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
