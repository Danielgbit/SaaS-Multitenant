'use client'
import { useState } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { X } from 'lucide-react'

function fmt(v: string) { const n = v.replace(/\D/g, ''); return n ? new Intl.NumberFormat('es-CO').format(parseInt(n, 10)) : '' }

export function NewEntryModal({ onSubmit, onClose, isLoading }: any) {
  const theme = useThemeColors()
  const [type, setType] = useState('expense')
  const [title, setTitle] = useState('')
  const [raw, setRaw] = useState('')
  const [pm, setPm] = useState('cash')
  const hasAmount = type !== 'note' && type !== 'break'
  const sub = (e: any) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      entry_type: type, direction: hasAmount ? 'out' : null, title: title.trim(),
      amount: hasAmount ? parseInt(raw.replace(/\D/g, '') || '0', 10) : 0,
      payment_method: hasAmount ? pm : undefined,
    })
  }
  const types = [{ v: 'expense', l: 'Gasto' }, { v: 'adjustment', l: 'Ajuste' }, { v: 'note', l: 'Nota' }, { v: 'break', l: 'Descanso' }]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="rounded-xl w-full max-w-md overflow-hidden" style={{ backgroundColor: theme.surface, border: '1px solid ' + theme.border }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.border }}>
          <h3 className="font-semibold text-sm" style={{ color: theme.textPrimary }}>Nuevo Movimiento</h3>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: theme.textSecondary }} /></button>
        </div>
        <form onSubmit={sub} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textSecondary }}>Tipo</label>
            <div className="flex gap-2 flex-wrap">
              {types.map((t) => (
                <button key={t.v} type="button" onClick={() => setType(t.v)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: type === t.v ? theme.primary : theme.surface === '#151b1d' ? '#1e2729' : '#f5f5f4', color: type === t.v ? '#fff' : theme.textPrimary, border: type === t.v ? 'none' : '1px solid ' + theme.border }}>{t.l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: theme.textSecondary }}>Titulo</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: theme.surface === '#151b1d' ? '#1e2729' : '#f5f5f4', border: '1px solid ' + theme.border, color: theme.textPrimary }} autoFocus />
          </div>
          {hasAmount && (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: theme.textSecondary }}>Monto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: theme.textMuted }}>$</span>
                <input type="text" inputMode="numeric" value={fmt(raw)} onChange={(e) => setRaw(e.target.value.replace(/\D/g, ''))} placeholder="0" required
                  className="w-full pl-7 pr-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: theme.surface === '#151b1d' ? '#1e2729' : '#f5f5f4', border: '1px solid ' + theme.border, color: theme.textPrimary }} />
              </div>
            </div>
          )}
          {hasAmount && (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: theme.textSecondary }}>Metodo</label>
              <select value={pm} onChange={(e) => setPm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ backgroundColor: theme.surface === '#151b1d' ? '#1e2729' : '#f5f5f4', border: '1px solid ' + theme.border, color: theme.textPrimary }}>
                <option value="cash">Efectivo</option><option value="qr">QR</option><option value="transfer">Transferencia</option><option value="card">Tarjeta</option>
              </select>
            </div>
          )}
          <button type="submit" disabled={isLoading || !title.trim()}
            className="w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: theme.primary, color: '#fff' }}>{isLoading ? 'Guardando...' : 'Registrar'}</button>
        </form>
      </div>
    </div>
  )
}
