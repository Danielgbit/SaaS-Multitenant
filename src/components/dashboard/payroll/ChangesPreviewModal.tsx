'use client'

import { useTheme } from 'next-themes'
import {
  X,
  AlertTriangle,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { useThemeColors } from '@/hooks/useThemeColors'

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
  contract_type: {
    laboral: 'Laboral',
    prestacion: 'Prestación de servicios',
  },
  payment_type: {
    fijo: 'Sueldo fijo',
    porcentaje: 'Comisión porcentage',
    mixed: 'Mixto',
  },
}

export function ChangesPreviewModal({
  changes,
  onCancel,
  onConfirm,
  loading,
}: ChangesPreviewModalProps) {
  const COLORS = useThemeColors()

  const hasSalaryImpact = changes.some(c =>
    c.field === 'base_salary' ||
    c.field === 'percentage' ||
    c.field === 'contract_type'
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ backgroundColor: COLORS.surface }}
      >
        <div
          className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: COLORS.warning + '20' }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: COLORS.warning }} />
            </div>
            <div>
              <h3
                className="text-lg font-bold"
                style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
              >
                Cambios Pendientes
              </h3>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                {changes.length} cambio{changes.length !== 1 ? 's' : ''} sin aplicar
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: COLORS.textMuted }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-96 overflow-y-auto space-y-4">
          {changes.map((change) => (
            <div
              key={`${change.itemId}-${change.field}`}
              className="p-4 rounded-xl"
              style={{ backgroundColor: COLORS.surfaceSubtle }}
            >
              <p className="font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                {change.employeeName}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: COLORS.textMuted }}>
                  {FIELD_LABELS[change.field] || change.field}:
                </span>
                <span style={{ color: COLORS.textSecondary }}>
                  {VALUE_LABELS[change.field]?.[change.oldValue] || change.oldValue}
                </span>
                <ArrowRight className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                <span className="font-medium" style={{ color: COLORS.primary }}>
                  {VALUE_LABELS[change.field]?.[change.newValue] || change.newValue}
                </span>
              </div>
              {change.impact && (
                <div
                  className="mt-2 p-2 rounded-lg text-sm"
                  style={{ backgroundColor: COLORS.warning + '10' }}
                >
                  <p style={{ color: COLORS.warning }}>
                    Impacto: {formatCurrencyCOP(change.impact.oldValue)} → {formatCurrencyCOP(change.impact.newValue)}
                    {change.impact.newValue > change.impact.oldValue ? ' (+' : ' ('}
                    {formatCurrencyCOP(Math.abs(change.impact.newValue - change.impact.oldValue))})
                    {change.impact.newValue > change.impact.oldValue ? ')' : ')'}
                  </p>
                </div>
              )}
            </div>
          ))}

          {hasSalaryImpact && (
            <div
              className="p-4 rounded-xl flex items-start gap-3"
              style={{ backgroundColor: COLORS.warning + '10' }}
            >
              <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: COLORS.warning }} />
              <div>
                <p className="font-medium text-sm" style={{ color: COLORS.warning }}>
                  Los cambios afectarán el cálculo del neto
                </p>
                <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                  Las deducciones y totales se recalcularán al guardar
                </p>
              </div>
            </div>
          )}
        </div>

        <div
          className="p-5 border-t flex gap-3"
          style={{ borderColor: COLORS.border }}
        >
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              backgroundColor: COLORS.surfaceSubtle,
              color: COLORS.textSecondary,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.primary }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {loading ? 'Guardando...' : 'Aplicar Cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
