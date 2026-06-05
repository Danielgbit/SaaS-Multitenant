'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, XCircle, Clock,
  TrendingUp, Check, X, Sparkles,
  Calendar, MessageSquare, CreditCard, Ban, Receipt
} from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'
import { confirmByReception } from '@/actions/confirmations/confirmByReception'
import { PaymentModal } from '@/components/dashboard/PaymentModal'
import { Badge } from '@/components/ui/Badge'
import { formatCurrencyCOP } from '@/lib/billing/utils'

type FilterStatus = 'pending' | 'completed' | 'all'

function getAvatarColor(name: string): string {
  const colors = ['#0F4C5C', '#16A34A', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444']
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function getInitials(name: string): string {
  if (!name) return '??'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.toDateString() === today.toDateString()) return 'Hoy'
  if (date.toDateString() === tomorrow.toDateString()) return 'Mañana'
  return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
}

interface ReceptionConfirmationsProps {
  confirmations: any[]
  organizationId: string
}

export function ReceptionConfirmations({ confirmations, organizationId }: ReceptionConfirmationsProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [payingConf, setPayingConf] = useState<any | null>(null)
  const COLORS = useThemeColors()

  function getTimeUrgency(completedAt: string | null | undefined, now: number) {
    if (!completedAt) return { color: COLORS.success, bg: 'rgba(22, 163, 74, 0.12)', label: 'Reciente', pulse: false }
    const diffMin = Math.floor((now - new Date(completedAt).getTime()) / 60000)
    if (diffMin < 10) return { color: COLORS.success, bg: 'rgba(22, 163, 74, 0.12)', label: `${diffMin} min`, pulse: false }
    if (diffMin < 25) return { color: COLORS.warning, bg: 'rgba(217, 119, 6, 0.12)', label: `${diffMin} min`, pulse: false }
    return { color: COLORS.error, bg: 'rgba(220, 38, 38, 0.12)', label: `${diffMin} min`, pulse: true }
  }

  const filteredConfirmations = confirmations.filter(c => {
    if (filter === 'pending') return c.status === 'pending_reception'
    if (filter === 'completed') return c.status === 'completed'
    return true
  })

  const pendingCount = confirmations.filter(c => c.status === 'pending_reception').length
  const completedCount = confirmations.filter(c => c.status === 'completed').length
  const noShowCount = confirmations.filter(c => c.status === 'no_show').length

  const todayIncome = confirmations
    .filter(c => c.status === 'completed')
    .reduce((sum, c) => sum + c.total_amount, 0)

  const handleNoShow = async (confirmationId: string) => {
    setProcessing(confirmationId)
    const result = await confirmByReception({ confirmation_id: confirmationId, organization_id: organizationId, action: 'no_show' })
    setProcessing(null)
    if (result.success) { setShowSuccess(confirmationId); setTimeout(() => { setShowSuccess(null); router.refresh() }, 1200) }
  }

  const handleNotPerformed = async (confirmationId: string) => {
    setProcessing(confirmationId)
    const result = await confirmByReception({ confirmation_id: confirmationId, organization_id: organizationId, action: 'not_performed' })
    setProcessing(null)
    if (result.success) { setShowSuccess(confirmationId); setTimeout(() => { setShowSuccess(null); router.refresh() }, 1200) }
  }

  const openPayment = (conf: any) => {
    setPayingConf(conf)
    setShowPaymentModal(true)
  }

  const handlePaymentConfirm = async (paymentMethod: string, notes?: string) => {
    if (!payingConf) return { success: false, error: 'Error interno' }
    return await confirmByReception({
      confirmation_id: payingConf.id,
      organization_id: organizationId,
      action: 'complete',
      payment_method: paymentMethod,
      notes,
    })
  }

  const isDark = COLORS.isDark

  const filterOptions: { value: FilterStatus; label: string; count: number }[] = [
    { value: 'pending', label: 'Pendientes', count: pendingCount },
    { value: 'completed', label: 'Completados', count: completedCount },
    { value: 'all', label: 'Todos', count: confirmations.length },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.surface }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>
              Recepción
            </span>
            <span className="text-xs" style={{ color: COLORS.border }}>/</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.primary }}>
              Confirmaciones
            </span>
          </div>

          <div className="flex items-end justify-between gap-6">
            <div>
              <h1 className="font-heading text-4xl font-bold tracking-tight" style={{ color: COLORS.textPrimary }}>
                Pagos por Cobrar
              </h1>
              <p className="mt-1 text-sm" style={{ color: COLORS.textSecondary }}>
                {pendingCount === 0
                  ? 'No hay pagos pendientes'
                  : `${pendingCount} pago${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>

          {/* Bento Stats Row */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {/* Today Income - Larger */}
            <div
              className="col-span-4 sm:col-span-2 rounded-2xl p-5 transition-colors relative overflow-hidden"
              style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5" style={{ background: `radial-gradient(circle, ${COLORS.primary} 0%, transparent 70%)` }} />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primaryLight }}>
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                    Ingreso hoy
                  </p>
                  <p className="font-heading text-3xl font-bold" style={{ color: COLORS.textPrimary }}>
                    {formatCurrencyCOP(todayIncome)}
                  </p>
                </div>
              </div>
            </div>

            {/* Pending */}
            <div className="rounded-2xl p-4 transition-colors" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLORS.warning}18` }}>
                  <Clock className="w-5 h-5" style={{ color: COLORS.warning }} />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                    {pendingCount}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                    Pendientes
                  </p>
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="rounded-2xl p-4 transition-colors" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLORS.success}18` }}>
                  <CheckCircle className="w-5 h-5" style={{ color: COLORS.success }} />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                    {completedCount}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                    Completados
                  </p>
                </div>
              </div>
            </div>

            {/* No Shows */}
            {noShowCount > 0 && (
              <div className="rounded-2xl p-4 transition-colors" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLORS.error}18` }}>
                    <XCircle className="w-5 h-5" style={{ color: COLORS.error }} />
                  </div>
                  <div>
                    <p className="font-heading text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                      {noShowCount}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                      No asisten
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-8 mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex p-1 rounded-xl" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                style={{
                  
                  backgroundColor: filter === opt.value ? COLORS.primary : 'transparent',
                  color: filter === opt.value ? '#FFFFFF' : COLORS.textSecondary,
                  boxShadow: filter === opt.value ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                {opt.label}
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{
                  backgroundColor: filter === opt.value ? 'rgba(255,255,255,0.25)' : COLORS.border,
                  color: filter === opt.value ? '#FFFFFF' : COLORS.textMuted,
                }}>
                  {opt.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pb-12">
        <div className="max-w-6xl mx-auto">
          {filteredConfirmations.length === 0 ? (
            <div className="text-center py-24 rounded-3xl border" style={{
              backgroundColor: COLORS.surface,
              borderColor: COLORS.border,
            }}>
              <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primaryLight }}>
                {filter === 'completed' ? (
                  <CheckCircle className="w-10 h-10 text-white" />
                ) : (
                  <Receipt className="w-10 h-10 text-white" />
                )}
              </div>
              <h3 className="font-heading text-heading-2 font-semibold mb-2" style={{ color: COLORS.textPrimary }}>
                {filter === 'pending' ? 'Sin pagos pendientes' : filter === 'completed' ? 'Sin completados hoy' : 'Sin confirmaciones'}
              </h3>
              <p style={{  color: COLORS.textSecondary }} className="max-w-sm mx-auto">
                {filter === 'pending'
                  ? 'Los pagos pendientes aparecerán aquí cuando los empleados marquen servicios como completados.'
                  : filter === 'completed'
                    ? 'No hay pagos completados hoy. Vuelve más tarde.'
                    : 'Las confirmaciones aparecerán aquí cuando haya pagos pendientes o completados.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredConfirmations.map((conf, index) => {
                const isPending = conf.status === 'pending_reception'
                const isComplete = conf.status === 'completed'
                const isNoShow = conf.status === 'no_show'
                const isNotPerformed = conf.status === 'not_performed'
                const isSuccess = showSuccess === conf.id

                const urgency = getTimeUrgency(conf.completed_at, Date.now())
                const borderColor = isPending ? COLORS.primary : isComplete ? COLORS.success : isNoShow ? COLORS.error : COLORS.textMuted

                return (
                  <div
                    key={conf.id}
                    className="rounded-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                    style={{
                      animationDelay: `${index * 60}ms`,
                      animationFillMode: 'backwards',
                      backgroundColor: COLORS.surface,
                      borderLeft: `5px solid ${borderColor}`,
                      borderRight: `1px solid ${COLORS.border}`,
                      borderTop: `1px solid ${COLORS.border}`,
                      borderBottom: `1px solid ${COLORS.border}`,
                      opacity: isSuccess ? 0.5 : 1,
                      transition: 'opacity 0.3s ease, box-shadow 0.2s ease, transform 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSuccess) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px ${borderColor}25`
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    {/* Card Header */}
                    <div className="px-6 py-4 flex items-start justify-between gap-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: getAvatarColor(conf.employee_name || 'U') }}>
                          {getInitials(conf.employee_name || 'Usuario')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold truncate" style={{  color: COLORS.textPrimary }}>
                              {conf.client_name || 'Cliente'}
                            </h3>
                            <Badge variant={conf.confirmation_type === 'walkin' ? 'warning' : 'primary'} size="sm">
                              {conf.confirmation_type === 'walkin' ? 'Walk-in' : 'Programada'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                            <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                              <span style={{ color: COLORS.textMuted }}>por</span>{' '}
                              <span className="font-medium">{conf.employee_name || 'Empleado'}</span>
                            </span>
                            {conf.start_time && (
                              <>
                                <span className="text-xs" style={{ color: COLORS.textMuted }}>•</span>
                                <span className="text-xs flex items-center gap-1" style={{ color: COLORS.textMuted }}>
                                  <Calendar className="w-3 h-3" />
                                  {formatTime(conf.start_time)} • {formatDate(conf.start_time)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount + Status */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <p className="font-heading text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                          {formatCurrencyCOP(conf.total_amount)}
                        </p>
                        <div className="flex items-center gap-2">
                          {isPending && urgency.label !== 'Reciente' && (
                            <span className={`text-label font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${urgency.pulse ? 'animate-pulse' : ''}`}
                              style={{ backgroundColor: urgency.bg, color: urgency.color }}>
                              <Clock className="w-3 h-3" />
                              {urgency.label}
                            </span>
                          )}
                          <Badge
                            variant={isPending ? 'primary' : isComplete ? 'success' : isNoShow ? 'error' : 'neutral'}
                            size="md"
                          >
                            {isPending ? 'Por cobrar' : isComplete ? 'Pagado' : isNoShow ? 'No asistió' : 'No realizado'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-6 py-4">
                      {/* Services */}
                      {conf.services?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sidebar-label font-semibold mb-2" style={{ color: COLORS.textMuted }}>
                            Servicios
                          </p>
                          <div className="space-y-1.5">
                            {conf.services.map((service: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COLORS.success}18` }}>
                                    <Check className="w-3.5 h-3.5" style={{ color: COLORS.success }} />
                                  </div>
                                  <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                                    {service.service_name}
                                  </span>
                                </div>
                                <span className="text-sm font-semibold" style={{ color: COLORS.textSecondary }}>
                                  {formatCurrencyCOP(service.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {conf.notes && (
                        <div className="flex items-start gap-2 px-3.5 py-2 rounded-xl mb-4" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: COLORS.textMuted }} />
                          <p className="text-xs italic" style={{ color: COLORS.textSecondary }}>{conf.notes}</p>
                        </div>
                      )}

                      {/* Pending Actions */}
                      {isPending && (
                        <div className="flex gap-2.5">
                          <button type="button" onClick={() => handleNoShow(conf.id)} disabled={processing === conf.id}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            style={{ backgroundColor: `${COLORS.error}12`, color: COLORS.error }}>
                            <Ban className="w-4 h-4" />
                            No asistió
                          </button>
                          <button type="button" onClick={() => handleNotPerformed(conf.id)} disabled={processing === conf.id}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            style={{ backgroundColor: COLORS.surfaceHover, color: COLORS.textSecondary }}>
                            <X className="w-4 h-4" />
                            No realizado
                          </button>
                          {isSuccess ? (
                            <div className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                              style={{ backgroundColor: COLORS.success, color: COLORS.textOnSuccess }}>
                              <Sparkles className="w-4 h-4" />
                              Listo!
                            </div>
                          ) : (
                            <button type="button" onClick={() => openPayment(conf)} disabled={processing === conf.id || isSuccess}
                              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                              style={{
                                backgroundColor: COLORS.primary,
                                color: COLORS.textOnPrimary,
                                boxShadow: `0 4px 12px ${COLORS.primary}30`,
                              }}>
                              {processing === conf.id ? (
                                <Spinner size="sm" />
                              ) : (
                                <><CreditCard className="w-4 h-4" /> Cobrar</>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Completed State */}
                      {isComplete && (
                        <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ backgroundColor: `${COLORS.success}12` }}>
                          <CheckCircle className="w-5 h-5" style={{ color: COLORS.success }} />
                          <div>
                            <span className="font-semibold text-sm" style={{ color: COLORS.success }}>Pagado</span>
                            <span className="text-sm ml-2" style={{ color: COLORS.textSecondary }}>
                              {conf.payment_method ? `${conf.payment_method} • ` : ''}{formatCurrencyCOP(conf.total_amount)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* No Show / Not Performed */}
                      {(isNoShow || isNotPerformed) && (
                        <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ backgroundColor: isNoShow ? `${COLORS.error}12` : `${COLORS.textMuted}10` }}>
                          {isNoShow ? <XCircle className="w-5 h-5" style={{ color: COLORS.error }} /> : <X className="w-5 h-5" style={{ color: COLORS.textMuted }} />}
                          <span className="text-sm font-medium" style={{ color: isNoShow ? COLORS.error : COLORS.textMuted }}>
                            {isNoShow ? 'Cliente no asistió' : 'Servicio no realizado'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {payingConf && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => { setShowPaymentModal(false); setPayingConf(null); router.refresh() }}
          onSuccess={() => { setShowPaymentModal(false); setPayingConf(null); router.refresh() }}
          clientName={payingConf.client_name || 'Cliente'}
          services={(payingConf.services || []).map((s: any) => ({ name: s.service_name, price: s.price }))}
          employeeName={payingConf.employee_name || 'Empleado'}
          totalPrice={payingConf.total_amount}
          completedAt={payingConf.completed_at}
          onConfirm={handlePaymentConfirm}
          appointmentId={payingConf.appointment_id}
        />
      )}
    </div>
  )
}
