'use client'

import { 
  Calendar, 
  User, 
  Building2, 
  Clock, 
  FileText, 
  Phone, 
  X,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Circle
} from 'lucide-react'
import { AppointmentWithDetails, CalendarColors } from '@/types/calendar'
import React from 'react'

interface AppointmentDetailsModalProps {
  appointment: AppointmentWithDetails | null
  COLORS: CalendarColors
  STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }>
  formatDateTimeFull: (dateString: string) => string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: string) => void
  updatingStatus: boolean
}

export function AppointmentDetailsModal({
  appointment,
  COLORS,
  STATUS_CONFIG,
  formatDateTimeFull,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  updatingStatus
}: AppointmentDetailsModalProps) {
  if (!appointment) return null

  const st = STATUS_CONFIG[appointment.status] || { 
    color: COLORS.textSecondary, 
    bg: COLORS.borderLight, 
    label: appointment.status, 
    icon: <Circle />
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4" 
      style={{ backgroundColor: 'rgba(26,43,50,0.5)', backdropFilter: 'blur(4px)' }} 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ backgroundColor: COLORS.surface, boxShadow: '0 24px 48px rgba(15,76,92,0.2)' }} 
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="px-6 py-4" 
          style={{ backgroundColor: COLORS.primary, color: '#FFF' }}
        >
          <h3 className="text-xl font-semibold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Detalles
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: st.bg, color: st.color }}
              >
                {st.icon}
                {st.label}
              </div>
              <span className="text-sm" style={{ color: COLORS.textMuted }}>
                #{appointment.id.slice(0, 8)}
              </span>
            </div>
            
            <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5" style={{ color: COLORS.primary }} />
                <span className="font-semibold" style={{ color: COLORS.textPrimary }}>Fecha</span>
              </div>
              <p className="text-sm pl-8" style={{ color: COLORS.textSecondary }}>
                {formatDateTimeFull(appointment.start_time)}
              </p>
            </div>
            
            <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5" style={{ color: COLORS.primary }} />
                <span className="font-semibold" style={{ color: COLORS.textPrimary }}>Cliente</span>
              </div>
              <p className="font-medium pl-8" style={{ color: COLORS.textPrimary }}>
                {appointment.client?.name || 'N/A'}
              </p>
              {appointment.client?.phone && (
                <div className="flex items-center gap-2 text-sm pl-8" style={{ color: COLORS.textSecondary }}>
                  <Phone className="w-4 h-4" />
                  {appointment.client.phone}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-5 h-5" style={{ color: COLORS.primary }} />
                  <span className="font-semibold text-sm" style={{ color: COLORS.textPrimary }}>Profesional</span>
                </div>
                <p className="text-sm font-medium pl-8" style={{ color: COLORS.textSecondary }}>
                  {appointment.employee?.name || 'N/A'}
                </p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5" style={{ color: COLORS.primary }} />
                  <span className="font-semibold text-sm" style={{ color: COLORS.textPrimary }}>Servicio</span>
                </div>
                <p className="text-sm font-medium pl-8" style={{ color: COLORS.textSecondary }}>
                  {appointment.service?.name || 'N/A'}
                </p>
              </div>
            </div>
            
            {appointment.notes && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5" style={{ color: COLORS.primary }} />
                  <span className="font-semibold" style={{ color: COLORS.textPrimary }}>Notas</span>
                </div>
                <p className="text-sm pl-8" style={{ color: COLORS.textSecondary }}>
                  {appointment.notes}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderTop: `1px solid ${COLORS.border}` }}
        >
          <div className="flex gap-2">
            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
              <>
                <button 
                  onClick={() => onStatusChange('confirmed')} 
                  disabled={updatingStatus || appointment.status === 'confirmed'}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium"
                  style={{ 
                    backgroundColor: COLORS.success, 
                    color: '#FFF', 
                    opacity: appointment.status === 'confirmed' ? 0.5 : 1 
                  }}
                >
                  Confirmar
                </button>
                <button 
                  onClick={() => onStatusChange('cancelled')} 
                  disabled={updatingStatus}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: COLORS.error, color: '#FFF' }}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onDelete}
              className="px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ color: COLORS.error, backgroundColor: COLORS.errorLight }}
            >
              Eliminar
            </button>
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{ 
                color: COLORS.textSecondary, 
                backgroundColor: COLORS.surfaceSubtle, 
                border: `1px solid ${COLORS.border}` 
              }}
            >
              Cerrar
            </button>
            <button 
              onClick={onEdit}
              className="px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: COLORS.primary, color: '#FFF' }}
            >
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
