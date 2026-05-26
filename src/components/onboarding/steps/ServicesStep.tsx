'use client'

import { useState, useTransition } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Scissors, Plus, Trash2 } from 'lucide-react'
import { createService } from '@/actions/services/createService'

interface Props {
  orgId: string
  onNext: () => void
  onSkip: () => void
}

type ServiceEntry = {
  name: string
  duration: number
  price: string
}

function emptyService(): ServiceEntry {
  return { name: '', duration: 30, price: '' }
}

export function ServicesStep({ orgId, onNext, onSkip }: Props) {
  const colors = useThemeColors()
  const [services, setServices] = useState<ServiceEntry[]>([emptyService()])
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const updateService = (idx: number, field: keyof ServiceEntry, value: string | number) => {
    setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)))
  }

  const addService = () => setServices((prev) => [...prev, emptyService()])
  const removeService = (idx: number) => {
    if (services.length > 1) setServices((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const valid = services.filter((s) => s.name.trim())
    if (valid.length === 0) {
      setError('Agrega al menos un servicio')
      return
    }

    startTransition(async () => {
      for (const s of valid) {
        const result = await createService({
          name: s.name.trim(),
          duration: s.duration,
          price: parseFloat(s.price) || 0,
        })
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
          <Scissors className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Tus servicios</h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>Agrega los servicios que ofreces</p>
        </div>
      </div>

      <div className="space-y-3">
        {services.map((svc, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl"
            style={{ background: colors.surfaceSubtle, border: `1px solid ${colors.border}` }}
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>Nombre</label>
                <input
                  type="text"
                  value={svc.name}
                  onChange={(e) => updateService(idx, 'name', e.target.value)}
                  placeholder="Ej: Corte de cabello"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>Duración (min)</label>
                <select
                  value={svc.duration}
                  onChange={(e) => updateService(idx, 'duration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                >
                  {[15, 30, 45, 60, 90, 120].map((m) => (
                    <option key={m} value={m}>{m} min</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium mb-1 block" style={{ color: colors.textSecondary }}>Precio (COP)</label>
                  <input
                    type="number"
                    value={svc.price}
                    onChange={(e) => updateService(idx, 'price', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                    min={0}
                  />
                </div>
                {services.length > 1 && (
                  <button type="button" onClick={() => removeService(idx)} className="p-2 rounded-lg transition-all" style={{ color: colors.textMuted }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addService}
        className="flex items-center gap-2 text-sm mt-3 px-4 py-2 rounded-xl transition-all"
        style={{ color: colors.primary }}
      >
        <Plus className="w-4 h-4" /> Agregar otro servicio
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
