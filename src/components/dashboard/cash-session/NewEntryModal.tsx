'use client'
import { useState } from 'react'
import { ArrowDownRight, ArrowRightLeft, StickyNote, Pause } from 'lucide-react'
import { Modal, Button } from '@/components/ui'

function fmt(v: string) { const n = v.replace(/\D/g, ''); return n ? new Intl.NumberFormat('es-CO').format(parseInt(n, 10)) : '' }

const ENTRY_TYPES = [
  { v: 'expense', l: 'Gasto', icon: <ArrowDownRight className="w-3.5 h-3.5" /> },
  { v: 'adjustment', l: 'Ajuste', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
  { v: 'note', l: 'Nota', icon: <StickyNote className="w-3.5 h-3.5" /> },
  { v: 'break', l: 'Descanso', icon: <Pause className="w-3.5 h-3.5" /> },
]

export function NewEntryModal({ onSubmit, onClose, isLoading }: any) {
  const [type, setType] = useState('expense')
  const [title, setTitle] = useState('')
  const [raw, setRaw] = useState('')
  const [pm, setPm] = useState('cash')
  const hasAmount = type !== 'note' && type !== 'break'

  const sub = (e: any) => {
    e.preventDefault()
    const amount = hasAmount ? parseFloat(raw.replace(/\./g, '').replace(/,/g, '')) : 0
    onSubmit({ entry_type: type, title: title.trim(), amount: isNaN(amount) ? 0 : amount, payment_method: pm })
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Nuevo movimiento"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button variant="primary" type="submit" form="new-entry-form" disabled={isLoading} loading={isLoading}>Guardar</Button>
        </>
      }>
      <form id="new-entry-form" onSubmit={sub} className="space-y-4">
        <div className="flex gap-2">
          {ENTRY_TYPES.map(t => (
            <button key={t.v} type="button" onClick={() => setType(t.v)}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition-all ${type === t.v ? 'border-[#0F4C5C] dark:border-[#38BDF8] bg-[#0F4C5C]/5 dark:bg-[#38BDF8]/10' : 'border-[#E2E8F0] dark:border-[#334155]'}`}>
              {t.icon} <span>{t.l}</span>
            </button>
          ))}
        </div>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Descripción" required
          className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm" />
        {hasAmount && (
          <div className="flex gap-2">
            <input type="text" value={raw} onChange={e => setRaw(fmt(e.target.value))} placeholder="Monto" inputMode="numeric"
              className="flex-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm" />
            <select value={pm} onChange={e => setPm(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm">
              <option value="cash">Efectivo</option>
              <option value="qr">QR</option>
              <option value="transfer">Transferencia</option>
              <option value="card">Tarjeta</option>
            </select>
          </div>
        )}
      </form>
    </Modal>
  )
}
