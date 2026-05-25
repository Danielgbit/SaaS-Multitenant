'use client'

import Link from 'next/link'
import { Calendar, Scissors, User, ChevronRight, CheckCircle2, Phone, MessageCircle, CalendarDays } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { QuickActionsMenu } from '@/components/dashboard/quick-actions/QuickActionsMenu'
import type { UpcomingAppointment, UpcomingAppointmentsProps } from '@/types/analytics'

export function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  const COLORS = useThemeColors()

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'neutral' => {
    switch (status) {
      case 'confirmed': return 'success'
      case 'pending': return 'warning'
      default: return 'neutral'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada'
      case 'pending': return 'Pendiente'
      default: return status
    }
  }

  const handleConfirm = (apt: UpcomingAppointment) => {
    if (typeof window !== 'undefined') {
      window.location.href = `/confirmations?appointment=${apt.id}`
    }
  }

  return (
    <Card variant="surface" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySubtle }}>
            <Calendar className="w-5 h-5" style={{ color: COLORS.primary }} />
          </div>
          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Próximas Citas</h3>
        </div>
        <Link 
          href="/calendar"
          className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: COLORS.primary }}
        >
          Ver todas
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-6 h-6" style={{ color: COLORS.textMuted }} />}
          title="No hay citas programadas"
        />
      ) : (
        <div className="space-y-2">
          {appointments.map((apt) => (
            <Link
              key={apt.id}
              href={`/calendar`}
              className="group flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
              style={{ backgroundColor: COLORS.surfaceSubtle }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primarySubtle }}>
                <span className="text-sm font-bold" style={{ color: COLORS.primary }}>
                  {formatTime(apt.start_time)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ color: COLORS.textPrimary }}>
                  {apt.client_name}
                </p>
                <div className="flex items-center gap-2">
                  {apt.service_name && (
                    <span className="text-xs flex items-center gap-1" style={{ color: COLORS.textSecondary }}>
                      <Scissors className="w-3 h-3" />
                      {apt.service_name}
                    </span>
                  )}
                  {apt.employee_name && (
                    <span className="text-xs flex items-center gap-1" style={{ color: COLORS.textMuted }}>
                      <User className="w-3 h-3" />
                      {apt.employee_name}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(apt.status)} size="sm">
                {getStatusLabel(apt.status)}
              </Badge>

              <QuickActionsMenu
                actions={[
                  { label: 'Confirmar', icon: <CheckCircle2 className="w-4 h-4" />, variant: 'success', onClick: () => handleConfirm(apt) },
                  { label: 'Llamar', icon: <Phone className="w-4 h-4" />, variant: 'default', href: `tel:${apt.client_phone}` },
                  { label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" />, variant: 'warning', href: `https://wa.me/${apt.client_phone?.replace(/[^0-9]/g, '')}?text=Hola ${apt.client_name}, te recuerdo tu cita` },
                  { label: 'Reagendar', icon: <CalendarDays className="w-4 h-4" />, variant: 'default', href: `/calendar?reschedule=${apt.id}` },
                ]}
              />
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}
