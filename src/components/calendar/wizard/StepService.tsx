'use client'

import { Search, Sparkles, X } from 'lucide-react'
import type { CalendarColors, Service } from '@/types/calendar'
import { formatDuration } from '@/lib/utils/formatTime'

interface StepServiceProps {
  COLORS: CalendarColors
  serviceSearch: string
  showServiceDropdown: boolean
  selectedService: Service | undefined
  services: Service[]
  onSetServiceSearch: (search: string) => void
  onSetShowServiceDropdown: (show: boolean) => void
  onSelect: (service: Service) => void
  onClear: () => void
}

export function StepService({
  COLORS,
  serviceSearch,
  showServiceDropdown,
  selectedService,
  services,
  onSetServiceSearch,
  onSetShowServiceDropdown,
  onSelect,
  onClear,
}: StepServiceProps) {
  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-in slide-in-from-right-2 duration-200">
      <div className="text-center">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: COLORS.primary + '15' }}
        >
          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: COLORS.primary }} />
        </div>
        <h4
          className="text-lg sm:text-xl font-semibold mb-1 font-heading"
          style={{ color: COLORS.textPrimary }}
        >
          ¿Qué servicio?
        </h4>
        <p className="text-xs sm:text-sm" style={{ color: COLORS.textSecondary }}>
          Selecciona el tratamiento o servicio
        </p>
      </div>

      <div className="relative">
        <label
          className="block text-sm font-medium mb-2 flex items-center gap-2"
          style={{ color: COLORS.textPrimary }}
        >
          <Search className="w-4 h-4" />
          Servicio
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar servicio..."
            value={serviceSearch}
            onChange={e => { onSetServiceSearch(e.target.value); onSetShowServiceDropdown(true) }}
            onFocus={() => onSetShowServiceDropdown(true)}
            className="w-full px-4 py-3 sm:py-3.5 pl-11 rounded-xl border-2 transition-all duration-200 focus:outline-none"
            style={{
              borderColor: showServiceDropdown ? COLORS.primary : COLORS.border,
              backgroundColor: COLORS.surface,
              color: COLORS.textPrimary,
              boxShadow: showServiceDropdown ? `0 0 0 3px ${COLORS.primary}20` : 'none'
            }}
          />
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.textMuted }} />
        </div>

        {showServiceDropdown && (
          <div
            className="mt-2 rounded-xl border-2 overflow-hidden shadow-xl max-h-64 overflow-y-auto"
            style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
          >
            {filteredServices.map(s => (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className="w-full px-4 py-3 sm:py-3.5 text-left flex items-center justify-between gap-3 transition-colors hover:bg-black/5"
                style={{ color: COLORS.textPrimary }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: COLORS.primary + '15' }}
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: COLORS.primary }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{s.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                      {formatDuration(s.duration)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                    ${new Intl.NumberFormat('es-CO').format(s.price)}
                  </span>
                  <span
                    className="text-xs px-2 py-1 rounded-lg whitespace-nowrap"
                    style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}
                  >
                    {formatDuration(s.duration)}
                  </span>
                </div>
              </button>
            ))}
            {filteredServices.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.textMuted }} />
                <p className="text-sm" style={{ color: COLORS.textMuted }}>No se encontraron servicios</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedService && !showServiceDropdown && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border-2"
          style={{ borderColor: COLORS.primary + '30', backgroundColor: COLORS.primary + '08' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
            <Sparkles className="w-4 h-4" style={{ color: COLORS.primary }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: COLORS.textPrimary }}>{selectedService.name}</p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>
              {formatDuration(selectedService.duration)} &middot; ${new Intl.NumberFormat('es-CO').format(selectedService.price)}
            </p>
          </div>
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" style={{ color: COLORS.textMuted }} />
          </button>
        </div>
      )}
    </div>
  )
}
