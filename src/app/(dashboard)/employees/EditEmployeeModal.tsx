'use client'

import { useState, useTransition } from 'react'
import { PencilLine, Phone, AlertTriangle } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { updateEmployee } from '@/actions/employees/updateEmployee'
import { validateEmployeeFields } from '@/components/employees/utils/validation'
import type { Employee } from '@/types/employees'

interface EditEmployeeModalProps {
  employee: Employee | null
  onClose: () => void
  onDelete?: (employee: Employee) => void
}

export function EditEmployeeModal({ employee, onClose, onDelete }: EditEmployeeModalProps) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(employee?.name ?? '')
  const [phone, setPhone] = useState(employee?.phone ?? '')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  if (!employee) return null

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    const errors = validateEmployeeFields(name, phone)
    setFieldErrors(errors); setTouched({ name: true, phone: true })
    if (Object.keys(errors).length > 0) return
    startTransition(async () => {
      const result = await updateEmployee({ id: employee!.id, name: name.trim(), phone: phone.trim() || null })
      if (!result.error) onClose(); else setError(result.error)
    })
  }

  return (
    <Modal isOpen={!!employee} onClose={onClose} title="Editar Profesional"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          <Button variant="primary" onClick={() => {}} loading={isPending} type="submit" form="edit-employee-form">
            Guardar cambios
          </Button>
        </>
      }>
      <form id="edit-employee-form" onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="edit-employee-name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input id="edit-employee-name" type="text" required value={name}
            onChange={(e) => { setName(e.target.value); clearFieldError('name') }}
            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
            className={`w-full px-4 min-h-[48px] rounded-xl border text-base focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all ${
              touched.name && fieldErrors.name ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
            } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`} />
          {touched.name && fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-employee-phone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Teléfono de contacto <span className="text-xs font-normal text-slate-400">Opcional</span>
          </label>
          <input id="edit-employee-phone" type="tel" value={phone ?? ''}
            onChange={(e) => { setPhone(e.target.value); clearFieldError('phone') }}
            onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
            className={`w-full px-4 min-h-[48px] rounded-xl border text-base focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all ${
              touched.phone && fieldErrors.phone ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
            } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`} />
          {touched.phone && fieldErrors.phone && <p className="text-xs text-red-500">{fieldErrors.phone}</p>}
        </div>

        {onDelete && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-200 dark:border-red-800/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">Zona de peligro</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 mb-3">
                    Esta acción archivará al empleado. Podrás reactivarlo más adelante.
                  </p>
                  <Button variant="danger" size="sm" onClick={() => onDelete(employee)}>
                    Archivar empleado
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
