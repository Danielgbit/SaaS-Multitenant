'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, RotateCcw, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { getAppointmentFinancialStatus, type AppointmentFinancialStatus } from '@/actions/financial/getAppointmentFinancialStatus'
import { formatFinancialAmount } from '@/types/financial'
import { Spinner } from '@/components/ui'

const STATUS_CONFIG = {
  unpaid: { label: 'Sin cobrar', color: '#94A3B8', bg: '#F1F5F9', icon: Clock },
  partial: { label: 'Pago parcial', color: '#D97706', bg: '#FEF3C7', icon: AlertCircle },
  paid: { label: 'Pagado', color: '#16A34A', bg: '#D1FAE5', icon: CheckCircle2 },
  refunded: { label: 'Reembolsado', color: '#DC2626', bg: '#FEE2E2', icon: RotateCcw },
  credited: { label: 'Abonado', color: '#0F4C5C', bg: '#E2E8F0', icon: DollarSign },
}

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  payment_received: DollarSign,
  refund_processed: RotateCcw,
  commission_settled: TrendingUp,
  adjustment_applied: AlertCircle,
}

const EVENT_LABELS: Record<string, string> = {
  payment_received: 'Pago recibido',
  refund_processed: 'Reembolso',
  commission_settled: 'Comisión liquidada',
  adjustment_applied: 'Ajuste',
  appointment_confirmed: 'Cita confirmada',
  appointment_completed: 'Servicio completado',
  appointment_cancelled: 'Cita cancelada',
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-CO', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  } catch { return dateStr }
}

export function AppointmentFinancialTimeline({
  appointmentId,
  organizationId,
}: {
  appointmentId: string
  organizationId: string
}) {
  const [data, setData] = useState<AppointmentFinancialStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAppointmentFinancialStatus(appointmentId, organizationId)
      .then(setData)
      .finally(() => setLoading(false))
  }, [appointmentId, organizationId])

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    )
  }

  if (!data || data.events.length === 0) {
    return (
      <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#F8FAFC' }}>
        <p className="text-sm" style={{ color: '#94A3B8' }}>Sin movimientos financieros</p>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[data.paymentStatus]

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="flex items-center gap-3">
          {statusConfig && (() => {
            const Icon = statusConfig.icon
            return (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: statusConfig.bg }}>
                <Icon className="w-5 h-5" style={{ color: statusConfig.color }} />
              </div>
            )
          })()}
          <div>
            <p className="text-sm font-medium" style={{ color: '#0F172A' }}>
              {statusConfig?.label || data.paymentStatus}
            </p>
            <p className="text-xs" style={{ color: '#64748B' }}>
              {data.amountPaid > 0 ? `${formatFinancialAmount(data.amountPaid)} cobrados` : 'Sin cobros'}
            </p>
          </div>
        </div>
        {data.amountPending > 0 && (
          <span className="text-sm font-semibold" style={{ color: '#D97706' }}>
            {formatFinancialAmount(data.amountPending)} pendientes
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {data.events.map((event, i) => {
          const Icon = EVENT_ICONS[event.event_type] || DollarSign
          const isLast = i === data.events.length - 1
          const amountStr = event.amount >= 0
            ? `+${formatFinancialAmount(event.amount)}`
            : `-${formatFinancialAmount(event.amount)}`

          return (
            <div key={event.id} className="flex gap-3 relative">
              {/* Line */}
              {!isLast && (
                <div className="absolute left-[15px] top-8 bottom-0 w-0.5" style={{ backgroundColor: '#E2E8F0' }} />
              )}

              {/* Icon */}
              <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: event.amount >= 0 ? '#D1FAE5' : '#FEE2E2' }}>
                <Icon className="w-4 h-4" style={{ color: event.amount >= 0 ? '#16A34A' : '#DC2626' }} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium" style={{ color: '#0F172A' }}>
                    {EVENT_LABELS[event.event_type] || event.event_type}
                  </span>
                  <span className={`text-sm font-semibold shrink-0 ${event.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {amountStr}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: '#64748B' }}>
                    {formatDateTime(event.occurred_at)}
                  </span>
                  {event.metadata?.payment_method && (
                    <>
                      <span style={{ color: '#CBD5E1' }}>·</span>
                      <span className="text-xs capitalize" style={{ color: '#64748B' }}>
                        {String(event.metadata.payment_method)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
