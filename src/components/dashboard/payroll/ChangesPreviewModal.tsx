'use client'

import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { formatCurrencyCOP } from '@/lib/billing/utils'

interface PendingChange {
  itemId: string
  employeeName: string
  field: string
  oldValue: any
  newValue: any
  impact?: { oldValue: number; newValue: number }
}

interface ChangesPreviewModalProps {
  changes: PendingChange[]
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}

const FIELD_LABELS: Record<string, string> = {
  contract_type: 'Tipo de contrato',
  payment_type: 'Modalidad de pago',
  percentage: 'Porcentaje de comisión',
  base_salary: 'Salario base',
}

const VALUE_LABELS: Record<string, Record<string, string>> = {
  contract_type: { laboral: 'Laboral', prestacion: 'Prestación de servicios' },
  payment_type: { fijo: 'Sueldo fijo', porcentaje: 'Comisión porcentage', mixed: 'Mixto' },
}

export function ChangesPreviewModal({ changes, onCancel, onConfirm, loading }: ChangesPreviewModalProps) {
  const hasSalaryImpact = changes.some(c => ['base_salary', 'percentage', 'contract_type'].includes(c.field))

  return (
    <Modal isOpen={true} onClose={onCancel} title="Cambios Pendientes"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button variant="primary" onClick={onConfirm} loading={loading}>
            Aplicar Cambios
          </Button>
        </>
      }>
      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">{changes.length} cambio{changes.length !== 1 ? 's' : ''} sin aplicar</p>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {changes.map((change) => (
          <div key={`${change.itemId}-${change.field}`} className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]">
            <p className="font-medium text-sm mb-2 text-[#0F172A] dark:text-[#F1F5F9]">{change.employeeName}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#64748B] dark:text-[#94A3B8]">{FIELD_LABELS[change.field] || change.field}:</span>
              <span className="text-[#475569] dark:text-[#CBD5E1]">{VALUE_LABELS[change.field]?.[change.oldValue] || change.oldValue}</span>
              <ArrowRight className="w-3 h-3 text-[#64748B]" />
              <span className="font-medium text-[#0F4C5C] dark:text-[#38BDF8]">{VALUE_LABELS[change.field]?.[change.newValue] || change.newValue}</span>
            </div>
            {change.impact && (
              <div className="mt-2 p-2 rounded-lg text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                Impacto: {formatCurrencyCOP(change.impact.oldValue)} → {formatCurrencyCOP(change.impact.newValue)}
              </div>
            )}
          </div>
        ))}

        {hasSalaryImpact && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Los cambios afectarán el cálculo del neto</p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Deducciones y totales se recalcularán al guardar</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
