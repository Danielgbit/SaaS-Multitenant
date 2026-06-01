'use client'
import { useState } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { DollarSign } from 'lucide-react'

function fmt(v: string) { const n = v.replace(/\D/g, ''); return n ? new Intl.NumberFormat('es-CO').format(parseInt(n, 10)) : '' }

export function OpenSessionForm({ onSubmit, isLoading }: any) {
  const theme = useThemeColors()
  const [v, setV] = useState('0')
  const sub = (e: any) => { e.preventDefault(); const n = parseInt(v.replace(/\D/g, ''), 10); if (!isNaN(n)) onSubmit(n) }
  return (
    <div className="rounded-xl p-8 w-full max-w-md" style={{ backgroundColor: theme.surface, border: '1px solid ' + theme.border }}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.accentTealSubtle }}>
          <DollarSign className="w-8 h-8" style={{ color: theme.accentTeal }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: theme.textPrimary }}>Abrir Caja del Dia</h2>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Puedes iniciar en 0 si no hay efectivo al abrir</p>
        </div>
        <form onSubmit={sub} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: theme.textSecondary }}>Monto inicial en caja</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: theme.textMuted }}>$</span>
              <input type="text" inputMode="numeric" value={fmt(v)} onChange={(e) => setV(e.target.value.replace(/\D/g, ''))} placeholder="0" required
                className="w-full pl-7 pr-3 py-2 rounded-lg text-sm outline-none"
                style={{ backgroundColor: theme.surfaceSubtle, border: '1px solid ' + theme.border, color: theme.textPrimary }} autoFocus />
            </div>
          </div>
          <button type="submit" disabled={isLoading || v === ""}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
            style={{ backgroundColor: theme.accentTeal, color: '#fff' }}>{isLoading ? 'Abriendo...' : 'Abrir Caja'}</button>
        </form>
      </div>
    </div>
  )
}
