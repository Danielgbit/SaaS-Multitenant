'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Bell, AlertTriangle, CheckCircle2, User, Clock, DollarSign, Info, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PaymentModal } from './PaymentModal'
import { AdjustPriceModal } from './AdjustPriceModal'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { realtimeManager } from '@/lib/realtime'
import type { PendingConfirmationWithDetails } from '@/types/confirmations'

interface ConfirmationsPanelProps {
  organizationId: string
  isOpen: boolean
  onClose: () => void
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)

  if (diffSec < 60) return 'hace un momento'
  if (diffMin < 60) return `hace ${diffMin} min`
  if (diffHour < 24) return `hace ${diffHour}h`
  return date.toLocaleDateString('es-CO')
}

function ConfirmationCard({
  confirmation,
  onPay,
  onAdjust,
  colors,
}: {
  confirmation: PendingConfirmationWithDetails
  onPay: (c: PendingConfirmationWithDetails) => void
  onAdjust: (c: PendingConfirmationWithDetails) => void
  colors: ReturnType<typeof useThemeColors>
}) {
  const isNeedsReview = confirmation.confirmation_status === 'needs_review'
  const isUrgent = confirmation.completed_at && 
    (new Date().getTime() - new Date(confirmation.completed_at).getTime()) > 30 * 60 * 1000

  return (
    <div
      className="rounded-xl border transition-all duration-200 hover:shadow-md"
      style={{
        backgroundColor: isNeedsReview ? colors.warningLight : colors.surface,
        borderColor: isNeedsReview ? colors.warning : colors.border,
        borderLeft: isNeedsReview ? `3px solid ${colors.warning}` : `3px solid ${colors.primary}`,
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate" style={{ color: colors.textPrimary }}>
                {confirmation.clients?.name || 'Cliente'}
              </span>
              {isNeedsReview && (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: colors.warning }} />
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              {(confirmation as any).employees?.name || 'Profesional'}
            </p>
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: colors.textMuted }}>
            {formatTimeAgo(confirmation.completed_at || confirmation.start_time || '')}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs mb-2" style={{ color: colors.textMuted }}>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(confirmation.start_time || '').toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="flex items-center gap-1 font-semibold" style={{ color: colors.success }}>
            <DollarSign className="w-3.5 h-3.5" />
            ${(confirmation.price_adjustment || 0).toLocaleString('es-CO')}
          </span>
          {isUrgent && (
            <span className="flex items-center gap-1 animate-pulse" style={{ color: colors.error }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              Urgente
            </span>
          )}
        </div>

        {confirmation.notes && (
          <p className="text-xs flex items-start gap-1 mt-2 p-2 rounded-lg" style={{ backgroundColor: colors.surfaceSubtle }}>
            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: colors.textMuted }} />
            <span style={{ color: colors.textSecondary }}>{confirmation.notes}</span>
          </p>
        )}

        <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
          <button onClick={() => onPay(confirmation)}
            className="flex-1 h-9 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: colors.primary, color: colors.textOnPrimary }}>
            <CreditCard className="w-4 h-4" />
            Cobrar
          </button>
          <button onClick={() => onAdjust(confirmation)}
            className="h-9 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            style={{ border: `1px solid ${colors.border}`, color: colors.textSecondary }}>
            Ajustar
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmationsPanel({
  organizationId,
  isOpen,
  onClose,
}: ConfirmationsPanelProps) {
  const [confirmations, setConfirmations] = useState<PendingConfirmationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConfirmation, setSelectedConfirmation] = useState<PendingConfirmationWithDetails | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [newItemPulse, setNewItemPulse] = useState(false)
  const COLORS = useThemeColors()

  const fetchPending = useCallback(async () => {
    const supabase = createClient()
    
    const { data, error } = await (supabase as any)
      .from('appointments')
      .select(`
        id,
        organization_id,
        employee_id,
        start_time,
        end_time,
        status,
        notes,
        confirmation_status,
        completed_at,
        confirmed_at,
        price_adjustment,
        payment_method,
        created_at,
        clients!clients_id(name, phone),
        employees!employees_id(name)
      `)
      .eq('organization_id', organizationId)
      .in('confirmation_status', ['completed', 'needs_review'])
      .order('start_time', { ascending: false })

    if (!error && data) {
      const prevCount = confirmations.length
      setConfirmations(data)
      if (data.length > prevCount && prevCount > 0) {
        setNewItemPulse(true)
        setTimeout(() => setNewItemPulse(false), 2000)
      }
    }
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    if (isOpen) fetchPending()
  }, [isOpen, fetchPending])

  useEffect(() => {
    if (!isOpen) return
    const unsubAppointments = realtimeManager.on('appointments', () => { fetchPending() })
    const unsubNotifications = realtimeManager.on('notifications', () => { fetchPending() })
    return () => {
      unsubAppointments()
      unsubNotifications()
    }
  }, [isOpen, fetchPending])

  const handlePay = useCallback((confirmation: PendingConfirmationWithDetails) => {
    setSelectedConfirmation(confirmation)
    setShowPaymentModal(true)
  }, [])

  const handleAdjust = useCallback((confirmation: PendingConfirmationWithDetails) => {
    setSelectedConfirmation(confirmation)
    setShowAdjustModal(true)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedConfirmation(null)
    onClose()
  }, [onClose])

  if (!isOpen) return null

  return (
    <>
      <Modal>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
              {confirmations.length > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${newItemPulse ? 'animate-ping' : ''}`}
                  style={{ backgroundColor: COLORS.error }}>
                  {confirmations.length > 9 ? '9+' : confirmations.length}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold font-heading" style={{ color: COLORS.textPrimary }}>
              Confirmaciones
            </h2>
          </div>
          <button onClick={handleClose} aria-label="Cerrar panel"
            className="p-2 rounded-xl transition-colors" style={{ color: COLORS.textMuted }}>
            <X className="w-5 h-5" />
          </button>
        </Modal>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="space-y-3 py-4">
              <Skeleton variant="rectangular" height="h-24" />
              <Skeleton variant="rectangular" height="h-24" />
              <Skeleton variant="rectangular" height="h-24" />
            </div>
          ) : confirmations.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-6 h-6" style={{ color: COLORS.success }} />}
              title="Sin servicios pendientes"
              description="Los servicios completados aparecerán aquí cuando estén listos para confirmar."
            />
          ) : (
            confirmations.map((confirmation) => (
              <ConfirmationCard
                key={confirmation.id}
                confirmation={confirmation}
                onPay={handlePay}
                onAdjust={handleAdjust}
                colors={COLORS}
              />
            ))
          )}
        </div>

      {selectedConfirmation && (
        <>
          <PaymentModal
            appointmentId={selectedConfirmation.id}
            clientName={selectedConfirmation.clients?.name || 'Cliente'}
            services={[{ name: selectedConfirmation.notes || 'Servicio', price: selectedConfirmation.price_adjustment || 0 }]}
            employeeName={(selectedConfirmation as any).employees?.name || 'Profesional'}
            totalPrice={selectedConfirmation.price_adjustment || 0}
            completedAt={selectedConfirmation.completed_at}
            isOpen={showPaymentModal}
            onClose={() => { setShowPaymentModal(false); fetchPending() }}
            onSuccess={() => { setShowPaymentModal(false); fetchPending() }}
            onConfirm={async (method, notes) => {
              const formData = new FormData()
              formData.set('appointmentId', selectedConfirmation.id)
              formData.set('paymentMethod', method)
              if (notes) formData.set('notes', notes)
              const { confirmService } = await import('@/actions/confirmations/confirmService')
              const result = await confirmService({ success: false }, formData)
              return result
            }}
          />

          <AdjustPriceModal
            appointmentId={selectedConfirmation.id}
            currentPrice={selectedConfirmation.price_adjustment || 0}
            isOpen={showAdjustModal}
            onClose={() => setShowAdjustModal(false)}
            onSuccess={() => { setShowAdjustModal(false); fetchPending() }}
          />
        </>
      )}
    </>
  )
}
