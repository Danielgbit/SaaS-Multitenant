'use client'

import { ChevronLeft, FileText, CheckSquare, Pencil, Briefcase, Clock, AlertCircle } from 'lucide-react'
import { Spinner } from '@/components/ui'
import type { ThemeColors } from '@/hooks/useThemeColors'
import EmployeeCard, { type EmployeeCardData } from '../EmployeeCard'
import BulkEditModal, { type BulkEditField } from '../BulkEditModal'

interface EmployeeSelectionStepProps {
  COLORS: ThemeColors
  mounted: boolean
  periodLabel: string

  groupedEmployees: Record<string, EmployeeCardData[]>
  selectedEmployees: Set<string>
  selectedCount: number
  totalCount: number
  onToggleEmployee: (id: string) => void
  onSelectAll: () => void

  onBulkEdit: () => void
  showBulkEdit: boolean
  bulkEditField: BulkEditField
  bulkEditValue: string
  onBulkEditFieldChange: (f: BulkEditField) => void
  onBulkEditValueChange: (v: string) => void
  onApplyBulkEdit: () => void
  onCancelBulkEdit: () => void

  notes: string
  showNotes: boolean
  onNotesChange: (n: string) => void
  onToggleNotes: () => void

  onBack: () => void
  onCreate: () => void
  loading: boolean
  error: string | null
}

const GROUP_LABELS: Record<string, { title: string; subtitle: string; icon: typeof Briefcase }> = {
  laboral_full: { title: 'Contrato Laboral', subtitle: 'Tiempo Completo', icon: Briefcase },
  laboral_part: { title: 'Contrato Laboral', subtitle: 'Medio Tiempo', icon: Clock },
  prestacion: { title: 'Prestación de Servicios', subtitle: '', icon: FileText },
}

export default function EmployeeSelectionStep({
  COLORS, mounted, periodLabel,
  groupedEmployees, selectedEmployees, selectedCount, totalCount,
  onToggleEmployee, onSelectAll,
  onBulkEdit,
  showBulkEdit, bulkEditField, bulkEditValue,
  onBulkEditFieldChange, onBulkEditValueChange, onApplyBulkEdit, onCancelBulkEdit,
  notes, showNotes, onNotesChange, onToggleNotes,
  onBack, onCreate, loading, error,
}: EmployeeSelectionStepProps) {
  return (
    <div className={`min-h-screen p-6 md:p-8 pb-32 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" style={{ color: COLORS.textSecondary }} aria-label="Volver">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Nómina</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>Paso 2 de 2</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}>{periodLabel}</h1>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primary}dd 100%)`, borderColor: COLORS.primary + '40' }}>
          <div className="p-6 md:p-8 text-center relative z-10">
            <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Seleccionar Empleados</h2>
            <p className="text-white/80 text-sm mb-3">{selectedCount} de {totalCount} empleados seleccionados</p>
            {totalCount > 0 && (
              <div className="w-full max-w-xs mx-auto h-2 rounded-full overflow-hidden bg-white/20">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(selectedCount / totalCount) * 100}%`, backgroundColor: COLORS.success }} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onSelectAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer hover:shadow-sm"
              style={{ backgroundColor: COLORS.surfaceSubtle || COLORS.primary + '08', color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` }}>
              <CheckSquare className="w-4 h-4" />
              {selectedCount === totalCount ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
            <button onClick={onBulkEdit} disabled={selectedCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:shadow-sm"
              style={{ backgroundColor: COLORS.surfaceSubtle || COLORS.primary + '08', color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` }}>
              <Pencil className="w-4 h-4" /> Cambiar tipo
            </button>
          </div>
        </div>

        {Object.entries(groupedEmployees).map(([groupKey, emps]) => {
          if (emps.length === 0) return null
          const config = GROUP_LABELS[groupKey] || { title: groupKey, subtitle: '', icon: Briefcase }
          const Icon = config.icon

          return (
            <div key={groupKey}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4" style={{ color: COLORS.primary }} />
                <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>{config.title}</span>
                {config.subtitle && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>{config.subtitle}</span>}
                <span className="text-xs ml-auto" style={{ color: COLORS.textMuted }}>{emps.length} empleados</span>
              </div>
              <div className="space-y-2">
                {emps.map((emp, idx) => (
                  <EmployeeCard
                    key={emp.id}
                    employee={emp}
                    selected={selectedEmployees.has(emp.id)}
                    onToggle={() => onToggleEmployee(emp.id)}
                    COLORS={COLORS}
                    showPartTime={groupKey === 'laboral_part'}
                    index={idx}
                  />
                ))}
              </div>
            </div>
          )
        })}

        <div>
          <button onClick={onToggleNotes} className="flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer hover:opacity-80" style={{ color: COLORS.textMuted }}>
            <FileText className="w-4 h-4" /> {showNotes ? 'Ocultar notas' : 'Agregar notas del período'}
          </button>
          {showNotes && (
            <div className="mt-2">
              <textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} maxLength={500}
                className="w-full p-4 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2"
                style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary }}
                rows={3} placeholder="Notas opcionales sobre este período..." />
              <p className="text-xs mt-1 text-right" style={{ color: COLORS.textMuted }}>{notes.length}/500</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: COLORS.error + '15' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.error }} />
            <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onBack} disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: COLORS.surfaceSubtle || COLORS.primary + '08', color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` }}>
            Volver
          </button>
          <button onClick={onCreate} disabled={selectedCount === 0 || loading}
            className="flex-1 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:shadow-md flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.primary }}>
            {loading ? <><Spinner size="sm" /> Creando...</> : 'Crear Período'}
          </button>
        </div>
      </div>

      {showBulkEdit && (
        <BulkEditModal
          COLORS={COLORS}
          selectedCount={selectedCount}
          field={bulkEditField}
          value={bulkEditValue}
          onFieldChange={onBulkEditFieldChange}
          onValueChange={onBulkEditValueChange}
          onCancel={onCancelBulkEdit}
          onApply={onApplyBulkEdit}
        />
      )}
    </div>
  )
}
