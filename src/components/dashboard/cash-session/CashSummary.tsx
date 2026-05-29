'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useThemeColors } from '@/hooks/useThemeColors'
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ICONS } from '@/types/cash-sessions'
import type { PaymentMethod } from '@/types/cash-sessions'

function fmt(n: number) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) }
const METHODS: PaymentMethod[] = ['cash', 'qr', 'transfer', 'card']

export function CashSummary({ session, entries, onClose, isClosing, canClose, organizationId }: any) {
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [showLowStock, setShowLowStock] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)

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
        if (filtered.length > 0) setShowLowStock(true)
        setLowStockItems(filtered)
      } catch {}
    }
    fetch()
  }, [organizationId])
  const theme = useThemeColors()
  const isClosed = session.status === 'closed'
  const ed = session.expected_cash_detail ?? { cash: 0, qr: 0, transfer: 0, card: 0 }
  const rd = session.real_cash_detail
  const active = (entries || []).filter((e: any) => e.entry_status === 'active')
  const totalIn = active.filter((e: any) => e.direction === 'in').reduce((s: number, e: any) => s + e.amount, 0)
  const totalOut = active.filter((e: any) => e.direction === 'out').reduce((s: number, e: any) => s + e.amount, 0)
  const ec = isClosed ? session.expected_cash : session.opening_cash + totalIn - totalOut
  const diff = (m: PaymentMethod) => rd ? (rd[m] ?? 0) - (ed[m] ?? 0) : null
  const totalDiff = rd ? METHODS.reduce((s, m) => s + (diff(m) ?? 0), 0) : null

  return (
    <div className="rounded-xl overflow-hidden sticky top-4" style={{ backgroundColor: theme.surface, border: '1px solid ' + theme.border }}>
      <div className="p-3 border-b font-semibold text-sm flex items-center justify-between" style={{ borderColor: theme.border, color: theme.textPrimary }}>
        <span>Resumen</span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: isClosed ? 'rgba(156,163,175,0.15)' : 'rgba(34,197,94,0.15)', color: isClosed ? '#9ca3af' : '#22c55e' }}>
          {isClosed ? 'Cerrada' : 'Abierta'}
        </span>
      </div>
      <div className="p-3 space-y-3">
        <div className="flex justify-between"><span className="text-xs" style={{ color: theme.textMuted }}>Apertura</span><span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{fmt(session.opening_cash)}</span></div>
        <div className="border-t pt-3 space-y-2" style={{ borderColor: theme.border }}>
          {METHODS.map((m) => {
            const d = isClosed ? diff(m) : null
            return (
              <div key={m} className="flex justify-between">
                <span className="text-xs" style={{ color: theme.textMuted }}>{PAYMENT_METHOD_ICONS[m]} {PAYMENT_METHOD_LABELS[m]}</span>
                <span className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                  {fmt(ed[m] ?? 0)}
                  {d !== null && <span className="text-xs ml-1" style={{ color: d === 0 ? theme.textMuted : d! > 0 ? '#22c55e' : '#ef4444' }}>{d! > 0 ? '+' : ''}{fmt(d!)}</span>}
                </span>
              </div>
            )
          })}
        </div>
        <div className="border-t pt-3 flex justify-between" style={{ borderColor: theme.border }}>
          <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Total Esp.</span>
          <span className="text-lg font-bold" style={{ color: theme.textPrimary }}>{fmt(ec)}</span>
        </div>
        {isClosed && totalDiff !== null && (
          <div className={'rounded-lg p-3 ' + (totalDiff === 0 ? 'bg-green-50' : 'bg-red-50')}>
            <div className="flex justify-between">
              <span className="text-sm font-semibold" style={{ color: totalDiff === 0 ? '#22c55e' : '#ef4444' }}>{totalDiff === 0 ? 'Cuadra' : 'Diferencia'}</span>
              <span className="text-lg font-bold" style={{ color: totalDiff === 0 ? '#22c55e' : '#ef4444' }}>{totalDiff! > 0 ? '+' : ''}{fmt(totalDiff!)}</span>
            </div>
          </div>
        )}

        {active.length > 0 && (
          <div className="border-t pt-3" style={{ borderColor: theme.border }}>
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="flex items-center gap-1.5 text-xs font-medium w-full"
              style={{ color: theme.textPrimary }}
            >
              <span>{showMetrics ? '▼' : '▶'}</span>
              📊 Hoy
            </button>
            {showMetrics && (
              <div className="mt-2 space-y-1">
                <DailyMetrics entries={active} />
              </div>
            )}
          </div>
        )}

        {lowStockItems.length > 0 && (
          <div className="border-t pt-3" style={{ borderColor: theme.border }}>
            <button onClick={() => setShowLowStock(!showLowStock)}
              className="flex items-center gap-1.5 text-xs font-medium w-full"
              style={{ color: theme.warning }}>
              <span>{showLowStock ? '▼' : '▶'}</span>
              ⚠ {lowStockItems.length} producto{lowStockItems.length !== 1 ? 's' : ''} con stock bajo
            </button>
            {showLowStock && (
              <div className="mt-2 space-y-1">
                {lowStockItems.slice(0, 5).map((i: any) => (
                  <div key={i.id} className="flex justify-between text-xs" style={{ color: theme.textMuted }}>
                    <span>{i.name}</span>
                    <span style={{ color: i.quantity === 0 ? '#ef4444' : theme.warning }}>{i.quantity} / {i.min_quantity} {i.unit}</span>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <Link href="/inventory" className="block text-xs font-medium mt-1" style={{ color: theme.accentTeal }}>
                    Ver todos en inventario →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {canClose && (
        <div className="p-3 border-t" style={{ borderColor: theme.border }}>
          <button onClick={onClose} className="w-full py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: theme.warning, color: '#fff' }}>Cerrar Caja</button>
        </div>
      )}
    </div>
  )
}

function DailyMetrics({ entries }: { entries: any[] }) {
  const theme = useThemeColors()
  const m = useMemo(() => {
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
  const netDay = m.income + m.product_sale - m.expense - m.payroll_expense - m.inventory_purchase

  const rows = [
    { label: '💇 Servicios', value: m.income, color: '#22c55e' },
    { label: '🏪 Productos', value: m.product_sale, color: '#22c55e' },
    { label: '💸 Gastos', value: m.expense, color: '#ef4444' },
    { label: '👥 Nómina', value: m.payroll_expense, color: '#ef4444' },
    { label: '📦 Compra inv.', value: m.inventory_purchase, color: '#ef4444' },
  ]

  return (
    <div className="space-y-1">
      {rows.map((r) =>
        r.value > 0 ? (
          <div key={r.label} className="flex justify-between text-xs">
            <span style={{ color: theme.textMuted }}>{r.label}</span>
            <span style={{ color: r.color }}>{fmt(r.value)}</span>
          </div>
        ) : null
      )}
      <div className="border-t pt-1 mt-1 flex justify-between text-xs font-semibold" style={{ borderColor: theme.border, color: theme.textPrimary }}>
        <span>💰 Neto del día</span>
        <span style={{ color: netDay >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(netDay)}</span>
      </div>
    </div>
  )
}
