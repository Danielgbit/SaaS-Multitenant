'use client'

import { Search, Building2, X, ChevronRight } from 'lucide-react'
import type { CalendarColors, Employee } from '@/types/calendar'

interface StepEmployeeProps {
  COLORS: CalendarColors
  employeeSearch: string
  showEmployeeDropdown: boolean
  selectedEmployee: Employee | undefined
  employees: Employee[]
  onSetEmployeeSearch: (search: string) => void
  onSetShowEmployeeDropdown: (show: boolean) => void
  onSelect: (employee: Employee) => void
  onClear: () => void
}

export function StepEmployee({
  COLORS,
  employeeSearch,
  showEmployeeDropdown,
  selectedEmployee,
  employees,
  onSetEmployeeSearch,
  onSetShowEmployeeDropdown,
  onSelect,
  onClear,
}: StepEmployeeProps) {
  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(employeeSearch.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-in slide-in-from-right-2 duration-200">
      <div className="text-center">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: COLORS.primary + '15' }}
        >
          <Building2 className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: COLORS.primary }} />
        </div>
        <h4
          className="text-lg sm:text-xl font-semibold mb-1 font-heading"
          style={{ color: COLORS.textPrimary }}
        >
          ¿Quién lo hará?
        </h4>
        <p className="text-xs sm:text-sm" style={{ color: COLORS.textSecondary }}>
          Selecciona el profesional
        </p>
      </div>

      <div className="relative">
        <label
          className="block text-sm font-medium mb-2 flex items-center gap-2"
          style={{ color: COLORS.textPrimary }}
        >
          <Search className="w-4 h-4" />
          Profesional
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar profesional..."
            value={employeeSearch}
            onChange={e => { onSetEmployeeSearch(e.target.value); onSetShowEmployeeDropdown(true) }}
            onFocus={() => onSetShowEmployeeDropdown(true)}
            className="w-full px-4 py-3 sm:py-3.5 pl-11 rounded-xl border-2 transition-all duration-200 focus:outline-none"
            style={{
              borderColor: showEmployeeDropdown ? COLORS.primary : COLORS.border,
              backgroundColor: COLORS.surface,
              color: COLORS.textPrimary,
              boxShadow: showEmployeeDropdown ? `0 0 0 3px ${COLORS.primary}20` : 'none'
            }}
          />
          <Building2 className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.textMuted }} />
        </div>

        {showEmployeeDropdown && (
          <div
            className="mt-2 rounded-xl border-2 overflow-hidden shadow-xl max-h-64 overflow-y-auto"
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
          >
            {filteredEmployees.map(e => (
              <button
                key={e.id}
                onClick={() => onSelect(e)}
                className="w-full px-4 py-3 sm:py-3.5 text-left flex items-center gap-3 transition-colors hover:bg-black/5"
                style={{ color: COLORS.textPrimary }}
              >
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                  style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                >
                  {e.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">{e.name}</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.textMuted }} />
              </button>
            ))}
            {filteredEmployees.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Building2 className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.textMuted }} />
                <p className="text-sm" style={{ color: COLORS.textMuted }}>No se encontraron profesionales</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedEmployee && !showEmployeeDropdown && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border-2"
          style={{ borderColor: COLORS.primary + '30', backgroundColor: COLORS.primary + '08' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
            style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
          >
            {selectedEmployee.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: COLORS.textPrimary }}>{selectedEmployee.name}</p>
          </div>
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" style={{ color: COLORS.textMuted }} />
          </button>
        </div>
      )}
    </div>
  )
}
