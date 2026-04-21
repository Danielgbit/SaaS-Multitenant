'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { X, Loader2, AlertCircle, CheckCircle2, Banknote, Smartphone, CreditCard, QrCode, Clock } from 'lucide-react'
import { confirmService } from '@/actions/confirmations/confirmService'
import { PaymentMethodSchema } from '@/actions/confirmations/schemas'
import { toast } from 'sonner'
import { playServiceConfirmedSound } from '@/lib/sound/notification'
import { formatCurrencyCOP } from '@/lib/billing/utils'

interface PaymentModalProps {
  appointmentId: string
  logId?: string
  clientName: string
  serviceName: string
  employeeName: string
  totalPrice: number
  completedAt?: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const PAYMENT_METHODS = [
  { code: 'efectivo', label: 'Efectivo', icon: Banknote },
  { code: 'nequi', label: 'Nequi', icon: Smartphone },
  { code: 'daviplata', label: 'Daviplata', icon: Smartphone },
  { code: 'pse', label: 'PSE', icon: Banknote },
  { code: 'qr_nequi', label: 'QR Nequi', icon: QrCode },
  { code: 'qr_bancolombia', label: 'QR Bancolombia', icon: QrCode },
  { code: 'tarjeta_debito', label: 'Débito', icon: CreditCard },
  { code: 'tarjeta_credito', label: 'Crédito', icon: CreditCard },
] as const

export function PaymentModal({
  appointmentId,
  logId,
  clientName,
  serviceName,
  employeeName,
  totalPrice,
  completedAt,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [timeElapsed, setTimeElapsed] = useState(0)

  useEffect(() => {
    if (!completedAt) return
    const interval = setInterval(() => {
      const diff = Date.now() - new Date(completedAt).getTime()
      setTimeElapsed(Math.floor(diff / 60000))
    }, 10000)
    return () => clearInterval(interval)
  }, [completedAt])

  function getTimerUrgency(minutes: number) {
    if (minutes < 15) return { color: '#22C55E', label: 'Normal' }
    if (minutes < 25) return { color: '#EAB308', label: 'Atención' }
    if (minutes < 40) return { color: '#F97316', label: 'Pendiente' }
    return { color: '#EF4444', label: '¡Urgente!' }
  }

  const timer = getTimerUrgency(timeElapsed)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMethod) {
      setError('Selecciona un método de pago')
      return
    }

    const validation = PaymentMethodSchema.safeParse(selectedMethod)
    if (!validation.success) {
      setError('Método de pago inválido')
      return
    }

    setError(null)

    const formData = new FormData()
    formData.set('appointmentId', appointmentId)
    if (logId) formData.set('logId', logId)
    formData.set('paymentMethod', selectedMethod)
    if (notes.trim()) formData.set('notes', notes.trim())

    startTransition(async () => {
      const result = await confirmService({ success: false }, formData)
      
      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }

      toast.success('Cobro registrado exitosamente')
      playServiceConfirmedSound()
      onSuccess?.()
      onClose()
    })
  }, [appointmentId, logId, selectedMethod, notes, onClose, onSuccess])

  const handleClose = useCallback(() => {
    if (!isPending) {
      setSelectedMethod(null)
      setNotes('')
      setError(null)
      onClose()
    }
  }, [isPending, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700/60 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2
              id="payment-modal-title"
              className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif"
            >
              Cobrar Servicio
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {completedAt && timeElapsed > 0 && (
            <div
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${timeElapsed >= 40 ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: `${timer.color}15`, color: timer.color }}
            >
              <Clock className="w-4 h-4" />
              <span>Pendiente hace {timeElapsed} min — {timer.label}</span>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Cliente</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Servicio</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Profesional</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{employeeName}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">Total</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyCOP(totalPrice)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Método de pago
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map(({ code, label, icon: Icon }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedMethod(code)}
                  disabled={isPending}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200
                    ${selectedMethod === code
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nota interna (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none disabled:opacity-50"
              placeholder="Solo visible para staff..."
              maxLength={500}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedMethod}
              className="flex-1 h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar ${totalPrice.toLocaleString('es-CO')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
