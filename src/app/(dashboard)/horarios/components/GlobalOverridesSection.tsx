'use client'

import { useState } from 'react'
import { Calendar, Plus, X, CalendarOff, AlertCircle } from 'lucide-react'
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
    <section className="mb-8 p-5 sm:p-6 bg-slate-800/80 rounded-2xl border border-slate-700/50 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0EA5E9] flex items-center justify-center shadow-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-semibold text-white">
              Días Especiales
            </h2>
            <p className="text-sm text-slate-400 hidden sm:block">
              Excepciones al horario habitual (feriados, mantenimiento)
            </p>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] font-medium text-sm hover:bg-[#38BDF8]/20 transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Agregar día
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-5 p-4 bg-slate-700/50 rounded-xl border border-slate-600/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fecha
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-600/50 bg-slate-700/50 text-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8]
                           transition-all duration-200 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Razón (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Mantenimiento, Feriado"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-600/50 bg-slate-700/50 text-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8]
                           placeholder:text-slate-500 transition-all duration-200 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_day_off}
                onChange={(e) => setFormData({ ...formData, is_day_off: e.target.checked })}
                className="w-4 h-4 rounded border-slate-500 text-[#38BDF8] focus:ring-[#38BDF8]/40 bg-slate-700 cursor-pointer"
              />
              <span className="text-sm text-slate-300">
                Día completo (spa cerrado)
              </span>
            </label>
          </div>

          {!formData.is_day_off && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Desde
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-600/50 bg-slate-700/50 text-white text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8]
                             transition-all duration-200 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hasta
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-600/50 bg-slate-700/50 text-white text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8]
                             transition-all duration-200 cursor-pointer"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#38BDF8] text-white font-medium text-sm hover:bg-[#38BDF8]/90 transition-all duration-200 disabled:opacity-60 cursor-pointer"
            >
              {isCreating ? 'Creando...' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-600/50 text-slate-300 font-medium text-sm hover:bg-slate-700/50 transition-all duration-200 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Empty State - Educational */}
      {!showForm && overrides.length === 0 && (
        <div className="p-6 bg-slate-700/30 rounded-xl border border-slate-600/20">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600/40 to-slate-700/40 backdrop-blur-sm flex items-center justify-center">
              <CalendarOff className="w-8 h-8 text-slate-400" />
            </div>
          </div>

          {/* Question */}
          <h3 className="text-lg font-semibold text-white text-center mb-3">
            ¿Qué son los días especiales?
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-300 text-center leading-relaxed mb-5">
            Son fechas donde el spa tiene horarios diferentes a los habituales.
            Útiles para:
          </p>

          {/* Examples */}
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            <span className="px-3 py-1.5 rounded-full bg-slate-600/30 text-slate-300 text-xs">
              Feriados
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-600/30 text-slate-300 text-xs">
              Mantenimiento
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-600/30 text-slate-300 text-xs">
              Eventos
            </span>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#38BDF8] text-white font-medium hover:bg-[#38BDF8]/90 hover:shadow-lg hover:shadow-[#38BDF8]/20 transition-all duration-200 cursor-pointer mb-4"
          >
            <Plus className="w-4 h-4" />
            Crear mi primer día especial
          </button>

          {/* Learn More Link */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>¿No sabes qué es esto?</span>
            <a
              href="/help/special-days"
              className="text-[#38BDF8] hover:underline ml-1"
            >
              Aprende cómo funcionan →
            </a>
          </div>
        </div>
      )}

      {/* Overrides List */}
      {!showForm && overrides.length > 0 && (
        <div className="space-y-2">
          {overrides.map((override) => (
            <div
              key={override.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                override.is_day_off
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  override.is_day_off
                    ? 'bg-red-500/20'
                    : 'bg-amber-500/20'
                }`}>
                  {override.is_day_off ? (
                    <X className="w-4 h-4 text-red-400" />
                  ) : (
                    <Calendar className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white text-sm">
                    {new Date(override.date + 'T00:00:00').toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {override.is_day_off
                      ? 'Día completo cerrado'
                      : `${override.start_time} - ${override.end_time}`
                    }
                    {override.reason && ` · ${override.reason}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(override.id)}
                disabled={isDeleting === override.id}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
                aria-label="Eliminar día especial"
              >
                {isDeleting === override.id ? (
                  <span className="animate-spin w-4 h-4 border border-red-400 border-t-transparent rounded-full" />
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