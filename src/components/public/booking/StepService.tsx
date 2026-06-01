'use client'

import { Scissors } from 'lucide-react'
import { formatDuration } from '@/lib/utils/formatTime'

interface Service { id: string; name: string; duration: number; price: number }
interface BookingColors {
  primary: string; primaryLight: string; surface: string; surfaceSubtle: string
  border: string; borderLight: string; textPrimary: string; textSecondary: string
  textMuted: string; success: string; successLight: string; warning: string
  warningLight: string; error: string; errorLight: string
}

export function StepService({ services, selectedService, onSelect, colors }: {
  services: Service[]
  selectedService: Service | null
  onSelect: (service: Service) => void
  colors: BookingColors
}) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
          <Scissors className="w-5 h-5" style={{ color: colors.primary }} />
        </div>
        <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
          ¿Qué servicio necesitas?
        </h2>
      </div>

      <div className="space-y-3">
        {services.map(service => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className="w-full p-4 rounded-2xl text-left transition-all hover:scale-[1.01]"
            style={{ 
              backgroundColor: selectedService?.id === service.id ? colors.primary + '10' : colors.surfaceSubtle,
              border: `1px solid ${selectedService?.id === service.id ? colors.primary : colors.border}`
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium" style={{ color: colors.textPrimary }}>{service.name}</h3>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  {formatDuration(service.duration)}
                </p>
              </div>
              <span className="font-semibold" style={{ color: colors.primary }}>
                {formatPrice(service.price)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price)
}
