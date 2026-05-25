'use client'

import { Calendar, Clock, User, Building2, Sparkles, FileText, Phone, Circle, X } from 'lucide-react'
import { ConfirmationButton } from '@/components/dashboard/ConfirmationButton'
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
}

export function AppointmentDetailModal({
  appointment, COLORS, STATUS_CONFIG, userRole, updatingStatus,
  formatTime, onClose, onConfirmAppointment, onAdminConfirmService,
  onDelete, onEdit, onCompleted,
}: AppointmentDetailModalProps) {
  if (!appointment) return null

  const st = (STATUS_CONFIG as any)[appointment.status] || {
    color: COLORS.textSecondary, bg: COLORS.borderLight,
    label: appointment.status, icon: <Circle className="w-3.5 h-3.5" />,
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: COLORS.surface, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Premium */}
        <div
          className="px-6 py-5 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primary}CC 100%)` }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white font-heading" style={{ fontWeight: 600 }}>
                  Detalles de Cita
                </h3>
                <span className="text-xs text-white/60 font-mono">#{appointment.id.slice(0, 8)}</span>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/20 transition-all duration-200 flex items-center justify-center cursor-pointer" aria-label="Cerrar modal">
              <X className="w-5 h-5 text-white/80" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
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
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surfaceSubtle }}>
          {userRole !== 'empleado' && appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'confirmed' && (
            <button onClick={onConfirmAppointment} disabled={updatingStatus}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:brightness-110 cursor-pointer"
              style={{ backgroundColor: '#10B981', color: '#FFF' }}>
              Confirmar
            </button>
          )}

          {userRole !== 'empleado' && appointment.status === 'confirmed' && appointment.confirmation_status !== 'completed' && (
            <button onClick={onAdminConfirmService} disabled={updatingStatus}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:brightness-110 cursor-pointer"
              style={{ backgroundColor: '#F59E0B', color: '#FFF' }}>
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
                style={{ color: '#EF4444', backgroundColor: 'transparent', border: '1px solid #EF444440' }}>
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
      </div>
    </div>
  )
}
