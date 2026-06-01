'use client'
import { useState, useEffect } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { X, Loader2, Users, Banknote } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'

function fmt(v: string) { const n = v.replace(/\D/g, ''); return n ? new Intl.NumberFormat('es-CO').format(parseInt(n, 10)) : '' }

export function PayEmployeeModal({ organizationId, onSubmit, onClose, isLoading }: any) {
  const COLORS = useThemeColors()
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const sub = (e: any) => {
    e.preventDefault()
    if (!empId) return
    const a = parseInt(raw.replace(/\D/g, '') || '0', 10)
    if (a <= 0) return
    onSubmit({ employee_id: empId, amount: a, payment_method: pm })
  }

  const isValid = empId && raw && parseInt(raw.replace(/\D/g, '') || '0') > 0

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
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: COLORS.warningLight }}>
              <Users className="w-5 h-5" style={{ color: COLORS.warning }} />
            </div>
            <div>
              <h3 className="font-semibold text-base" style={{ color: COLORS.textPrimary }}>Pagar Empleado</h3>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>Registra un pago de nomina</p>
            </div>
          </div>
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
            <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
              Empleado
            </label>
            <select
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                backgroundColor: COLORS.surfaceSubtle,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textPrimary,
              }}
            >
              <option value="">Seleccionar empleado</option>
              {employees.map((e: any) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: COLORS.textMuted }}>
                <Banknote className="w-4 h-4" />
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={fmt(raw)}
                onChange={(e) => setRaw(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all"
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

          <button
            type="submit"
            disabled={isLoading || !isValid}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
            style={{ backgroundColor: COLORS.warning, color: '#fff' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Pago'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
