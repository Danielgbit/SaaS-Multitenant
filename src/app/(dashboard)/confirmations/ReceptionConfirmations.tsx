'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, XCircle, AlertTriangle, Clock, User, 
  DollarSign, CreditCard, Banknote, Loader2, Package,
  Filter, TrendingUp, Users, Calendar, ArrowRight,
  Check, X, EyeOff
} from 'lucide-react'
import { confirmByReception } from '@/actions/confirmations/confirmByReception'
import type { AppointmentConfirmation } from '@/actions/confirmations/types'

interface ReceptionConfirmationsProps {
  confirmations: AppointmentConfirmation[]
  organizationId: string
}

const DS = {
  primary: '#0F4C5C',
  primaryHover: '#0C3E4A',
  primaryLight: '#E0F2FE',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  successLight: '#D1FAE5',
  successDark: '#059669',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  radius: {
    lg: '16px',
    md: '10px',
    sm: '8px',
  },
}

type FilterStatus = 'pending' | 'completed' | 'all'

export function ReceptionConfirmations({ confirmations, organizationId }: ReceptionConfirmationsProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_employee':
        return { label: 'Esperando empleado', color: DS.warning, bg: DS.warningLight, icon: Clock }
      case 'pending_reception':
        return { label: 'Esperando confirmación', color: DS.primary, bg: DS.primaryLight, icon: AlertTriangle }
      case 'completed':
        return { label: 'Completado', color: DS.success, bg: DS.successLight, icon: CheckCircle }
      case 'no_show':
        return { label: 'No asistió', color: DS.danger, bg: DS.dangerLight, icon: XCircle }
      case 'not_performed':
        return { label: 'No realizado', color: DS.textMuted, bg: '#F1F5F9', icon: X }
      default:
        return { label: status, color: DS.textMuted, bg: '#F1F5F9', icon: Package }
    }
  }

  if (!mounted) return null

  const filterOptions: { value: FilterStatus; label: string; count: number }[] = [
    { value: 'pending', label: 'Pendientes', count: pendingCount },
    { value: 'completed', label: 'Completados', count: completedCount },
    { value: 'all', label: 'Todos', count: confirmations.length },
  ]

  return (
    <>
      {/* Header con gradiente */}
      <div className="relative mb-8">
        <div 
          className="absolute inset-0 rounded-3xl -z-10"
          style={{
            background: `linear-gradient(135deg, ${DS.primary} 0%, ${DS.purple} 100%)`,
            height: '200px'
          }}
        />
        <div className="pt-8 px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p 
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'rgba(255,255,255,0.8)' }}
              >
                Gestión de pagos
              </p>
              <h1 
                className="text-3xl font-bold tracking-tight mt-1"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FFFFFF' }}
              >
                Confirmar Pagos
              </h1>
              <p 
                className="text-sm mt-1"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'rgba(255,255,255,0.7)' }}
              >
                {pendingCount} servicio{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de confirmar
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FFFFFF' }}>
                    {pendingCount}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Pendientes
                  </p>
                </div>
              </div>
            </div>

            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FFFFFF' }}>
                    ${todayIncome.toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Ingresos hoy
                  </p>
                </div>
              </div>
            </div>

            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FFFFFF' }}>
                    {completedCount}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Completados
                  </p>
                </div>
              </div>
            </div>

            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FFFFFF' }}>
                    {noShowCount}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    No asistentes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-8 mb-6">
        <div 
          className="inline-flex rounded-xl p-1"
          style={{ backgroundColor: '#F1F5F9', border: `1px solid ${DS.border}` }}
        >
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                backgroundColor: filter === opt.value ? DS.surface : 'transparent',
                color: filter === opt.value ? DS.primary : DS.textSecondary,
                boxShadow: filter === opt.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {opt.label}
              <span 
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ 
                  backgroundColor: filter === opt.value ? DS.primaryLight : '#E2E8F0',
                  color: filter === opt.value ? DS.primary : DS.textMuted
                }}
              >
                {opt.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 -mt-2">
        {filteredConfirmations.length === 0 ? (
          <div 
            className="text-center py-16 rounded-2xl"
            style={{ backgroundColor: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: DS.primaryLight }}>
              <Package className="w-10 h-10" style={{ color: DS.primary }} />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: DS.textPrimary }}>
              No hay confirmaciones
            </h3>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: DS.textSecondary }}>
              Las confirmaciones aparecerán aquí cuando los empleados confirmen servicios.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConfirmations.map((conf, index) => {
              const status = getStatusBadge(conf.status)
              const StatusIcon = status.icon
              const isPending = conf.status === 'pending_reception'
              const isSuccess = showSuccess === conf.id
              
              return (
                <div
                  key={conf.id}
                  className="animate-fadeIn"
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    opacity: isSuccess ? 0.6 : 1,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <div
                    style={{
                      backgroundColor: DS.surface,
                      borderRadius: DS.radius.lg,
                      border: `1px solid ${isSuccess ? DS.success : DS.border}`,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Header */}
                    <div 
                      className="px-6 py-4 flex items-center justify-between"
                      style={{ backgroundColor: '#F8FAFC' }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: status.bg }}
                        >
                          <StatusIcon className="w-5 h-5" style={{ color: status.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-sm font-semibold px-2 py-0.5 rounded-full"
                              style={{ 
                                backgroundColor: status.bg, 
                                color: status.color,
                                fontFamily: "'Plus Jakarta Sans', sans-serif"
                              }}
                            >
                              {status.label}
                            </span>
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ 
                                backgroundColor: conf.confirmation_type === 'walkin' ? DS.warningLight : DS.primaryLight, 
                                color: conf.confirmation_type === 'walkin' ? '#B45309' : DS.primary,
                                fontFamily: "'Plus Jakarta Sans', sans-serif"
                              }}
                            >
                              {conf.confirmation_type === 'walkin' ? 'Walk-in' : 'Cita'}
                            </span>
                          </div>
                          {conf.client_name && (
                            <div className="flex items-center gap-1 mt-1">
                              <User className="w-3 h-3" style={{ color: DS.textMuted }} />
                              <span className="text-xs" style={{ color: DS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {conf.client_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: DS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Total a cobrar
                        </p>
                        <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: DS.primary }}>
                          ${conf.total_amount.toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                      {/* Services List */}
                      <div className="space-y-2 mb-4">
                        {conf.services.map((service, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg"
                            style={{ backgroundColor: '#F8FAFC' }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: DS.successLight }}>
                                <Check className="w-3 h-3" style={{ color: DS.success }} />
                              </div>
                              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: DS.textPrimary }}>
                                {service.service_name}
                              </span>
                            </div>
                            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: DS.textSecondary }}>
                              ${service.price.toLocaleString('es-CO')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {isPending && (
                        <>
                          {/* Payment Methods */}
                          <div className="mb-4">
                            <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: DS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              Método de pago:
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'efectivo', label: 'Efectivo', icon: Banknote },
                                { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                                { id: 'transferencia', label: 'Transferencia', icon: DollarSign },
                              ].map((method) => {
                                const Icon = method.icon
                                const isSelected = selectedPayment[conf.id] === method.id
                                return (
                                  <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setSelectedPayment(prev => ({ ...prev, [conf.id]: method.id }))}
                                    className={`py-3 px-2 rounded-xl text-sm font-medium flex flex-col items-center gap-1 transition-all ${isSelected ? 'ring-2 ring-offset-2' : ''}`}
                                    style={{
                                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                                      backgroundColor: isSelected ? DS.primary : '#F1F5F9',
                                      color: isSelected ? '#FFFFFF' : DS.textSecondary,
                                      border: isSelected ? `2px solid ${DS.primary}` : '2px solid transparent',
                                    }}
                                  >
                                    <Icon className="w-5 h-5" />
                                    {method.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => handleAction(conf.id, 'no_show')}
                              disabled={processing === conf.id}
                              className="py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                              style={{ 
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                backgroundColor: DS.dangerLight,
                                color: DS.danger,
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                              No asistió
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(conf.id, 'not_performed')}
                              disabled={processing === conf.id}
                              className="py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                              style={{ 
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                backgroundColor: '#F1F5F9',
                                color: DS.textSecondary,
                              }}
                            >
                              <AlertTriangle className="w-4 h-4" />
                              No realizado
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(conf.id, 'complete')}
                              disabled={processing === conf.id || !selectedPayment[conf.id]}
                              className="py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              style={{ 
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                backgroundColor: isSuccess ? DS.success : DS.primary,
                                color: '#FFFFFF',
                              }}
                            >
                              {processing === conf.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : isSuccess ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <ArrowRight className="w-4 h-4" />
                              )}
                              {isSuccess ? 'OK' : 'Confirmar'}
                            </button>
                          </div>
                        </>
                      )}

                      {conf.status === 'completed' && (
                        <div 
                          className="flex items-center gap-2 p-3 rounded-xl"
                          style={{ backgroundColor: DS.successLight }}
                        >
                          <CheckCircle className="w-5 h-5" style={{ color: DS.success }} />
                          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: DS.successDark }}>
                            Confirmado • {conf.payment_method} • ${conf.total_amount.toLocaleString('es-CO')}
                          </span>
                        </div>
                      )}

                      {(conf.status === 'no_show' || conf.status === 'not_performed') && (
                        <div 
                          className="flex items-center gap-2 p-3 rounded-xl"
                          style={{ backgroundColor: conf.status === 'no_show' ? DS.dangerLight : '#F1F5F9' }}
                        >
                          {conf.status === 'no_show' ? (
                            <XCircle className="w-5 h-5" style={{ color: DS.danger }} />
                          ) : (
                            <X className="w-5 h-5" style={{ color: DS.textMuted }} />
                          )}
                          <span style={{ 
                            fontFamily: "'Plus Jakarta Sans', sans-serif", 
                            color: conf.status === 'no_show' ? DS.danger : DS.textMuted 
                          }}>
                            {conf.status === 'no_show' ? 'Cliente no asistió' : 'Servicio no realizado'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </>
  )
}
