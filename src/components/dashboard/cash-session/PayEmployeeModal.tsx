'use client'
import { useState, useEffect } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { X } from 'lucide-react'

function fmt(v: string) { const n = v.replace(/\D/g, ''); return n ? new Intl.NumberFormat('es-CO').format(parseInt(n, 10)) : '' }

export function PayEmployeeModal({ organizationId, onSubmit, onClose, isLoading }: any) {
  const theme = useThemeColors()
  const [employees, setEmployees] = useState<any[]>([])
  const [empId, setEmpId] = useState('')
  const [raw, setRaw] = useState('')
  const [pm, setPm] = useState('cash')

  useEffect(() => {
    (async () => {
      const s = (await import('@/lib/supabase/client')).createClient()
      const { data } = await s.from('employees').select('id, name').eq('organization_id', organizationId).eq('active', true).order('name')
      setEmployees(data ?? [])
    })()
  }, [organizationId])

  const sub = (e: any) => {
    e.preventDefault()
    if (!empId) return
    const a = parseInt(raw.replace(/\D/g, '') || '0', 10)
    if (a <= 0) return
    onSubmit({ employee_id: empId, amount: a, payment_method: pm })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="rounded-xl w-full max-w-md overflow-hidden" style={{ backgroundColor: theme.surface, border: '1px solid ' + theme.border }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.border }}>
          <h3 className="font-semibold text-sm" style={{ color: theme.textPrimary }}>Pagar Empleado</h3>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: theme.textSecondary }} /></button>
        </div>
        <form onSubmit={sub} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: theme.textSecondary }}>Empleado</label>
            <select value={empId} onChange={(e) => setEmpId(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: theme.surface === '#151b1d' ? '#1e2729' : '#f5f5f4', border: '1px solid ' + theme.border, color: theme.textPrimary }}>
              <option value="">Seleccionar</option>
              {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: theme.textSecondary }}>Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: theme.textMuted }}>$</span>
              <input type="text" inputMode="numeric" value={fmt(raw)} onChange={(e) => setRaw(e.target.value.replace(/\D/g, ''))} placeholder="0" required
                className="w-full pl-7 pr-3 py-2 rounded-lg text-sm outline-none"
                style={{ backgroundColor: theme.surface === '#151b1d' ? '#1e2729' : '#f5f5f4', border: '1px solid ' + theme.border, color: theme.textPrimary }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: theme.textSecondary }}>Metodo</label>
            <select value={pm} onChange={(e) => setPm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: theme.surface === '#151b1d' ? '#1e2729' : '#f5f5f4', border: '1px solid ' + theme.border, color: theme.textPrimary }}>
              <option value="cash">Efectivo</option><option value="qr">QR</option><option value="transfer">Transferencia</option><option value="card">Tarjeta</option>
            </select>
          </div>
          <button type="submit" disabled={isLoading || !empId || raw === '' || raw === '0'}
            className="w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: theme.warning, color: '#fff' }}>{isLoading ? 'Registrando...' : 'Registrar Pago'}</button>
        </form>
      </div>
    </div>
  )
}
