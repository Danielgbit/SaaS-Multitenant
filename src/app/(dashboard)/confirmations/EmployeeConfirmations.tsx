'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, Clock, Package, User, Phone, FileText, 
  Loader2, Plus, DollarSign, Calendar, Sparkles, 
  ArrowRight, AlertCircle, Check
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { createConfirmation } from '@/actions/confirmations/createConfirmation'
import type { AppointmentConfirmation, ConfirmationService } from '@/actions/confirmations/types'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    headerBg: isDark 
      ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
      : 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)',
    headerText: isDark ? '#FFFFFF' : '#0F172A',
    headerTextMuted: isDark ? 'rgba(255,255,255,0.8)' : '#475569',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceSubtle: isDark ? '#0F172A' : '#F1F5F9',
    surfaceGlass: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)',
    border: isDark ? '#334155' : '#CBD5E1',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#64748B',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#DCFCE7',
    successDark: isDark ? '#6EE7B7' : '#059669',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    warning: '#F59E0B',
    warningLight: isDark ? '#451A03' : '#FEF3C7',
    purple: '#8B5CF6',
    purpleLight: isDark ? '#2E1065' : '#EDE9FE',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.5)',
    isDark,
  }
}

interface EmployeeConfirmationsProps {
  confirmations: AppointmentConfirmation[]
  organizationId: string
  employeeId: string
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
  const COLORS = useColors()

  useEffect(() => {
    setMounted(true)
  }, [])

  const pendingConfirmations = confirmations.filter(c => c.status === 'pending_employee')
  
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
            background: COLORS.headerBg,
            height: '180px',
            boxShadow: COLORS.isDark ? 'none' : '0 4px 20px rgba(15, 76, 92, 0.3)'
          }}
        />
        <div className="pt-8 px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p 
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.headerTextMuted }}
              >
                Gestión de servicios
              </p>
              <h1 
                className="text-3xl font-bold tracking-tight mt-1"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.headerText }}
              >
                Mis Servicios
              </h1>
              <p 
                className="text-sm mt-1"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.headerTextMuted }}
              >
                {pendingConfirmations.length} servicio{pendingConfirmations.length !== 1 ? 's' : ''} pendiente{pendingConfirmations.length !== 1 ? 's' : ''} de confirmar
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/confirmations/walkin')}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: '10px',
                backgroundColor: '#FFFFFF',
                color: COLORS.primary,
                padding: '14px 28px',
              }}
              className="font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              Nuevo Walk-in
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: COLORS.surfaceGlass, backdropFilter: 'blur(10px)', border: `1px solid ${COLORS.border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                  <Calendar className="w-5 h-5" style={{ color: COLORS.primary }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}>
                    {scheduledCount}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Citas
                  </p>
                </div>
              </div>
            </div>
            
            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: COLORS.surfaceGlass, backdropFilter: 'blur(10px)', border: `1px solid ${COLORS.border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.warning + '20' }}>
                  <Sparkles className="w-5 h-5" style={{ color: COLORS.warning }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}>
                    {walkinCount}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Walk-ins
                  </p>
                </div>
              </div>
            </div>

            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: COLORS.surfaceGlass, backdropFilter: 'blur(10px)', border: `1px solid ${COLORS.border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.success + '20' }}>
                  <DollarSign className="w-5 h-5" style={{ color: COLORS.success }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}>
                    ${todayIncome.toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
            className="text-center py-16 rounded-2xl animate-in fade-in duration-300"
            style={{ 
              backgroundColor: COLORS.surfaceGlass,
              border: `1px solid ${COLORS.border}`,
              backdropFilter: 'blur(12px)'
            }}
          >
            <div 
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: COLORS.successLight }}
            >
              <CheckCircle className="w-10 h-10" style={{ color: COLORS.success }} />
            </div>
            <h3 
              className="text-xl font-semibold mb-2" 
              style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}
            >
              Todo al día
            </h3>
            <p 
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary }} 
              className="max-w-sm mx-auto"
            >
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
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    opacity: isSuccess ? 0.5 : 1,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <div
                    style={{
                      backgroundColor: COLORS.surfaceGlass,
                      borderRadius: '16px',
                      border: `1px solid ${COLORS.border}`,
                      overflow: 'hidden',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    {/* Header */}
                    <div 
                      className="px-6 py-4 flex items-center justify-between"
                      style={{
                        background: isScheduled 
                          ? (COLORS.isDark ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)')
                          : COLORS.warningLight,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ 
                            backgroundColor: isScheduled ? COLORS.primary + '20' : COLORS.warningLight
                          }}
                        >
                          {isScheduled ? (
                            <Calendar className="w-5 h-5" style={{ color: COLORS.primary }} />
                          ) : (
                            <Sparkles className="w-5 h-5" style={{ color: COLORS.warning }} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-sm font-semibold"
                              style={{ 
                                fontFamily: "'Plus Jakarta Sans', sans-serif", 
                                color: isScheduled ? COLORS.primary : COLORS.warning 
                              }}
                            >
                              {isScheduled ? 'Cita agendada' : 'Walk-in'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3" style={{ color: COLORS.textMuted }} />
                            <span className="text-xs" style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              {formatTimeAgo(conf.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Total
                        </p>
                        <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.primary }}>
                          ${conf.total_amount.toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                      {conf.client_name && (
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                            <User className="w-4 h-4" style={{ color: COLORS.primary }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textPrimary }}>
                              {conf.client_name}
                            </p>
                            {conf.client_phone && (
                              <p className="text-xs" style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {conf.client_phone}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Services */}
                      <div className="space-y-2 mb-4">
                        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Selecciona los servicios realizados:
                        </p>
                        {conf.services.map((service, idx) => {
                          const isSelected = selectedServices[`${conf.id}-${service.service_id}`] ?? service.performed
                          return (
                            <label
                              key={idx}
                              className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200"
                              style={{ 
                                backgroundColor: isSelected ? COLORS.successLight : COLORS.surfaceSubtle,
                                border: `1px solid ${isSelected ? COLORS.success : COLORS.border}`,
                              }}
                            >
                              <div 
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isSelected ? 'bg-green-500' : 'bg-white dark:bg-slate-800 border-2'}`}
                                style={{ borderColor: isSelected ? COLORS.success : COLORS.border }}
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
                                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textPrimary }} className="font-medium">
                                  {service.service_name}
                                </p>
                              </div>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.primary }} className="text-lg font-bold">
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
                        className="w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                        style={{ 
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          backgroundColor: isSuccess ? COLORS.success : COLORS.primary,
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
    </>
  )
}
