'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { X, AlertCircle, CheckCircle2, Banknote, Smartphone, CreditCard, QrCode, Clock, ChevronDown, ChevronUp, Plus, Minus, Sparkles, DollarSign } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface ServiceItem {
  name: string
  price: number
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  clientName: string
  services: ServiceItem[]
  employeeName: string
  totalPrice: number
  completedAt?: string | null
  onConfirm: (paymentMethod: string, notes?: string) => Promise<{ success: boolean; error?: string }>
  appointmentId?: string
  logId?: string
  serviceName?: string
  queueNotificationId?: string
  onQueuePaymentSuccess?: (id: string) => void
}

const PAYMENT_METHODS = [
  { code: 'efectivo', label: 'Efectivo', icon: Banknote, desc: 'Dinero físico' },
  { code: 'nequi', label: 'Nequi', icon: Smartphone, desc: 'App Nequi' },
  { code: 'daviplata', label: 'Daviplata', icon: Smartphone, desc: 'App Daviplata' },
  { code: 'pse', label: 'PSE', icon: Banknote, desc: 'Transferencia' },
  { code: 'qr_nequi', label: 'QR Nequi', icon: QrCode, desc: 'Código QR' },
  { code: 'qr_bancolombia', label: 'QR Bcolombia', icon: QrCode, desc: 'Código QR' },
  { code: 'tarjeta_debito', label: 'Débito', icon: CreditCard, desc: 'Tarjeta débito' },
  { code: 'tarjeta_credito', label: 'Crédito', icon: CreditCard, desc: 'Tarjeta crédito' },
]

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  clientName,
  services,
  employeeName,
  totalPrice,
  completedAt,
  onConfirm,
  appointmentId,
}: PaymentModalProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showAdjustPrice, setShowAdjustPrice] = useState(false)
  const [adjustment, setAdjustment] = useState(0)
  const [adjustReason, setAdjustReason] = useState('')
  const COLORS = useThemeColors()

  useEffect(() => {
    if (!completedAt) return
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - new Date(completedAt).getTime()) / 60000))
    }, 10000)
    return () => clearInterval(interval)
  }, [completedAt])

  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(null); setNotes(''); setError(null)
      setShowSuccess(false); setTimeElapsed(0)
      setShowAdjustPrice(false); setAdjustment(0); setAdjustReason('')
    }
  }, [isOpen])

  function getTimerUrgency(m: number) {
    if (m < 5) return { color: COLORS.success, bg: COLORS.successLight, label: 'Reciente', pct: 0 }
    if (m < 15) return { color: COLORS.warning, bg: COLORS.warningLight, label: 'Pendiente', pct: 0.33 }
    if (m < 30) return { color: '#F97316', bg: COLORS.amberLight, label: 'Atención', pct: 0.66 }
    return { color: COLORS.error, bg: COLORS.errorLight, label: 'Urgente', pct: 1 }
  }

  const timer = getTimerUrgency(timeElapsed)
  const finalPrice = totalPrice + adjustment

  const callAdjustPrice = useCallback(async () => {
    if (adjustment === 0 || !appointmentId) return null
    const { adjustPrice } = await import('@/actions/confirmations/adjustPrice')
    const fd = new FormData()
    fd.set('appointmentId', appointmentId)
    fd.set('newPrice', String(finalPrice))
    fd.set('reason', adjustReason || 'Ajuste en recepción')
    return adjustPrice({ success: false }, fd)
  }, [adjustment, appointmentId, finalPrice, adjustReason])

  const handleSubmit = useCallback(() => {
    if (!selectedMethod) { setError('Selecciona un método de pago'); return }
    setError(null)

    startTransition(async () => {
      if (adjustment !== 0) {
        const r = await callAdjustPrice()
        if (r?.error) { setError(r.error); return }
      }

      const result = await onConfirm(selectedMethod, notes || undefined)
      if (result.error) { setError(result.error); return }

      setShowSuccess(true)
      setTimeout(() => { onSuccess?.(); onClose() }, 1500)
    })
  }, [selectedMethod, notes, adjustment, callAdjustPrice, onConfirm, onSuccess, onClose])

  const handleClose = useCallback(() => {
    if (!isPending && !showSuccess) onClose()
  }, [isPending, showSuccess, onClose])

  if (!isOpen) return null

  if (showSuccess) {
    return (
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4" 
          role="dialog" 
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div 
            className="relative z-10 flex flex-col items-center py-16 px-10 rounded-3xl shadow-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/60"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <motion.div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6" 
              style={{ backgroundColor: COLORS.successLight }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
              >
                <CheckCircle2 className="w-10 h-10" style={{ color: COLORS.success }} />
              </motion.div>
            </motion.div>
            <h2 className="text-heading-2 mb-2" style={{ color: COLORS.textPrimary }}>
              Cobro Exitoso
            </h2>
            <p className="text-center" style={{ color: COLORS.textSecondary }}>
              {formatCurrencyCOP(finalPrice)} cobrados a {clientName}
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="payment-modal-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm" 
          onClick={handleClose} 
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div 
          className="relative z-10 bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700/60 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 dark:border-slate-700/60" style={{ backgroundColor: COLORS.surfaceSubtle }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primaryLight }}>
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h2 id="payment-modal-title" className="text-heading-2" style={{ color: COLORS.textPrimary }}>
              Cobrar Servicio
            </h2>
          </div>
          <button type="button" onClick={handleClose} disabled={isPending} aria-label="Cerrar modal"
            className="p-2 rounded-xl transition-colors disabled:opacity-50 hover:bg-[--btn-hover-bg]" style={{ color: COLORS.textMuted, '--btn-hover-bg': COLORS.surfaceHover } as any}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5 max-h-[70dvh] overflow-y-auto">
          {/* Timer Urgency */}
          {completedAt && timeElapsed > 0 && (
            <div className="rounded-xl p-4" style={{ backgroundColor: timer.bg }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2" style={{ color: timer.color }}>
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-semibold">{timer.label}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: timer.color }}>{timeElapsed} min</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/50" style={{ backgroundColor: `${timer.color}20` } as React.CSSProperties}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${timer.pct * 100}%`, backgroundColor: timer.color }} />
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="space-y-3 rounded-xl p-4" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: COLORS.textSecondary }}>Cliente</span>
              <span className="font-medium" style={{ color: COLORS.textPrimary }}>{clientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: COLORS.textSecondary }}>Profesional</span>
              <span className="font-medium" style={{ color: COLORS.textPrimary }}>{employeeName}</span>
            </div>
            {services.length > 0 && (
              <div className="pt-2 border-t" style={{ borderColor: COLORS.border }}>
                <p className="text-label mb-2" style={{ color: COLORS.textMuted }}>
                  Servicios
                </p>
                <div className="space-y-1.5">
                  {services.map((s, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span style={{ color: COLORS.textPrimary }}>{s.name}</span>
                      <span className="font-medium" style={{ color: COLORS.textSecondary }}>{formatCurrencyCOP(s.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: COLORS.border }}>
              <span className="font-heading text-lg font-bold" style={{ color: COLORS.textPrimary }}>
                Total {adjustment !== 0 && <span className="text-sm font-normal" style={{ color: COLORS.textMuted }}>({adjustment > 0 ? '+' : ''}{formatCurrencyCOP(adjustment)})</span>}
              </span>
              <span className="font-heading text-2xl font-bold" style={{ color: COLORS.success }}>
                {formatCurrencyCOP(finalPrice)}
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
              Método de pago
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {PAYMENT_METHODS.map(({ code, label, icon: Icon, desc }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedMethod(code)}
                  disabled={isPending}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    borderColor: selectedMethod === code ? COLORS.accentTeal : 'transparent',
                    backgroundColor: selectedMethod === code ? COLORS.accentTealLight : COLORS.surfaceSubtle,
                    boxShadow: selectedMethod === code ? COLORS.shadow.tealMd : 'none',
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: selectedMethod === code ? COLORS.accentTeal : COLORS.textMuted }} />
                  <span className="text-body-xs font-semibold leading-tight text-center" style={{ color: selectedMethod === code ? COLORS.accentTeal : COLORS.textSecondary }}>
                    {label}
                  </span>
                  <span className="text-caption leading-tight text-center" style={{ color: COLORS.textMuted }}>{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Adjust Price */}
          {appointmentId && (
            <div>
              <button
                type="button"
                onClick={() => setShowAdjustPrice(!showAdjustPrice)}
                className="flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer"
                style={{ color: COLORS.textSecondary }}
              >
                {showAdjustPrice ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Ajustar precio
              </button>
              {showAdjustPrice && (
                <div className="mt-3 p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setAdjustment(prev => Math.max(-totalPrice, prev - 10000))}
                      disabled={isPending}
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                      style={{ backgroundColor: COLORS.surfaceHover, color: COLORS.textSecondary }}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: COLORS.textMuted }}>$</span>
                      <input
                        type="number"
                        value={adjustment}
                        onChange={e => setAdjustment(Number(e.target.value) || 0)}
                        disabled={isPending}
                        className="w-full h-9 pl-7 pr-3 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 disabled:opacity-50"
                        style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdjustment(prev => prev + 10000)}
                      disabled={isPending}
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                      style={{ backgroundColor: COLORS.surfaceHover, color: COLORS.textSecondary }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {adjustment !== 0 && (
                    <div className="flex justify-between text-sm mb-2 px-1" style={{ color: adjustment > 0 ? COLORS.success : COLORS.error }}>
                      <span>{adjustment > 0 ? 'Aumento' : 'Descuento'}</span>
                      <span className="font-bold">{adjustment > 0 ? '+' : ''}{formatCurrencyCOP(adjustment)}</span>
                    </div>
                  )}
                  <textarea
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value)}
                    disabled={isPending}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 disabled:opacity-50"
                    style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` }}
                    placeholder="Motivo del ajuste..."
                    maxLength={200}
                  />
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: COLORS.textSecondary }}>
              Nota interna (opcional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={isPending}
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 disabled:opacity-50"
              style={{ backgroundColor: COLORS.surfaceSubtle, borderColor: COLORS.border, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` }}
              placeholder="Solo visible para staff..."
              maxLength={500}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: COLORS.error + '15', border: `1px solid ${COLORS.error}30` }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.error }} />
              <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: COLORS.border }}>
          <button type="button" onClick={handleClose} disabled={isPending}
            className="flex-1 h-12 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, backgroundColor: 'transparent' }}>
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={isPending || !selectedMethod}
            className="flex-1 h-12 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: COLORS.primary, color: COLORS.textOnPrimary, boxShadow: COLORS.shadow.tealMd }}>
            {isPending ? (
              <><Spinner size="sm" /> Procesando...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Cobrar {formatCurrencyCOP(finalPrice)}</>
            )}
          </button>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
