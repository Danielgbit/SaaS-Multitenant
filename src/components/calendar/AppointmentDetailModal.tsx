'use client'

import { Calendar, Clock, User, Building2, Sparkles, FileText, Phone, Circle, DollarSign } from 'lucide-react'
import { Modal } from '@/components/ui'
import { ConfirmationButton } from '@/components/dashboard/ConfirmationButton'
import { AppointmentFinancialTimeline } from './AppointmentFinancialTimeline'
import type { AppointmentWithDetails } from '@/types/calendar'
import type { CalendarColors } from '@/types/calendar'
import type { ReactNode } from 'react'

interface AppointmentDetailModalProps {
  appointment: AppointmentWithDetails | null
  COLORS: CalendarColors
  STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: ReactNode }>
  userRole: string
  updatingStatus: boolean
  formatTime: (s: string) => string
  onClose: () => void
  onConfirmAppointment: () => void
  onAdminConfirmService: () => void
  onDelete: () => void
  onEdit: () => void
  onCompleted: () => void
  organizationId?: string
}

export function AppointmentDetailModal({
  appointment, COLORS, STATUS_CONFIG, userRole, updatingStatus,
  formatTime, onClose, onConfirmAppointment, onAdminConfirmService,
  onDelete, onEdit, onCompleted, organizationId,
}: AppointmentDetailModalProps) {
  if (!appointment) return null

  const st = (STATUS_CONFIG as any)[appointment.status] || {
    color: COLORS.textSecondary, bg: COLORS.borderLight,
    label: appointment.status, icon: <Circle className="w-3.5 h-3.5" />,
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Detalles de Cita">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: st.bg, color: st.color }}>
            {st.icon}
            <span>{st.label}</span>
          </div>
          <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
            {formatTime(appointment.start_time)}
          </span>
        </div>

            <div className="p-4 rounded-xl transition-colors duration-200" style={{ backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                  <User className="w-5 h-5" style={{ color: COLORS.primary }} />
                </div>
                <span className="text-xs uppercase tracking-wider font-medium" style={{ color: COLORS.textSecondary }}>Cliente</span>
              </div>
              <p className="text-lg font-semibold mb-1" style={{ color: COLORS.textPrimary }}>
                {appointment.client?.name || 'N/A'}
              </p>
              {appointment.client?.phone && (
                <div className="flex items-center gap-2 text-sm" style={{ color: COLORS.textSecondary }}>
                  <Phone className="w-4 h-4" />
                  <span>{appointment.client.phone}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: <Calendar className="w-4 h-4" style={{ color: COLORS.primary }} />, label: 'Fecha', value: new Date(appointment.start_time).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) },
                { icon: <Clock className="w-4 h-4" style={{ color: COLORS.primary }} />, label: 'Hora', value: formatTime(appointment.start_time) },
                { icon: <Building2 className="w-4 h-4" style={{ color: COLORS.primary }} />, label: 'Profesional', value: (() => { const n = appointment.employee?.name; if (!n) return 'N/A'; const parts = n.split(' '); return parts.map(p => p[0]).join('').toUpperCase() + '. ' + parts.slice(1).join(' ') })() },
                { icon: <Sparkles className="w-4 h-4" style={{ color: COLORS.primary }} />, label: 'Servicio', value: appointment.service?.name || 'N/A' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl transition-colors duration-200" style={{ backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    {item.icon}
                    <span className="text-xs uppercase tracking-wider font-medium" style={{ color: COLORS.textSecondary }}>{item.label}</span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>{item.value}</p>
                </div>
              ))}
            </div>

            {appointment.notes && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" style={{ color: COLORS.primary }} />
                  <span className="text-xs uppercase tracking-wider font-medium" style={{ color: COLORS.textSecondary }}>Notas</span>
                </div>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>{appointment.notes}</p>
              </div>
            )}

            {/* Financial Timeline */}
            {organizationId && appointment.status === 'completed' && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4" style={{ color: COLORS.primary }} />
                  <span className="text-xs uppercase tracking-wider font-medium" style={{ color: COLORS.textSecondary }}>Movimientos financieros</span>
                </div>
                <AppointmentFinancialTimeline
                  appointmentId={appointment.id}
                  organizationId={organizationId}
                />
              </div>
            )}
          </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surfaceSubtle }}>
          {userRole !== 'empleado' && appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'confirmed' && (
            <button onClick={onConfirmAppointment} disabled={updatingStatus}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:brightness-110 cursor-pointer"
              style={{ backgroundColor: COLORS.success, color: '#FFF' }}>
              Confirmar
            </button>
          )}

          {userRole !== 'empleado' && appointment.status === 'confirmed' && appointment.confirmation_status !== 'completed' && (
            <button onClick={onAdminConfirmService} disabled={updatingStatus}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:brightness-110 cursor-pointer"
              style={{ backgroundColor: COLORS.warning, color: '#FFF' }}>
              Confirmar Servicio
            </button>
          )}

          {userRole === 'empleado' && appointment.status === 'confirmed' && (
            <ConfirmationButton
              appointmentId={appointment.id}
              clientName={appointment.client?.name || 'Cliente'}
              serviceName={appointment.service?.name || 'Servicio'}
              basePrice={appointment.service?.price || 0}
              disabled={appointment.confirmation_status === 'completed' || appointment.confirmation_status === 'confirmed'}
              onCompleted={onCompleted}
            />
          )}

          {userRole !== 'empleado' && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
            <>
              <button onClick={onDelete}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{ color: COLORS.error, backgroundColor: 'transparent', border: `1px solid ${COLORS.error}30` }}>
                Cancelar
              </button>
              <button onClick={onEdit}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:brightness-110 cursor-pointer"
                style={{ backgroundColor: COLORS.primary, color: '#FFF' }}>
                Editar
              </button>
            </>
          )}
          </div>
      </Modal>
  )
}
