'use client'
import { useState, useEffect } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { X, Loader2, ArrowDownRight, ArrowRightLeft, StickyNote, Pause } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'

function fmt(v: string) { const n = v.replace(/\D/g, ''); return n ? new Intl.NumberFormat('es-CO').format(parseInt(n, 10)) : '' }

const ENTRY_TYPES = [
  { v: 'expense', l: 'Gasto', icon: <ArrowDownRight className="w-3.5 h-3.5" /> },
  { v: 'adjustment', l: 'Ajuste', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
  { v: 'note', l: 'Nota', icon: <StickyNote className="w-3.5 h-3.5" /> },
  { v: 'break', l: 'Descanso', icon: <Pause className="w-3.5 h-3.5" /> },
]

export function NewEntryModal({ onSubmit, onClose, isLoading }: any) {
  const COLORS = useThemeColors()
  const [type, setType] = useState('expense')
  const [title, setTitle] = useState('')
  const [raw, setRaw] = useState('')
  const [pm, setPm] = useState('cash')
  const hasAmount = type !== 'note' && type !== 'break'

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const sub = (e: any) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      entry_type: type,
      direction: hasAmount ? 'out' : null,
      title: title.trim(),
      amount: hasAmount ? parseInt(raw.replace(/\D/g, '') || '0', 10) : 0,
      payment_method: hasAmount ? pm : undefined,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: COLORS.overlay }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[20px] overflow-hidden animate-scale-in-95"
        style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadow.xl }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: COLORS.border }}>
          <h3 className="font-semibold text-base" style={{ color: COLORS.textPrimary }}>Nuevo Movimiento</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
            style={{ color: COLORS.textMuted }}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={sub} className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: COLORS.textSecondary }}>Tipo</label>
            <div className="flex gap-2 flex-wrap">
              {ENTRY_TYPES.map((t) => {
                const isActive = type === t.v
                return (
                  <button
                    key={t.v}
                    type="button"
                    onClick={() => setType(t.v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8] ${isActive ? '' : 'hover:opacity-70'}`}
                    style={{
                      backgroundColor: isActive ? COLORS.primary : COLORS.surfaceSubtle,
                      color: isActive ? '#fff' : COLORS.textPrimary,
                      border: `1px solid ${isActive ? COLORS.primary : COLORS.border}`,
                    }}
                  >
                    {t.icon}
                    {t.l}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>Titulo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Describe el movimiento..."
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                backgroundColor: COLORS.surfaceSubtle,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textPrimary,
              }}
              autoFocus
            />
          </div>

          {hasAmount && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>Monto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: COLORS.textMuted }}>$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fmt(raw)}
                    onChange={(e) => setRaw(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    required
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      backgroundColor: COLORS.surfaceSubtle,
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.textPrimary,
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>Metodo de pago</label>
                <select
                  value={pm}
                  onChange={(e) => setPm(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    backgroundColor: COLORS.surfaceSubtle,
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.textPrimary,
                  }}
                >
                  <option value="cash">Efectivo</option>
                  <option value="qr">QR</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading || !title.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
            style={{ backgroundColor: COLORS.primary, color: '#fff' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Registrar'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
