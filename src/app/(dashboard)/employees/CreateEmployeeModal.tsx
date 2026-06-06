'use client'

import { useState, useTransition } from 'react'
import { UserPlus, Phone, AlertTriangle, RotateCcw } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { createEmployee } from '@/actions/employees/createEmployee'
import { toggleEmployeeStatus } from '@/actions/employees/toggleEmployeeStatus'
import { validateEmployeeFields } from '@/components/employees/utils/validation'
import type { Employee } from '@/types/employees'

interface CreateEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FormState {
  success: boolean
  error?: string
  duplicateEmployee?: Employee
}

export function CreateEmployeeModal({ isOpen, onClose }: CreateEmployeeModalProps) {
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<FormState>({ success: false })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const showDuplicateWarning = !!state.duplicateEmployee

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errors = validateEmployeeFields(name, phone)
    setFieldErrors(errors)
    setTouched({ name: true, phone: true })
    if (Object.keys(errors).length > 0) return
    startTransition(async () => {
      const result = await createEmployee({ name: name.trim(), phone: phone.trim() || null })
      setState(result)
      if (result.success && !result.error) onClose()
    })
  }

  function handleReactivate() {
    if (!state.duplicateEmployee) return
    startTransition(async () => {
      await toggleEmployeeStatus(state.duplicateEmployee!.id, true)
      onClose()
    })
  }

  function handleClose() {
    setState({ success: false }); setFieldErrors({}); setTouched({}); setName(''); setPhone(''); onClose()
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo Profesional"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => {}} loading={isPending} type="submit" form="create-employee-form">
            Agregar profesional
          </Button>
        </>
      }>
      <form id="create-employee-form" onSubmit={handleSubmit} className="space-y-5">
        {showDuplicateWarning && state.duplicateEmployee && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Este número ya está registrado</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {state.duplicateEmployee.name} ({state.duplicateEmployee.active ? 'Activo' : 'Dado de baja'})
                </p>
                {state.duplicateEmployee.active === false && (
                  <button type="button" onClick={handleReactivate} disabled={isPending}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-800/50 dark:hover:bg-amber-800 text-amber-800 dark:text-amber-200 text-sm font-medium transition-colors disabled:opacity-50">
                    <RotateCcw className="w-4 h-4" /> Reactivar empleado
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {state.error && !state.duplicateEmployee && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 flex items-start gap-3">
            <span className="text-red-600 dark:text-red-400 mt-0.5">⚠️</span>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{state.error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="create-employee-name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input id="create-employee-name" type="text" required value={name}
            onChange={(e) => { setName(e.target.value); clearFieldError('name') }}
            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
            placeholder="Ej. María Pérez"
            className={`w-full px-4 min-h-[48px] rounded-xl border text-base focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all duration-200 ${
              touched.name && fieldErrors.name ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
            } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`} />
          {touched.name && fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="create-employee-phone" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
            <span>Teléfono de contacto</span>
            <span className="text-xs font-normal text-slate-400">Opcional</span>
          </label>
          <input id="create-employee-phone" type="tel" value={phone}
            onChange={(e) => { setPhone(e.target.value); clearFieldError('phone') }}
            onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
            placeholder="+57 300 123 4567"
            className={`w-full px-4 min-h-[48px] rounded-xl border text-base focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] transition-all duration-200 ${
              touched.phone && fieldErrors.phone ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
            } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`} />
          {touched.phone && fieldErrors.phone && <p className="text-xs text-red-500">{fieldErrors.phone}</p>}
          <p className="text-xs text-slate-500 dark:text-slate-400">Útil para notificaciones de WhatsApp.</p>
        </div>
      </form>
    </Modal>
  )
}
