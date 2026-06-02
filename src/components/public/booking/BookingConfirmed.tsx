'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { formatTime, formatDate as formatDateUtil } from '@/lib/utils/formatTime'
import type { ThemeColors } from '@/hooks/useThemeColors'

interface Service { id: string; name: string }
interface Employee { id: string; name: string }

export function BookingConfirmed({
  selectedService, selectedEmployee, selectedDate, selectedSlot, organizationName, colors,
  onNewBooking,
}: {
  selectedService: Service | null
  selectedEmployee: Employee | null
  selectedDate: string
  selectedSlot: string
  organizationName: string
  colors: ThemeColors
  onNewBooking: () => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.surfaceSubtle }}>
      <div
        className="max-w-md w-full"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 400ms ease, transform 400ms ease',
        }}
      >
        <div className="p-8" style={{ borderRadius: colors.radius.card, boxShadow: colors.shadow.tealMd, backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="text-center mb-8">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                backgroundColor: colors.accentTealSubtle,
                animation: 'booking-pulse 600ms ease-out'
              }}
            >
              <CheckCircle2 className="w-10 h-10" style={{ color: colors.accentTeal }} />
            </div>
            <h1 className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>¡Reserva confirmada!</h1>
            <p className="mt-2" style={{ color: colors.textSecondary }}>Tu cita ha sido agendada exitosamente</p>
          </div>

          <div
            className="p-4 mb-6"
            style={{
              borderRadius: colors.radius.sm,
              backgroundColor: colors.surfaceSubtle,
              borderLeft: `4px solid ${colors.accentTeal}`
            }}
          >
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: colors.textMuted }}>Servicio</span>
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: colors.textMuted }}>Profesional</span>
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{selectedEmployee?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: colors.textMuted }}>Fecha</span>
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{selectedDate && formatDateUtil(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: colors.textMuted }}>Hora</span>
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{selectedSlot && formatTime(selectedSlot)}</span>
              </div>
            </div>
          </div>

          <p className="text-center text-sm mb-6" style={{ color: colors.textMuted }}>
            Te hemos enviado un recordatorio a tu teléfono. <br />
            Gracias por confiar en {organizationName}
          </p>

          <button onClick={onNewBooking} className="w-full py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              borderRadius: colors.radius.button,
              backgroundColor: 'transparent',
              border: `1px solid ${colors.primary}`,
              color: colors.primary,
              transition: colors.transition,
              ['--tw-ring-color' as string]: colors.borderFocus,
            }}>
            Reservar otra cita
          </button>
        </div>
      </div>
    </div>
  )
}
