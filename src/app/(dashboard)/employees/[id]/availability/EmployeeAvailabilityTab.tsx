'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarClock, Clock } from 'lucide-react'
import { WeekGrid } from '@/components/availability/WeekGrid'
import { AvailabilityForm } from './AvailabilityForm'
import { OverridesSection } from './OverridesSection'
import { deleteAvailability } from '@/actions/availability/deleteAvailability'
import type { EmployeeAvailability } from '@/types/availability'

interface Override {
  id: string
  employee_id: string
  date: string
  start_time: string | null
  end_time: string | null
  is_day_off: boolean
  reason: string | null
  created_at: string
}

interface Props {
  employeeId: string
  employeeName: string
  availability: EmployeeAvailability[]
  overrides: Override[]
}

export function EmployeeAvailabilityTab({ employeeId, employeeName, availability, overrides }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [preselectedDay, setPreselectedDay] = useState<number | null>(null)
  const [editItem, setEditItem] = useState<EmployeeAvailability | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleAdd(dayOfWeek: number) {
    setEditItem(null)
    setPreselectedDay(dayOfWeek)
  }

  function handleEdit(item: EmployeeAvailability) {
    setPreselectedDay(null)
    setEditItem(item)
  }

  function handleCancel() {
    setEditItem(null)
    setPreselectedDay(null)
  }

  function handleFormSuccess() {
    setEditItem(null)
    setPreselectedDay(null)
  }

  async function handleDelete(availabilityId: string) {
    setDeletingId(availabilityId)

    startTransition(async () => {
      const result = await deleteAvailability(availabilityId, employeeId)
      setDeletingId(null)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Horario eliminado')
        if (editItem?.id === availabilityId) {
          setEditItem(null)
        }
        router.refresh()
      }
    })
  }

  const showForm = editItem !== null || preselectedDay !== null

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
          <CalendarClock className="w-4 h-4 text-[#0F4C5C] dark:text-[#38BDF8]" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            <strong className="text-slate-800 dark:text-slate-200">{availability.length}</strong>/7 días
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
          <Clock className="w-4 h-4 text-[#0F4C5C] dark:text-[#38BDF8]" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            <strong className="text-slate-800 dark:text-slate-200">{overrides.length}</strong> excepciones
          </span>
        </div>
      </div>

      {/* Week Grid */}
      <WeekGrid
        availability={availability}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      {/* Inline form */}
      <div className={`
        bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden transition-all duration-300
        ${showForm ? 'opacity-100 max-h-[600px]' : 'opacity-0 max-h-0 overflow-hidden border-0 shadow-none'}
      `}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
          <h2 className="text-lg font-display font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            {editItem ? 'Editar horario' : 'Agregar horario'}
          </h2>
        </div>
        <div className="p-6">
          <AvailabilityForm
            employeeId={employeeId}
            existingAvailability={availability}
            preselectedDay={preselectedDay}
            editItem={editItem}
            onCancel={handleCancel}
            onSuccess={handleFormSuccess}
          />
        </div>
      </div>

      {/* Prompt when no day is selected */}
      {!showForm && availability.length === 0 && (
        <div className="text-center py-8 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
          <CalendarClock className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Selecciona un día en el calendario para configurar el horario de {employeeName}
          </p>
        </div>
      )}

      {/* Overrides */}
      <OverridesSection
        employeeId={employeeId}
        overrides={overrides}
        employeeName={employeeName}
      />
    </div>
  )
}
