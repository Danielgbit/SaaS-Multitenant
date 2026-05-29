'use client'
import { useThemeColors } from '@/hooks/useThemeColors'
import { XCircle } from 'lucide-react'
import { ENTRY_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/types/cash-sessions'

function fmt(n: number) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) }
function tm(i: string) { try { return new Date(i).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }) } catch { return '' } }

export function CashTimeline({ entries, canVoid }: any) {
  const theme = useThemeColors()
  if (!entries?.length) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ backgroundColor: theme.surface, border: '1px solid ' + theme.border }}>
        <p style={{ color: theme.textMuted }}>Hoy no hay movimientos.</p>
        <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Los ingresos se registran automaticamente.</p>
      </div>
    )
  }
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.surface, border: '1px solid ' + theme.border }}>
      <div className="p-4 border-b" style={{ borderColor: theme.border, color: theme.textPrimary }}>
        <h2 className="text-sm font-semibold">Timeline del Dia</h2>
      </div>
      <div className="divide-y" style={{ borderColor: theme.border }}>
        {entries.map((e: any) => {
          const c = e.entry_status === 'voided' ? theme.textMuted : e.direction === 'in' ? '#22c55e' : e.direction === 'out' ? '#ef4444' : theme.textSecondary
          return (
            <div key={e.id} className={'flex items-start gap-3 p-3 ' + (e.entry_status === 'voided' ? 'opacity-40 line-through' : '')}>
              <div className="flex flex-col items-center gap-0.5 mt-1 w-12">
                <span className="text-xs font-mono" style={{ color: theme.textMuted }}>{tm(e.created_at)}</span>
                <span className="text-sm font-bold" style={{ color: c }}>{e.direction === 'in' ? '+' : e.direction === 'out' ? '-' : 'o'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{
                    backgroundColor: e.entry_type === 'income' ? 'rgba(34,197,94,0.1)' : e.entry_type === 'expense' || e.entry_type === 'payroll_expense' ? 'rgba(239,68,68,0.1)' : 'rgba(156,163,175,0.1)',
                    color: e.entry_type === 'income' ? '#22c55e' : e.entry_type === 'expense' || e.entry_type === 'payroll_expense' ? '#ef4444' : theme.textSecondary,
                  }}>{(ENTRY_TYPE_LABELS as any)[e.entry_type] || e.entry_type}</span>
                  {e.entry_status === 'voided' && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600">Anulado</span>}
                </div>
                <p className="text-sm font-medium mt-0.5" style={{ color: theme.textPrimary }}>{e.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {e.direction ? (
                    <>
                      <span className="text-sm font-semibold" style={{ color: c }}>
                        {e.direction === 'in' ? '+ ' : '- '}{fmt(e.amount)}
                      </span>
                      {e.payment_method && <span className="text-xs" style={{ color: theme.textMuted }}>{(PAYMENT_METHOD_LABELS as any)[e.payment_method]}</span>}
                    </>
                  ) : (
                    e.entry_type === 'inventory_out' && e.metadata?.estimated_cost && (
                      <span className="text-xs" style={{ color: theme.textMuted }}>
                        Costo est.: {fmt(e.metadata.estimated_cost)}
                      </span>
                    )
                  )}
                </div>
              </div>
              {canVoid && e.entry_status === 'active' && (
                <button onClick={() => { const r = prompt('Motivo:'); if (r?.trim()) {} }} className="p-1 rounded shrink-0">
                  <XCircle className="w-4 h-4" style={{ color: theme.textMuted }} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
