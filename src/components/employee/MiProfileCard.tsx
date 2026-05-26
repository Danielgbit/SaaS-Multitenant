'use client'

import { useState, useTransition } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { User, Pencil, X, Check } from 'lucide-react'

interface Props {
  employee: Record<string, any>
}

export function MiProfileCard({ employee }: Props) {
  const colors = useThemeColors()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(employee.name || '')
  const [phone, setPhone] = useState(employee.phone || '')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const handleSave = () => {
    if (!name.trim()) { setError('El nombre es requerido'); return }
    setError('')

    startTransition(async () => {
      const { updateMyProfile } = await import('@/actions/employee/updateMyProfile')
      const result = await updateMyProfile({ name: name.trim(), phone: phone.trim() || null })
      if (result.error) {
        setError(result.error)
      } else {
        setEditing(false)
      }
    })
  }

  const handleCancel = () => {
    setName(employee.name || '')
    setPhone(employee.phone || '')
    setError('')
    setEditing(false)
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: colors.primarySubtle, color: colors.primary }}
          >
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Mi Perfil</h3>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              {employee.active ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="p-2 rounded-lg transition-all"
            style={{ color: colors.textMuted }}
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: colors.surfaceSubtle, border: `1px solid ${error ? colors.error : colors.border}`, color: colors.textPrimary }}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+57 300 123 4567"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: colors.surfaceSubtle, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
            />
          </div>
          {error && <p className="text-xs" style={{ color: colors.error }}>{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ color: colors.textSecondary }}
            >
              <X className="w-4 h-4 inline mr-1" />Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={pending}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
              style={{ background: colors.primary, opacity: pending ? 0.6 : 1 }}
            >
              <Check className="w-4 h-4 inline mr-1" />{pending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1 text-sm" style={{ color: colors.textSecondary }}>
          <p><span className="font-medium" style={{ color: colors.textPrimary }}>Nombre:</span> {employee.name}</p>
          <p><span className="font-medium" style={{ color: colors.textPrimary }}>Teléfono:</span> {employee.phone || '—'}</p>
        </div>
      )}
    </div>
  )
}
