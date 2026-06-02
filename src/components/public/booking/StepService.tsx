'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { formatDuration } from '@/lib/utils/formatTime'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import type { ThemeColors } from '@/hooks/useThemeColors'

interface Service { id: string; name: string; duration: number; price: number }

export function StepService({ services, selectedService, onSelect, colors }: {
  services: Service[]
  selectedService: Service | null
  onSelect: (service: Service) => void
  colors: ThemeColors
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 flex items-center justify-center" style={{ borderRadius: colors.radius.sm, backgroundColor: colors.primary + '15' }}>
          <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
        </div>
        <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
          ¿Qué servicio necesitas?
        </h2>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: colors.textMuted }} />
          <p className="text-sm" style={{ color: colors.textSecondary }}>No hay servicios disponibles</p>
        </div>
      ) : (
        <div className="space-y-6">
          {services.map(service => {
            const isSelected = selectedService?.id === service.id
            const isHovered = hoveredId === service.id
            return (
              <button
                key={service.id}
                onClick={() => onSelect(service)}
                onMouseEnter={() => setHoveredId(service.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="w-full p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  borderRadius: colors.radius.sm,
                  backgroundColor: isSelected ? colors.primary + '10' : colors.surfaceSubtle,
                  border: `1px solid ${isSelected ? colors.primary : colors.border}`,
                  boxShadow: isHovered && !isSelected ? colors.shadow.tealSm : 'none',
                  transition: colors.transition,
                  ['--tw-ring-color' as string]: colors.borderFocus,
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium" style={{ color: colors.textPrimary }}>{service.name}</h3>
                    <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                      {formatDuration(service.duration)}
                    </p>
                  </div>
                  <span className="font-semibold" style={{ color: colors.primary }}>
                    {formatCurrencyCOP(service.price)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
