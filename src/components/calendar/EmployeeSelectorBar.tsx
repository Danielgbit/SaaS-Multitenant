'use client'

import React, { useMemo } from 'react'
import { Users } from 'lucide-react'
import { EmployeeChip } from './EmployeeChip'
import { OverflowDropdown } from './OverflowDropdown'
import type { EmployeeWithWorkload, EmployeeFilter, CalendarColors } from '@/types/calendar'

interface EmployeeSelectorBarProps {
  employees: EmployeeWithWorkload[]
  selectedEmployeeId: EmployeeFilter
  onSelect: (employeeId: EmployeeFilter) => void
  totalAppointments: number
  COLORS: CalendarColors
  visibleCount?: number
}

export function EmployeeSelectorBar({
  employees,
  selectedEmployeeId,
  onSelect,
  totalAppointments,
  COLORS,
  visibleCount = 5
}: EmployeeSelectorBarProps) {
  const sortedEmployees = useMemo(
    () => [...employees].sort((a, b) => b.weeklyCount - a.weeklyCount),
    [employees]
  )

  const visibleEmployees = sortedEmployees.slice(0, visibleCount)
  const overflowEmployees = sortedEmployees.slice(visibleCount)

  const isAllSelected = selectedEmployeeId === 'all'

  return (
    <div
      className="w-full overflow-x-auto scrollbar-hide"
      style={{
        backgroundColor: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3 min-w-max">
        <button
          onClick={() => onSelect('all')}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          `}
          style={{
            backgroundColor: isAllSelected
              ? `${COLORS.primary}15`
              : COLORS.surfaceSubtle,
            border: `2px solid ${isAllSelected ? COLORS.primary : COLORS.border}`,
            boxShadow: isAllSelected
              ? `0 0 0 3px ${COLORS.primary}20`
              : '0 2px 4px rgba(0,0,0,0.04)',
          }}
          aria-label={`Mostrar todas las citas, ${totalAppointments} total`}
          aria-checked={isAllSelected}
          role="radio"
        >
          <Users
            className="w-4 h-4"
            style={{ color: isAllSelected ? COLORS.primary : COLORS.textMuted }}
          />
          <span
            className="font-semibold whitespace-nowrap"
            style={{
              color: COLORS.textPrimary,
              fontSize: 14,
            }}
          >
            Todos
          </span>
          <span
            className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: isAllSelected
                ? `${COLORS.primary}20`
                : COLORS.surfaceHover,
              color: isAllSelected ? COLORS.primary : COLORS.textSecondary,
              fontSize: 12,
            }}
          >
            {totalAppointments}
          </span>
        </button>

        <div
          className="w-px h-8"
          style={{ backgroundColor: COLORS.border }}
        />

        <div className="flex items-center gap-2">
          {visibleEmployees.map(employee => (
            <EmployeeChip
              key={employee.id}
              employee={employee}
              isSelected={selectedEmployeeId === employee.id}
              onClick={() => onSelect(employee.id)}
              variant="full"
              COLORS={COLORS}
            />
          ))}

          {overflowEmployees.length > 0 && (
            <OverflowDropdown
              employees={overflowEmployees}
              selectedEmployeeId={selectedEmployeeId}
              onSelect={onSelect}
              COLORS={COLORS}
            />
          )}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
