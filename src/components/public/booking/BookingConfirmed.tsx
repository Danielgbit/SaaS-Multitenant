'use client'

import { CheckCircle2 } from 'lucide-react'
import { formatTime, formatDate as formatDateUtil } from '@/lib/utils/formatTime'

interface Service { id: string; name: string }
interface Employee { id: string; name: string }
interface BookingColors {
  primary: string; surface: string; surfaceSubtle: string; border: string
  textPrimary: string; textSecondary: string; textMuted: string
  success: string; successLight: string
}

export function BookingConfirmed({
  selectedService, selectedEmployee, selectedDate, selectedSlot, organizationName, colors,
  onNewBooking,
}: {
  selectedService: Service | null
  selectedEmployee: Employee | null
  selectedDate: string
  selectedSlot: string
  organizationName: string
  colors: BookingColors
  onNewBooking: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.surfaceSubtle }}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl p-8 shadow-lg" style={{ border: `1px solid ${colors.border}` }}>
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: colors.successLight }}>
              <CheckCircle2 className="w-10 h-10" style={{ color: colors.success }} />
            </div>
            <h1 className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>¡Reserva confirmada!</h1>
            <p className="mt-2" style={{ color: colors.textSecondary }}>Tu cita ha sido agendada exitosamente</p>
          </div>

          <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: colors.surfaceSubtle }}>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: colors.textMuted }}>Servicio</span>
                <span className="font-medium" style={{ color: colors.textPrimary }}>{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: colors.textMuted }}>Profesional</span>
                <span className="font-medium" style={{ color: colors.textPrimary }}>{selectedEmployee?.name}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: colors.textMuted }}>Fecha</span>
                <span className="font-medium" style={{ color: colors.textPrimary }}>{selectedDate && formatDateUtil(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: colors.textMuted }}>Hora</span>
                <span className="font-medium" style={{ color: colors.textPrimary }}>{selectedSlot && formatTime(selectedSlot)}</span>
              </div>
            </div>
          </div>

          <p className="text-center text-sm" style={{ color: colors.textMuted }}>
            Te hemos enviado un recordatorio a tu teléfono. <br />
            Gracias por confiar en {organizationName}
          </p>

          <button onClick={onNewBooking} className="mt-6 w-full py-3 rounded-xl font-medium"
            style={{ backgroundColor: colors.primary, color: '#FFF' }}>
            Reservar otra cita
          </button>
        </div>
      </div>
    </div>
  )
}
