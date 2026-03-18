'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, Clock, Package, User, Phone, FileText, 
  Loader2, Plus, DollarSign, Calendar, Sparkles, 
  ArrowRight, AlertCircle, Check
} from 'lucide-react'
import { createConfirmation } from '@/actions/confirmations/createConfirmation'
import type { AppointmentConfirmation, ConfirmationService } from '@/actions/confirmations/types'

interface EmployeeConfirmationsProps {
  confirmations: AppointmentConfirmation[]
  organizationId: string
  employeeId: string
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
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  radius: {
    lg: '16px',
    md: '10px',
    sm: '8px',
  },
}

export function EmployeeConfirmations({ 
  confirmations: initialConfirmations, 
  organizationId, 
  employeeId 
}: EmployeeConfirmationsProps) {
  const router = useRouter()
  const [confirmations, setConfirmations] = useState(initialConfirmations)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({})
  const [showSuccess, setShowSuccess] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const pendingConfirmations = confirmations.filter(c => c.status === 'pending_employee')
  
  // Stats
  const todayIncome = pendingConfirmations.reduce((sum, c) => sum + c.total_amount, 0)
  const scheduledCount = pendingConfirmations.filter(c => c.confirmation_type === 'scheduled').length
  const walkinCount = pendingConfirmations.filter(c => c.confirmation_type === 'walkin').length

  const handleServiceToggle = (confirmationId: string, serviceId: string) => {
    setSelectedServices(prev => ({
      ...prev,
      [`${confirmationId}-${serviceId}`]: !prev[`${confirmationId}-${serviceId}`]
    }))
  }

  const handleConfirm = async (confirmation: AppointmentConfirmation) => {
    setSubmitting(confirmation.id)

    const services: ConfirmationService[] = confirmation.services.map(s => ({
      ...s,
      performed: selectedServices[`${confirmation.id}-${s.service_id}`] ?? s.performed
    }))

    const result = await createConfirmation({
      organization_id: organizationId,
      employee_id: employeeId,
      appointment_id: confirmation.appointment_id || undefined,
      services,
      confirmation_type: confirmation.confirmation_type,
    })

    setSubmitting(null)

    if (result.success) {
      setShowSuccess(confirmation.id)
      setTimeout(() => {
        setShowSuccess(null)
        router.refresh()
      }, 1500)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return 'hace un momento'
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
    return `hace ${Math.floor(diff / 86400)} días`
  }

  if (!mounted) return null

  return (
    <>
      {/* Header con gradiente */}
      <div className="relative mb-8">
        <div 
          className="absolute inset-0 rounded-3xl -z-10"
          style={{
            background: `linear-gradient(135deg, ${DS.primary} 0%, ${DS.primaryHover} 100%)`,
            height: '180px'
          }}
        />
        <div className="pt-8 px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p 
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'rgba(255,255,255,0.8)' }}
              >
                Gestión de servicios
              </p>
              <h1 
                className="text-3xl font-bold tracking-tight mt-1"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FFFFFF' }}
              >
                Mis Servicios
              </h1>
              <p 
                className="text-sm mt-1"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'rgba(255,255,255,0.7)' }}
              >
                {pendingConfirmations.length} servicio{pendingConfirmations.length !== 1 ? 's' : ''} pendiente{pendingConfirmations.length !== 1 ? 's' : ''} de confirmar
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/confirmations/walkin')}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: DS.radius.md,
                backgroundColor: '#FFFFFF',
                color: DS.primary,
                padding: '14px 28px',
              }}
              className="font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Nuevo Walk-in
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FFFFFF' }}>
                    {scheduledCount}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Citas
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
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FFFFFF' }}>
                    {walkinCount}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Walk-ins
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
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#FFFFFF' }}>
                    ${todayIncome.toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Total
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 -mt-4">
        {pendingConfirmations.length === 0 ? (
          <div 
            className="text-center py-16 rounded-2xl"
            style={{ backgroundColor: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: DS.successLight }}>
              <CheckCircle className="w-10 h-10" style={{ color: DS.success }} />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: DS.textPrimary }}>
              Todo al día
            </h3>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: DS.textSecondary }} className="max-w-sm mx-auto">
              No tienes servicios pendientes de confirmar. ¡Buen trabajo!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingConfirmations.map((conf, index) => {
              const isScheduled = conf.confirmation_type === 'scheduled'
              const isSuccess = showSuccess === conf.id
              
              return (
                <div
                  key={conf.id}
                  className="animate-fadeIn"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    opacity: isSuccess ? 0.5 : 1,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <div
                    style={{
                      backgroundColor: DS.surface,
                      borderRadius: DS.radius.lg,
                      border: `1px solid ${DS.border}`,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Header */}
                    <div 
                      className="px-6 py-4 flex items-center justify-between"
                      style={{
                        background: isScheduled 
                          ? 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)'
                          : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ 
                            backgroundColor: isScheduled ? DS.primaryLight : DS.warningLight 
                          }}
                        >
                          {isScheduled ? (
                            <Calendar className="w-5 h-5" style={{ color: DS.primary }} />
                          ) : (
                            <Sparkles className="w-5 h-5" style={{ color: DS.warning }} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-sm font-semibold"
                              style={{ 
                                fontFamily: "'Plus Jakarta Sans', sans-serif", 
                                color: isScheduled ? DS.primary : '#B45309' 
                              }}
                            >
                              {isScheduled ? 'Cita agendada' : 'Walk-in'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3" style={{ color: DS.textMuted }} />
                            <span className="text-xs" style={{ color: DS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              {formatTimeAgo(conf.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: DS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Total
                        </p>
                        <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: DS.primary }}>
                          ${conf.total_amount.toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                      {conf.client_name && (
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: '#F8FAFC' }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: DS.primaryLight }}>
                            <User className="w-4 h-4" style={{ color: DS.primary }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: DS.textPrimary }}>
                              {conf.client_name}
                            </p>
                            {conf.client_phone && (
                              <p className="text-xs" style={{ color: DS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {conf.client_phone}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Services */}
                      <div className="space-y-2 mb-4">
                        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: DS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Selecciona los servicios realizados:
                        </p>
                        {conf.services.map((service, idx) => {
                          const isSelected = selectedServices[`${conf.id}-${service.service_id}`] ?? service.performed
                          return (
                            <label
                              key={idx}
                              className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200"
                              style={{ 
                                backgroundColor: isSelected ? DS.successLight : '#F8FAFC',
                                border: `1px solid ${isSelected ? DS.success : DS.border}`,
                              }}
                            >
                              <div 
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isSelected ? 'bg-green-500' : 'bg-white border-2'}`}
                                style={{ borderColor: isSelected ? DS.success : DS.border }}
                              >
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleServiceToggle(conf.id, service.service_id)}
                                className="sr-only"
                              />
                              <div className="flex-1">
                                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: DS.textPrimary }} className="font-medium">
                                  {service.service_name}
                                </p>
                              </div>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", color: DS.primary }} className="text-lg font-bold">
                                ${service.price.toLocaleString('es-CO')}
                              </span>
                            </label>
                          )
                        })}
                      </div>

                      {/* Submit */}
                      <button
                        type="button"
                        onClick={() => handleConfirm(conf)}
                        disabled={submitting === conf.id || isSuccess}
                        className="w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        style={{ 
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          backgroundColor: isSuccess ? DS.success : DS.primary,
                          color: '#FFFFFF',
                        }}
                      >
                        {isSuccess ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Confirmado
                          </>
                        ) : submitting === conf.id ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Confirmando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Confirmar servicios
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
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
          animation: fadeIn 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </>
  )
}
