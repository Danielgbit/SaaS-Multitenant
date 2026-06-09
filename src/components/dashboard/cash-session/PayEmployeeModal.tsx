'use client'
import { useState, useEffect } from 'react'
import { Modal, Button } from '@/components/ui'

function fmt(v: string) { const n = v.replace(/\D/g, ''); return n ? new Intl.NumberFormat('es-CO').format(parseInt(n, 10)) : '' }

export function PayEmployeeModal({ organizationId, onSubmit, onClose, isLoading }: any) {
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
    const amount = parseFloat(raw.replace(/\./g, '').replace(/,/g, ''))
    onSubmit({ employee_id: empId, amount: isNaN(amount) ? 0 : amount, payment_method: pm })
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Pagar empleado"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button variant="primary" type="submit" form="pay-form" disabled={isLoading || !empId} loading={isLoading}>Pagar</Button>
        </>
      }>
      <form id="pay-form" onSubmit={sub} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Empleado</label>
          <select value={empId} onChange={e => setEmpId(e.target.value)} required
            className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm">
            <option value="">Seleccionar...</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Monto</label>
            <input type="text" value={raw} onChange={e => setRaw(fmt(e.target.value))} placeholder="Monto" inputMode="numeric"
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Método</label>
            <select value={pm} onChange={e => setPm(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm">
              <option value="cash">Efectivo</option>
              <option value="qr">QR</option>
              <option value="transfer">Transferencia</option>
              <option value="card">Tarjeta</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  )
}
