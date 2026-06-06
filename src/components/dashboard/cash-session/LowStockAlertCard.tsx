'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useThemeColors } from '@/hooks/useThemeColors'
import { AlertTriangle, ChevronDown, Package } from 'lucide-react'

function fmt(n: number) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) }

interface LowStockAlertCardProps {
  organizationId: string | null
}

export function LowStockAlertCard({ organizationId }: LowStockAlertCardProps) {
  const COLORS = useThemeColors()
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [expanded, setExpanded] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!organizationId) return
    const fetch = async () => {
      try {
        const supabase = (await import('@/lib/supabase/client')).createClient()
        const { data } = await supabase
          .from('inventory_items')
          .select('id, name, quantity, min_quantity, unit')
          .eq('organization_id', organizationId)
          .eq('active', true)
          .order('name')
        const filtered = (data || []).filter((i: any) => i.quantity <= i.min_quantity)
        if (filtered.length > 0) setVisible(true)
        setLowStockItems(filtered)
      } catch { /* silently ignore */ }
    }
    fetch()
  }, [organizationId])

  if (!visible || lowStockItems.length === 0) return null

  return (
    <div
      className="p-3 sm:p-4 lg:p-5 rounded-[20px] border"
      style={{
        backgroundColor: COLORS.warningLight,
        borderColor: COLORS.warning,
        boxShadow: COLORS.shadow.md,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8] rounded-lg px-1 py-0.5"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" style={{ color: COLORS.warning }} />
          <span className="text-sm font-semibold" style={{ color: COLORS.warning }}>
            {lowStockItems.length} producto{lowStockItems.length !== 1 ? 's' : ''} con stock bajo
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          style={{ color: COLORS.warning }}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {lowStockItems.slice(0, 5).map((item: any) => (
            <div key={item.id} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
                <span className="text-xs truncate min-w-0" style={{ color: COLORS.textPrimary }}>{item.name}</span>
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: item.quantity === 0 ? COLORS.error : COLORS.warning }}
              >
                {item.quantity} / {item.min_quantity} {item.unit}
              </span>
            </div>
          ))}
          {lowStockItems.length > 5 && (
            <Link
              href="/inventario"
              className="block text-xs font-medium mt-2"
              style={{ color: COLORS.primary }}
            >
              Ver todos en inventario →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
