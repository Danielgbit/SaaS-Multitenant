'use client'

import { useState, useTransition } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Users, Plus, Trash2 } from 'lucide-react'

interface Props {
  orgId: string
  onNext: () => void
  onSkip: () => void
}

type EmployeeEntry = {
  name: string
  email: string
}

function emptyEmployee(): EmployeeEntry {
  return { name: '', email: '' }
}

export function EmployeesStep({ orgId, onNext, onSkip }: Props) {
  const colors = useThemeColors()
  const [employees, setEmployees] = useState<EmployeeEntry[]>([emptyEmployee()])
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const updateEmployee = (idx: number, field: keyof EmployeeEntry, value: string) => {
    setEmployees((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)))
  }

  const addEmployee = () => setEmployees((prev) => [...prev, emptyEmployee()])
  const removeEmployee = (idx: number) => {
    if (employees.length > 1) setEmployees((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const valid = employees.filter((emp) => emp.name.trim())
    if (valid.length === 0) {
      setError('Agrega al menos un empleado')
      return
    }

    startTransition(async () => {
      const { createEmployee } = await import('@/actions/employees/createEmployee')

      for (const emp of valid) {
        const result = await createEmployee({ name: emp.name.trim(), phone: '' })
        if (result.error) {
          setError(result.error)
          return
        }
      }
      onNext()
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: colors.primarySubtle, color: colors.primary }}>
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Tu equipo</h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>Agrega las personas que trabajan en tu negocio</p>
        </div>
      </div>

      <div className="space-y-3">
        {employees.map((emp, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl"
            style={{ background: colors.surfaceSubtle, border: `1px solid ${colors.border}` }}
          >
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>Nombre</label>
                <input
                  type="text"
                  value={emp.name}
                  onChange={(e) => updateEmployee(idx, 'name', e.target.value)}
                  placeholder="Ej: Ana García"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>Email (opcional)</label>
                <input
                  type="email"
                  value={emp.email}
                  onChange={(e) => updateEmployee(idx, 'email', e.target.value)}
                  placeholder="ana@ejemplo.com"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                />
              </div>
              {employees.length > 1 && (
                <button type="button" onClick={() => removeEmployee(idx)} className="p-2 rounded-lg transition-all" style={{ color: colors.textMuted }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEmployee}
        className="flex items-center gap-2 text-sm mt-3 px-4 py-2 rounded-xl transition-all"
        style={{ color: colors.primary }}
      >
        <Plus className="w-4 h-4" /> Agregar otro empleado
      </button>

      {error && (
        <p className="text-xs mt-2" style={{ color: colors.error }}>{error}</p>
      )}

      <div className="flex items-center justify-between mt-6">
        <button type="button" onClick={onSkip} className="text-sm px-4 py-2 rounded-xl transition-all" style={{ color: colors.textSecondary }}>
          Saltar este paso
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all text-white"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`, opacity: pending ? 0.6 : 1 }}
        >
          {pending ? 'Guardando...' : 'Continuar'}
        </button>
      </div>
    </form>
  )
}
