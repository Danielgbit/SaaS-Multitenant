'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, XCircle, AlertTriangle, Clock, User,
  DollarSign, CreditCard, Banknote, Loader2, Package,
  TrendingUp, Check, X, ArrowRight, Sparkles,
  Smartphone, Landmark, Calendar, MessageSquare
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { confirmByReception } from '@/actions/confirmations/confirmByReception'
import type { AppointmentConfirmation } from '@/actions/confirmations/types'

interface ReceptionConfirmationsProps {
  confirmations: (AppointmentConfirmation & { employee_name?: string; start_time?: string; completed_at?: string | null })[]
  organizationId: string
}

type FilterStatus = 'pending' | 'completed' | 'all'

function formatCurrencyCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getAvatarColor(name: string): string {
  const colors = ['#0F4C5C', '#16A34A', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444']
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function getInitials(name: string): string {
  if (!name) return '??'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getTimeUrgency(completedAt: string | null | undefined): { color: string; bg: string; label: string; animate: boolean } {
  if (!completedAt) {
    return { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.15)', label: 'Reciente', animate: false }
  }

  const now = new Date().getTime()
  const completed = new Date(completedAt).getTime()
  const diffMin = Math.floor((now - completed) / 60000)

  if (diffMin < 5) {
    return { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.15)', label: 'Reciente', animate: false }
  }
  if (diffMin < 15) {
    return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', label: `${diffMin} min`, animate: false }
  }
  return { color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', label: `${diffMin} min`, animate: true }
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy'
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Mañana'
  }
  return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
}

const PAYMENT_METHODS = [
  {
    id: 'efectivo',
    label: 'Efectivo',
    icon: Banknote,
    acceptedMethods: 'Cualquier monto en dinero físico'
  },
  {
    id: 'transferencia',
    label: 'Transferencia',
    icon: Landmark,
    acceptedMethods: 'Nequi • Daviplata • PSE • Bancolombia • QR'
  },
  {
    id: 'tarjeta',
    label: 'Tarjeta',
    icon: CreditCard,
    acceptedMethods: 'Débito • Crédito'
  },
]

function PaymentMethodButton({
  method,
  isSelected,
  onClick,
  disabled,
  colors
}: {
  method: typeof PAYMENT_METHODS[0]
  isSelected: boolean
  onClick: () => void
  disabled: boolean
  colors: ReturnType<typeof useColors>
}) {
  const Icon = method.icon

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 py-4 px-3 rounded-xl text-sm font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        backgroundColor: isSelected ? colors.primary : colors.surfaceHover,
        color: isSelected ? '#FFFFFF' : colors.textSecondary,
        border: `2px solid ${isSelected ? colors.primary : 'transparent'}`,
        boxShadow: isSelected ? `0 0 0 3px ${colors.primary}25` : 'none',
        minHeight: '80px',
      }}
    >
      <Icon className="w-6 h-6" />
      <span className="font-semibold">{method.label}</span>
      <span
        className="text-[10px] font-normal opacity-80 text-center leading-tight px-1"
        style={{ maxWidth: '120px' }}
      >
        {method.acceptedMethods}
      </span>
    </button>
  )
}

function useColors() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return {
    bg: isDark ? '#0F172A' : '#FAFAF9',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceHover: isDark ? '#334155' : '#F8FAFC',
    border: isDark ? '#334155' : '#E2E8F0',
    borderHover: isDark ? '#475569' : '#CBD5E1',
    textPrimary: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryHover: isDark ? '#0EA5E9' : '#0C3E4A',
    primaryLight: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 76, 92, 0.08)',
    primaryGlow: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 76, 92, 0.2)',
    success: '#16A34A',
    successLight: isDark ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)',
    successGlow: isDark ? 'rgba(22, 163, 74, 0.25)' : 'rgba(22, 163, 74, 0.2)',
    warning: '#F59E0B',
    warningLight: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
    danger: '#DC2626',
    dangerLight: isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.1)',
    dangerGlow: isDark ? 'rgba(220, 38, 38, 0.25)' : 'rgba(220, 38, 38, 0.2)',
    isDark,
  }
}

export function ReceptionConfirmations({ confirmations, organizationId }: ReceptionConfirmationsProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const COLORS = useColors()

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const handleAction = async (confirmationId: string, action: 'complete' | 'no_show' | 'not_performed') => {
    setProcessing(confirmationId)

    const result = await confirmByReception({
      confirmation_id: confirmationId,
      organization_id: organizationId,
      action,
      payment_method: selectedPayment[confirmationId],
    })

    setProcessing(null)

    if (result.success) {
      setShowSuccess(confirmationId)
      setTimeout(() => {
        setShowSuccess(null)
        router.refresh()
      }, 1200)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_employee':
        return {
          label: 'Esperando empleado',
          color: COLORS.warning,
          bg: COLORS.warningLight,
          glow: COLORS.warning,
          gradient: COLORS.warningLight,
          icon: Clock
        }
      case 'pending_reception':
        return {
          label: 'Por cobrar',
          color: COLORS.primary,
          bg: COLORS.primaryLight,
          glow: COLORS.primaryGlow,
          gradient: COLORS.primaryLight,
          icon: AlertTriangle
        }
      case 'completed':
        return {
          label: 'Completado',
          color: COLORS.success,
          bg: COLORS.successLight,
          glow: COLORS.successGlow,
          gradient: COLORS.successLight,
          icon: CheckCircle
        }
      case 'no_show':
        return {
          label: 'No asistió',
          color: COLORS.danger,
          bg: COLORS.dangerLight,
          glow: COLORS.dangerGlow,
          gradient: COLORS.dangerLight,
          icon: XCircle
        }
      case 'not_performed':
        return {
          label: 'No realizado',
          color: COLORS.textMuted,
          bg: COLORS.surfaceHover,
          glow: 'transparent',
          gradient: COLORS.surfaceHover,
          icon: X
        }
      default:
        return {
          label: status,
          color: COLORS.textMuted,
          bg: COLORS.surfaceHover,
          glow: 'transparent',
          gradient: COLORS.surfaceHover,
          icon: Package
        }
    }
  }

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'pending_reception':
        return COLORS.primary
      case 'completed':
        return COLORS.success
      case 'no_show':
        return COLORS.danger
      case 'pending_employee':
        return COLORS.warning
      default:
        return COLORS.border
    }
  }

  if (!mounted) return null

  const filterOptions: { value: FilterStatus; label: string; count: number }[] = [
    { value: 'pending', label: 'Pendientes', count: pendingCount },
    { value: 'completed', label: 'Completados', count: completedCount },
    { value: 'all', label: 'Todos', count: confirmations.length },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Recepción
            </span>
            <span className="text-xs" style={{ color: COLORS.border }}>/</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: COLORS.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Confirmaciones
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1
                className="text-4xl font-bold tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}
              >
                Pagos por Cobrar
              </h1>
              <p className="mt-1 text-sm" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {pendingCount === 0
                  ? 'No hay pagos pendientes'
                  : `${pendingCount} pago${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''}`
                }
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex gap-4 overflow-x-auto pb-2 lg:pb-0">
              <div
                className="flex-shrink-0 px-5 py-3 rounded-2xl border transition-colors"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  borderWidth: 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.warningLight }}>
                    <AlertTriangle className="w-4 h-4" style={{ color: COLORS.warning }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}>
                      {pendingCount}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Pendientes
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="flex-shrink-0 px-5 py-3 rounded-2xl border transition-colors"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  borderWidth: 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.successLight }}>
                    <TrendingUp className="w-4 h-4" style={{ color: COLORS.success }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}>
                      {formatCurrencyCOP(todayIncome)}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Hoy
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="flex-shrink-0 px-5 py-3 rounded-2xl border transition-colors"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  borderWidth: 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.successLight }}>
                    <CheckCircle className="w-4 h-4" style={{ color: COLORS.success }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}>
                      {completedCount}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Completados
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="flex-shrink-0 px-5 py-3 rounded-2xl border transition-colors"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  borderWidth: 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.dangerLight }}>
                    <XCircle className="w-4 h-4" style={{ color: COLORS.danger }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}>
                      {noShowCount}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      No asisten
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-8 mb-8">
        <div className="max-w-6xl mx-auto">
          <div
            className="inline-flex p-1 rounded-xl"
            style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
          >
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  backgroundColor: filter === opt.value ? COLORS.primary : 'transparent',
                  color: filter === opt.value ? '#FFFFFF' : COLORS.textSecondary,
                  boxShadow: filter === opt.value ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                {opt.label}
                <span
                  className="ml-2 px-2 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: filter === opt.value ? 'rgba(255,255,255,0.25)' : COLORS.border,
                    color: filter === opt.value ? '#FFFFFF' : COLORS.textMuted,
                  }}
                >
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
            <div
              className="text-center py-20 rounded-3xl border"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: COLORS.border,
                borderWidth: 1,
              }}
            >
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: COLORS.primaryLight }}
              >
                <Package className="w-8 h-8" style={{ color: COLORS.primary }} />
              </div>
              <h3
                className="text-xl font-semibold mb-2"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}
              >
                Sin confirmaciones
              </h3>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary }}>
                Las confirmaciones aparecerán aquí cuando haya pagos pendientes.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {filteredConfirmations.map((conf, index) => {
                const status = getStatusConfig(conf.status)
                const StatusIcon = status.icon
                const isPending = conf.status === 'pending_reception'
                const isSuccess = showSuccess === conf.id
                const isHovered = hoveredCard === conf.id
                const borderColor = getBorderColor(conf.status)

                return (
                  <div
                    key={conf.id}
                    onMouseEnter={() => setHoveredCard(conf.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="rounded-2xl overflow-hidden transition-all duration-200"
                    style={{
                      backgroundColor: COLORS.surface,
                      borderLeft: `4px solid ${borderColor}`,
                      borderRight: `1px solid ${COLORS.border}`,
                      borderTop: `1px solid ${COLORS.border}`,
                      borderBottom: `1px solid ${COLORS.border}`,
                      boxShadow: isHovered
                        ? `0 8px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px ${borderColor}30`
                        : `0 1px 3px rgba(0, 0, 0, 0.04)`,
                      opacity: isSuccess ? 0.7 : 1,
                    }}
                  >
                    {/* Card Header with gradient */}
                    <div
                      className="px-6 py-5"
                      style={{
                        background: `linear-gradient(90deg, ${status.gradient} 0%, ${COLORS.surface} 60%)`,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left side: Avatar + Info */}
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: getAvatarColor(conf.employee_name || 'U') }}
                          >
                            {getInitials(conf.employee_name || 'Usuario')}
                          </div>

                          {/* Client & Employee Info */}
                          <div className="min-w-0">
                            {/* Client Name */}
                            <h3
                              className="text-lg font-bold truncate"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textPrimary }}
                            >
                              {conf.client_name || 'Cliente'}
                            </h3>

                            {/* Employee & Time Info */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <span className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                <span style={{ color: COLORS.textMuted }}>Hecho por:</span>{' '}
                                <span className="font-medium">{conf.employee_name || 'Empleado'}</span>
                              </span>
                              {conf.start_time && (
                                <>
                                  <span className="text-xs" style={{ color: COLORS.textMuted }}>•</span>
                                  <span className="text-xs flex items-center gap-1" style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                    <Calendar className="w-3 h-3" />
                                    {formatTime(conf.start_time)} • {formatDate(conf.start_time)}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Notes (if exists) */}
                            {conf.notes && (
                              <div
                                className="flex items-start gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg"
                                style={{ backgroundColor: COLORS.surfaceHover }}
                              >
                                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: COLORS.textMuted }} />
                                <p className="text-xs italic" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                  {conf.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right side: Amount + Status */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}>
                              {formatCurrencyCOP(conf.total_amount)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPending && (
                              <span
                                className={`text-[10px] font-semibold px-2 py-1 rounded-full ${getTimeUrgency(conf.completed_at).animate ? 'animate-pulse' : ''}`}
                                style={{
                                  backgroundColor: getTimeUrgency(conf.completed_at).bg,
                                  color: getTimeUrgency(conf.completed_at).color,
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                }}
                              >
                                ⏱ {getTimeUrgency(conf.completed_at).label}
                              </span>
                            )}
                            <span
                              className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{
                                backgroundColor: status.bg,
                                color: status.color,
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                              }}
                            >
                              {status.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom row: Type badge */}
                      <div className="flex items-center gap-2 mt-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: conf.confirmation_type === 'walkin' ? COLORS.warningLight : COLORS.primaryLight,
                            color: conf.confirmation_type === 'walkin' ? COLORS.warning : COLORS.primary,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          {conf.confirmation_type === 'walkin' ? 'Walk-in' : 'Programada'}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      {/* Services */}
                      <div className="mb-6">
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Servicios
                        </p>
                        <div className="space-y-2">
                          {conf.services.map((service, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between px-4 py-3 rounded-xl"
                              style={{ backgroundColor: COLORS.surfaceHover }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.successLight }}>
                                  <Check className="w-4 h-4" style={{ color: COLORS.success }} />
                                </div>
                                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textPrimary, fontWeight: 500 }}>
                                  {service.service_name}
                                </span>
                              </div>
                              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary, fontWeight: 600 }}>
                                {formatCurrencyCOP(service.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment Methods - Only show for pending */}
                      {isPending && (
                        <div className="mb-5">
                          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Método de pago
                          </p>

                          <div className="grid grid-cols-3 gap-3">
                            {PAYMENT_METHODS.map((method) => {
                              const Icon = method.icon
                              const isSelected = selectedPayment[conf.id] === method.id
                              return (
                                <button
                                  key={method.id}
                                  type="button"
                                  onClick={() => setSelectedPayment(prev => ({ ...prev, [conf.id]: method.id }))}
                                  disabled={processing === conf.id}
                                  className="flex-1 py-4 px-3 rounded-xl text-sm font-semibold flex flex-col items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                                  style={{
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    backgroundColor: isSelected ? COLORS.primary : COLORS.surfaceHover,
                                    color: isSelected ? '#FFFFFF' : COLORS.textSecondary,
                                    border: `2px solid ${isSelected ? COLORS.primary : 'transparent'}`,
                                    boxShadow: isSelected ? `0 0 0 3px ${COLORS.primary}25` : 'none',
                                    minHeight: '88px',
                                  }}
                                >
                                  <Icon className="w-6 h-6" />
                                  <span className="font-semibold">{method.label}</span>
                                  <span
                                    className="text-[10px] font-normal opacity-80 text-center leading-tight px-1"
                                    style={{ maxWidth: '130px' }}
                                  >
                                    {method.acceptedMethods}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {isPending && (
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          <button
                            type="button"
                            onClick={() => handleAction(conf.id, 'no_show')}
                            disabled={processing === conf.id}
                            className="py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              backgroundColor: COLORS.dangerLight,
                              color: COLORS.danger,
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                            No asistió
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(conf.id, 'not_performed')}
                            disabled={processing === conf.id}
                            className="py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              backgroundColor: COLORS.surfaceHover,
                              color: COLORS.textSecondary,
                            }}
                          >
                            <AlertTriangle className="w-4 h-4" />
                            No realizado
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(conf.id, 'complete')}
                            disabled={processing === conf.id || !selectedPayment[conf.id]}
                            className="py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              backgroundColor: isSuccess ? COLORS.success : COLORS.primary,
                              color: '#FFFFFF',
                              boxShadow: isSuccess ? `0 0 20px ${COLORS.success}40` : `0 4px 12px ${COLORS.primary}30`,
                            }}
                          >
                            {processing === conf.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isSuccess ? (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Listo!
                              </>
                            ) : (
                              <>
                                Cobrar
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Completed State */}
                      {conf.status === 'completed' && (
                        <div
                          className="flex items-center gap-3 p-4 rounded-xl"
                          style={{ backgroundColor: COLORS.successLight }}
                        >
                          <CheckCircle className="w-5 h-5" style={{ color: COLORS.success }} />
                          <div>
                            <span className="font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.success }}>
                              Pagado
                            </span>
                            <span className="text-sm ml-2" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              {conf.payment_method} • {formatCurrencyCOP(conf.total_amount)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* No Show / Not Performed State */}
                      {(conf.status === 'no_show' || conf.status === 'not_performed') && (
                        <div
                          className="flex items-center gap-3 p-4 rounded-xl"
                          style={{
                            backgroundColor: conf.status === 'no_show' ? COLORS.dangerLight : COLORS.surfaceHover,
                          }}
                        >
                          {conf.status === 'no_show' ? (
                            <XCircle className="w-5 h-5" style={{ color: COLORS.danger }} />
                          ) : (
                            <X className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                          )}
                          <span style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            color: conf.status === 'no_show' ? COLORS.danger : COLORS.textMuted,
                          }}>
                            {conf.status === 'no_show' ? 'Cliente no asistió' : 'Servicio no realizado'}
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
    </div>
  )
}