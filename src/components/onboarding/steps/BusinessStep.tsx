'use client'

import { useState, useTransition } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Store } from 'lucide-react'
import { updateOrganization } from '@/actions/settings/updateOrganization'

interface Props {
  orgId: string
  onNext: () => void
  onSkip: () => void
}

export function BusinessStep({ orgId, onNext, onSkip }: Props) {
  const colors = useThemeColors()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('El nombre del negocio es requerido')
      return
    }

    startTransition(async () => {
      const result = await updateOrganization(orgId, { name: name.trim() })
      if (result.success) {
        onNext()
      } else {
        setError(result.error || 'Error al guardar')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: colors.primarySubtle, color: colors.primary }}>
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Nombre del negocio</h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>¿Cómo se llama tu empresa o spa?</p>
        </div>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Spa Relax, Barbería El Corte"
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          background: colors.surfaceSubtle,
          border: `1px solid ${error ? colors.error : colors.border}`,
          color: colors.textPrimary,
        }}
        autoFocus
      />

      {error && (
        <p className="text-xs mt-1" style={{ color: colors.error }}>{error}</p>
      )}

      <div className="flex items-center justify-between mt-8">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm px-4 py-2 rounded-xl transition-all"
          style={{ color: colors.textSecondary }}
        >
          Saltar este paso
        </button>

        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all text-white"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? 'Guardando...' : 'Continuar'}
        </button>
      </div>
    </form>
  )
}
