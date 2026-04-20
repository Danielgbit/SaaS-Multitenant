'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Bell, AlertTriangle, CheckCircle2, Loader2, User, Clock, DollarSign, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PaymentModal } from './PaymentModal'
import { AdjustPriceModal } from './AdjustPriceModal'
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
}: {
  confirmation: PendingConfirmationWithDetails
  onPay: (c: PendingConfirmationWithDetails) => void
  onAdjust: (c: PendingConfirmationWithDetails) => void
}) {
  const isNeedsReview = confirmation.confirmation_status === 'needs_review'
  const isOld = isNeedsReview || (confirmation.completed_at && 
    (new Date().getTime() - new Date(confirmation.completed_at).getTime()) > 60 * 60 * 1000)

  return (
    <div
      className={`
        relative p-4 rounded-xl border transition-all duration-200
        ${isNeedsReview
          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }
        hover:shadow-md
      `}
    >
      {isNeedsReview && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {confirmation.clients?.name || 'Cliente'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatTimeAgo(confirmation.completed_at || confirmation.start_time || '')}
            </span>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            {(confirmation as any).employees?.name || 'Profesional'}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(confirmation.start_time || '').toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              ${(confirmation.price_adjustment || 0).toLocaleString('es-CO')}
            </span>
          </div>

          {confirmation.notes && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
              Nota: {confirmation.notes}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => onPay(confirmation)}
          className="flex-1 h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <DollarSign className="w-4 h-4" />
          Cobrar
        </button>
        <button
          onClick={() => onAdjust(confirmation)}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Ajustar
        </button>
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
      setConfirmations(data)
    }
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    if (isOpen) {
      fetchPending()
    }
  }, [isOpen, fetchPending])

  useEffect(() => {
    if (!isOpen) return

    const supabase = createClient()

    const channel = supabase
      .channel(`confirmations-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          fetchPending()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          fetchPending()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen, organizationId, fetchPending])

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
      <div
        className="fixed inset-0 z-40 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-[#0F172A] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              {confirmations.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {confirmations.length > 9 ? '9+' : confirmations.length}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Confirmaciones
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Cerrar panel"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : confirmations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                No hay servicios pendientes
              </p>
            </div>
          ) : (
            confirmations.map((confirmation) => (
              <ConfirmationCard
                key={confirmation.id}
                confirmation={confirmation}
                onPay={handlePay}
                onAdjust={handleAdjust}
              />
            ))
          )}
        </div>
      </div>

      {selectedConfirmation && (
        <>
          <PaymentModal
            appointmentId={selectedConfirmation.id}
            clientName={selectedConfirmation.clients?.name || 'Cliente'}
            serviceName={selectedConfirmation.notes || 'Servicio'}
            employeeName={(selectedConfirmation as any).employees?.name || 'Profesional'}
            totalPrice={selectedConfirmation.price_adjustment || 0}
            completedAt={selectedConfirmation.completed_at}
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false)
              fetchPending()
            }}
            onSuccess={() => {
              setShowPaymentModal(false)
              fetchPending()
            }}
          />

          <AdjustPriceModal
            appointmentId={selectedConfirmation.id}
            currentPrice={selectedConfirmation.price_adjustment || 0}
            isOpen={showAdjustModal}
            onClose={() => setShowAdjustModal(false)}
            onSuccess={() => {
              setShowAdjustModal(false)
              fetchPending()
            }}
          />
        </>
      )}
    </>
  )
}
