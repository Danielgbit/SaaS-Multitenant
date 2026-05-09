'use client'

import { X, Briefcase, Percent, Pencil, CheckCircle, Check, ChevronDown } from 'lucide-react'
import type { ThemeColors } from '@/hooks/useThemeColors'

export type BulkEditField = 'contract_type' | 'payment_type'

interface BulkEditModalProps {
  COLORS: ThemeColors
  selectedCount: number
  field: BulkEditField
  value: string
  onFieldChange: (f: BulkEditField) => void
  onValueChange: (v: string) => void
  onCancel: () => void
  onApply: () => void
}

export default function BulkEditModal({
  COLORS, selectedCount, field, value,
  onFieldChange, onValueChange, onCancel, onApply,
}: BulkEditModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />

      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-xl"
        style={{ backgroundColor: COLORS.surface }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-edit-title"
      >
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
              <Pencil className="w-5 h-5" style={{ color: COLORS.primary }} />
            </div>
            <div>
              <h3 id="bulk-edit-title" className="text-lg font-bold" style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}>
                Cambiar tipo
              </h3>
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                {selectedCount} empleado{selectedCount !== 1 ? 's' : ''} seleccionad{selectedCount !== 1 ? 'os' : 'o'}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" style={{ color: COLORS.textMuted }} aria-label="Cerrar modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: COLORS.textSecondary }}>
              ¿Qué quieres cambiar?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['contract_type', 'payment_type'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => onFieldChange(f)}
                  className="p-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 cursor-pointer hover:shadow-sm"
                  style={{
                    borderColor: field === f ? COLORS.primary : COLORS.border,
                    backgroundColor: field === f ? COLORS.primary + '08' : 'transparent',
                    color: field === f ? COLORS.primary : COLORS.textSecondary,
                  }}
                >
                  {f === 'contract_type' ? <Briefcase className="w-5 h-5 mx-auto mb-2" /> : <Percent className="w-5 h-5 mx-auto mb-2" />}
                  <span className="block">{f === 'contract_type' ? 'Contrato' : 'Pago'}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
              Nuevo valor
            </label>
            <div className="relative">
              <select
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-xl border appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2"
                style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary }}
              >
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
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: COLORS.textMuted }} />
            </div>
          </div>

          {value && (
            <div className="p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: COLORS.success + '10' }}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.success }} />
              <p className="text-sm" style={{ color: COLORS.success }}>
                Se aplicará a {selectedCount} empleado{selectedCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        <div className="p-5 border-t flex gap-3" style={{ borderColor: COLORS.border }}>
          <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer hover:shadow-sm"
            style={{ backgroundColor: COLORS.surfaceSubtle || COLORS.primary + '08', color: COLORS.textSecondary }}>
            Cancelar
          </button>
          <button onClick={onApply} disabled={!value}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:shadow-md flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.primary }}>
            <Check className="w-4 h-4" /> Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
