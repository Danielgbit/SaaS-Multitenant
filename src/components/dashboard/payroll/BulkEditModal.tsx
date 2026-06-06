'use client'

import { Briefcase, Percent, Pencil, CheckCircle, Check, ChevronDown } from 'lucide-react'
import { Modal, Button } from '@/components/ui'

export type BulkEditField = 'contract_type' | 'payment_type'

interface BulkEditModalProps {
  selectedCount: number
  field: BulkEditField
  value: string
  onFieldChange: (f: BulkEditField) => void
  onValueChange: (v: string) => void
  onCancel: () => void
  onApply: () => void
}

export default function BulkEditModal({
  selectedCount, field, value,
  onFieldChange, onValueChange, onCancel, onApply,
}: BulkEditModalProps) {
  return (
    <Modal isOpen={true} onClose={onCancel} title="Cambiar tipo"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button variant="primary" onClick={onApply} disabled={!value}>
            <Check className="w-4 h-4" /> Aplicar
          </Button>
        </>
      }>
      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">
        {selectedCount} empleado{selectedCount !== 1 ? 's' : ''} seleccionad{selectedCount !== 1 ? 'os' : 'o'}
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-2">¿Qué quieres cambiar?</label>
          <div className="grid grid-cols-2 gap-3">
            {(['contract_type', 'payment_type'] as const).map((f) => (
              <button key={f} type="button" onClick={() => onFieldChange(f)}
                className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  field === f ? 'border-[#0F4C5C] dark:border-[#38BDF8] bg-[#0F4C5C]/5 dark:bg-[#38BDF8]/10 text-[#0F4C5C] dark:text-[#38BDF8]' : 'border-[#E2E8F0] dark:border-[#334155] text-[#475569] dark:text-[#94A3B8]'
                }`}>
                {f === 'contract_type' ? <Briefcase className="w-5 h-5 mx-auto mb-2" /> : <Percent className="w-5 h-5 mx-auto mb-2" />}
                <span className="block">{f === 'contract_type' ? 'Contrato' : 'Pago'}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-2">Nuevo valor</label>
          <div className="relative">
            <select value={value} onChange={(e) => onValueChange(e.target.value)}
              className="w-full px-4 py-3 pr-10 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-[#0F172A] dark:text-[#F1F5F9] text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8]">
              <option value="">Seleccionar...</option>
              {field === 'contract_type' ? (
                <>
                  <option value="laboral">Contrato Laboral</option>
                  <option value="prestacion">Prestación de servicios</option>
                </>
              ) : (
                <>
                  <option value="fijo">Sueldo Fijo</option>
                  <option value="porcentaje">Comisión (porcentaje)</option>
                  <option value="mixed">Mixto</option>
                </>
              )}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
          </div>
        </div>

        {value && (
          <div className="p-3 rounded-lg flex items-center gap-2 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-xs text-green-700 dark:text-green-300">
              Se aplicará a {selectedCount} empleado{selectedCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
