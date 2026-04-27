'use client'

import { useState } from 'react'
import { Calendar, Plus, X, CalendarOff } from 'lucide-react'
import { createSpaOverride, deleteSpaOverride } from '@/actions/availability/spaOverrideActions'
import type { SpaOverride } from '@/types/availability'

interface GlobalOverridesSectionProps {
  organizationId: string
  overrides: SpaOverride[]
}

export function GlobalOverridesSection({
  organizationId,
  overrides,
}: GlobalOverridesSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [formData, setFormData] = useState({
    date: '',
    is_day_off: true,
    start_time: '',
    end_time: '',
    reason: '',
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)

    const result = await createSpaOverride(organizationId, {
      date: formData.date,
      is_day_off: formData.is_day_off,
      start_time: formData.is_day_off ? null : formData.start_time || null,
      end_time: formData.is_day_off ? null : formData.end_time || null,
      reason: formData.reason || null,
    })

    setIsCreating(false)
    if (result.success) {
      setShowForm(false)
      setFormData({ date: '', is_day_off: true, start_time: '', end_time: '', reason: '' })
    }
  }

  async function handleDelete(overrideId: string) {
    if (!confirm('¿Eliminar este día especial?')) return
    setIsDeleting(overrideId)

    await deleteSpaOverride(overrideId)

    setIsDeleting(null)
  }

  return (
    <section className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-50">
            Días Especiales
          </h2>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 text-[#0F4C5C] dark:text-[#38BDF8] font-medium text-sm hover:bg-[#0F4C5C]/20 dark:hover:bg-[#38BDF8]/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Agregar día
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Fecha
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Razón (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Mantenimiento, Feriado"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_day_off}
                onChange={(e) => setFormData({ ...formData, is_day_off: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-[#0F4C5C] focus:ring-[#0F4C5C]"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Día completo (spa cerrado)
              </span>
            </label>
          </div>

          {!formData.is_day_off && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Desde
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Hasta
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F4C5C] dark:bg-[#38BDF8] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-70 cursor-pointer"
            >
              {isCreating ? 'Creando...' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {overrides.length === 0 ? (
        <div className="text-center py-8">
          <CalendarOff className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No hay días especiales configurados.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {overrides.map((override) => (
            <div
              key={override.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  override.is_day_off
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-amber-100 dark:bg-amber-900/30'
                }`}>
                  {override.is_day_off ? (
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {new Date(override.date + 'T00:00:00').toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {override.is_day_off
                      ? 'Día completo'
                      : `${override.start_time} - ${override.end_time}`
                    }
                    {override.reason && ` • ${override.reason}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(override.id)}
                disabled={isDeleting === override.id}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Eliminar día especial"
              >
                {isDeleting === override.id ? (
                  <span className="animate-spin w-4 h-4 border border-red-500 border-t-transparent rounded-full" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}