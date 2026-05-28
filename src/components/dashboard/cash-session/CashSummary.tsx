'use client'
import { useThemeColors } from '@/hooks/useThemeColors'
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ICONS } from '@/types/cash-sessions'
import type { PaymentMethod } from '@/types/cash-sessions'

function fmt(n: number) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) }
const METHODS: PaymentMethod[] = ['cash', 'qr', 'transfer', 'card']

export function CashSummary({ session, entries, onClose, isClosing, canClose }: any) {
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
      </div>
      {canClose && (
        <div className="p-3 border-t" style={{ borderColor: theme.border }}>
          <button onClick={onClose} className="w-full py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: theme.warning, color: '#fff' }}>Cerrar Caja</button>
        </div>
      )}
    </div>
  )
}
