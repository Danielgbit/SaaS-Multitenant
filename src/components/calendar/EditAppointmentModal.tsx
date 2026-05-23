'use client'

import { X, AlertTriangle } from 'lucide-react'
import { Spinner } from '@/components/ui'
import type { Employee, Client, Service, TimeSlot } from '@/types/calendar'
import type { CalendarColors } from '@/types/calendar'

interface EditData {
  clientId: string
  serviceId: string
  employeeId: string
  date: string
  time: string
  notes: string
}

interface EditSearch {
  client: string
  service: string
  employee: string
}

interface ShowEditDropdowns {
  client: boolean
  service: boolean
  employee: boolean
}

interface EditAppointmentModalProps {
  isEditing: boolean
  editData: EditData
  editSearch: EditSearch
  showEditDropdowns: ShowEditDropdowns
  editSlots: TimeSlot[]
  loadingEditSlots: boolean
  showTimeWarning: boolean
  isSavingEdit: boolean
  clients: Client[]
  services: Service[]
  employees: Employee[]
  COLORS: CalendarColors
  formatTime: (s: string) => string
  onClose: () => void
  onSetEditData: (data: Partial<EditData>) => void
  onSetEditSearch: (search: Partial<EditSearch>) => void
  onSetShowEditDropdowns: (d: Partial<ShowEditDropdowns>) => void
  onFetchEditSlots: () => void
  onSave: () => void
}

export function EditAppointmentModal({
  isEditing, editData, editSearch, showEditDropdowns, editSlots,
  loadingEditSlots, showTimeWarning, isSavingEdit,
  clients, services, employees, COLORS, formatTime,
  onClose, onSetEditData, onSetEditSearch, onSetShowEditDropdowns,
  onFetchEditSlots, onSave,
}: EditAppointmentModalProps) {
  if (!isEditing) return null

  const canSave = editData.clientId && editData.serviceId && editData.employeeId && editData.time

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,43,50,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: COLORS.surface, boxShadow: '0 24px 48px rgba(15,76,92,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4" style={{ backgroundColor: COLORS.primary, color: '#FFF' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Editar Cita</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <SearchableSelect
            label="Cliente"
            value={editSearch.client}
            items={clients}
            getLabel={c => c.name}
            isOpen={showEditDropdowns.client}
            onChange={v => onSetEditSearch({ client: v })}
            onToggle={v => onSetShowEditDropdowns({ client: v })}
            onSelect={item => {
              onSetEditData({ clientId: item.id })
              onSetEditSearch({ client: item.name })
              onSetShowEditDropdowns({ client: false })
            }}
            COLORS={COLORS}
          />

          <SearchableSelect
            label="Servicio"
            value={editSearch.service}
            items={services}
            getLabel={s => `${s.name} (${s.duration} min)`}
            isOpen={showEditDropdowns.service}
            onChange={v => onSetEditSearch({ service: v })}
            onToggle={v => onSetShowEditDropdowns({ service: v })}
            onSelect={item => {
              onSetEditData({ serviceId: item.id, time: '' })
              onSetEditSearch({ service: item.name })
              onSetShowEditDropdowns({ service: false })
            }}
            COLORS={COLORS}
          />

          <SearchableSelect
            label="Profesional"
            value={editSearch.employee}
            items={employees}
            getLabel={e => e.name}
            isOpen={showEditDropdowns.employee}
            onChange={v => onSetEditSearch({ employee: v })}
            onToggle={v => onSetShowEditDropdowns({ employee: v })}
            onSelect={item => {
              onSetEditData({ employeeId: item.id, time: '' })
              onSetEditSearch({ employee: item.name })
              onSetShowEditDropdowns({ employee: false })
            }}
            COLORS={COLORS}
          />

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>Fecha</label>
            <input
              type="date"
              value={editData.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => { onSetEditData({ date: e.target.value, time: '' }) }}
              className="w-full px-4 py-3 rounded-xl border"
              style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
            />
          </div>

          {editData.date && editData.employeeId && editData.serviceId && (
            <div>
              {!loadingEditSlots && editSlots.length === 0 && (
                <button onClick={onFetchEditSlots}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: COLORS.primary, color: '#FFF' }}>
                  Ver horarios
                </button>
              )}
              {loadingEditSlots && (
                <div className="flex justify-center py-4">
                  <Spinner size="md" style={{ color: COLORS.primary }} />
                </div>
              )}
              {editSlots.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {editSlots.map(s => {
                    const isAvail = s.available
                    const isSel = editData.time === formatTime(s.start_time)
                    const br = (s as any).blockedReason
                    if (!isAvail) {
                      return (
                        <div key={s.start_time}
                          className="px-2 py-2 rounded-lg text-xs text-center opacity-50 cursor-not-allowed"
                          style={{ backgroundColor: COLORS.surfaceHover, color: COLORS.textMuted }}
                          title={br}>
                          {formatTime(s.start_time)}<br />
                          {br && <span className="text-[10px]" style={{ color: COLORS.warning }}>{br}</span>}
                        </div>
                      )
                    }
                    return (
                      <button key={s.start_time}
                        onClick={() => onSetEditData({ time: formatTime(s.start_time) })}
                        className={`px-2 py-2 rounded-lg text-sm ${isSel ? 'ring-2' : ''}`}
                        style={{ backgroundColor: isSel ? COLORS.primary : COLORS.surfaceSubtle, color: isSel ? '#FFF' : COLORS.textPrimary }}>
                        {formatTime(s.start_time)}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>Notas</label>
            <textarea
              value={editData.notes}
              onChange={e => onSetEditData({ notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border"
              rows={2}
              style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
            />
          </div>
          {showTimeWarning && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.warningLight }}>
              <p className="text-sm font-medium" style={{ color: COLORS.warning }}>
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                El horario cambió. ¿Continuar?
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex justify-between sticky bottom-0" style={{ borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface }}>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle }}>
            Cancelar
          </button>
          <button onClick={onSave} disabled={!canSave || isSavingEdit}
            className="px-6 py-2.5 rounded-xl text-sm font-medium"
            style={{
              backgroundColor: COLORS.primary, color: '#FFF',
              opacity: (!canSave || isSavingEdit) ? 0.5 : 1,
            }}>
            {isSavingEdit ? <><Spinner size="sm" className="inline" /> Guardando...</> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SearchableSelect - reusable dropdown selector
// =============================================================================

interface SearchableSelectProps<T> {
  label: string
  value: string
  items: T[]
  getLabel: (item: T) => string
  isOpen: boolean
  onChange: (value: string) => void
  onToggle: (open: boolean) => void
  onSelect: (item: T) => void
  COLORS: CalendarColors
}

function SearchableSelect<T extends { id: string }>({
  label, value, items, getLabel, isOpen, onChange, onToggle, onSelect, COLORS
}: SearchableSelectProps<T>) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); onToggle(true) }}
        className="w-full px-4 py-3 rounded-xl border"
        style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}
      />
      {isOpen && (
        <div
          className="absolute z-20 w-full mt-2 rounded-xl border overflow-hidden max-h-48 overflow-y-auto"
          style={{ backgroundColor: COLORS.surface }}
        >
          {items
            .filter(item => getLabel(item).toLowerCase().includes(value.toLowerCase()))
            .map(item => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                style={{ color: COLORS.textPrimary }}
              >
                {getLabel(item)}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
