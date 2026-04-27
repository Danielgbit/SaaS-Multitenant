'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, CheckCircle2 } from 'lucide-react'
import type { EmployeeWithWorkload, EmployeeFilter, CalendarColors } from '@/types/calendar'

interface OverflowDropdownProps {
  employees: EmployeeWithWorkload[]
  selectedEmployeeId: EmployeeFilter
  onSelect: (employeeId: EmployeeFilter) => void
  COLORS: CalendarColors
}

export function OverflowDropdown({
  employees,
  selectedEmployeeId,
  onSelect,
  COLORS
}: OverflowDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (employeeId: string) => {
    onSelect(employeeId)
    setIsOpen(false)
    setSearchQuery('')
  }

  const getInitials = (name: string): string => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer"
        style={{
          backgroundColor: COLORS.surfaceSubtle,
          border: `2px solid ${COLORS.border}`,
          color: COLORS.textSecondary,
          fontSize: 14,
          fontWeight: 500,
        }}
        aria-label={`Mostrar ${employees.length} empleados más`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>+{employees.length}</span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 z-50 rounded-xl overflow-hidden shadow-xl border-2 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: COLORS.border,
            minWidth: 240,
            maxWidth: 280,
          }}
        >
          {employees.length > 5 && (
            <div className="p-2 border-b" style={{ borderColor: COLORS.border }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar empleado..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: COLORS.surfaceSubtle,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textPrimary,
                }}
              />
            </div>
          )}

          <div
            className="max-h-64 overflow-y-auto py-1"
            role="listbox"
            aria-label="Seleccionar empleado"
          >
            {filteredEmployees.length === 0 ? (
              <div
                className="px-4 py-6 text-center text-sm"
                style={{ color: COLORS.textMuted }}
              >
                No se encontraron empleados
              </div>
            ) : (
              filteredEmployees.map(emp => {
                const isSelected = selectedEmployeeId === emp.id
                const initials = getInitials(emp.name)

                return (
                  <button
                    key={emp.id}
                    onClick={() => handleSelect(emp.id)}
                    className="w-full px-3 py-2.5 flex items-center gap-3 transition-colors duration-150 cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? `${COLORS.primary}10` : 'transparent',
                    }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div
                      className="flex items-center justify-center rounded-full font-semibold text-white flex-shrink-0"
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: isSelected ? COLORS.primary : COLORS.primary + '80',
                        fontSize: 12,
                      }}
                    >
                      {initials}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <p
                        className="font-medium truncate"
                        style={{ color: COLORS.textPrimary, fontSize: 14 }}
                      >
                        {emp.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: COLORS.textMuted }}
                      >
                        {emp.weeklyCount} cita{emp.weeklyCount !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {isSelected && (
                      <CheckCircle2
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: COLORS.primary }}
                      />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
