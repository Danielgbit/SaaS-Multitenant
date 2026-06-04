'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, Clock, Package, User, Phone, 
  DollarSign, Calendar, Sparkles, 
  ArrowRight, Check, Wallet
} from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'
import { createConfirmation } from '@/actions/confirmations/createConfirmation'
import type { ConfirmationService } from '@/types/confirmations'
import type { AppointmentConfirmation } from '@/actions/confirmations/types'
import { Badge } from '@/components/ui/Badge'

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
  const COLORS = useThemeColors()

  const pendingConfirmations = confirmations.filter(c => c.status === 'pending_employee')
  
  const todayIncome = pendingConfirmations.reduce((sum, c) => sum + c.total_amount, 0)
  const scheduledCount = pendingConfirmations.filter(c => c.confirmation_type === 'scheduled').length
  const walkinCount = pendingConfirmations.filter(c => c.confirmation_type === 'walkin').length
  const totalCount = pendingConfirmations.length

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

  const areAllSelected = (conf: AppointmentConfirmation) => {
    return conf.services.every(s => selectedServices[`${conf.id}-${s.service_id}`] ?? s.performed)
  }

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
              <p className="text-xs font-semibold uppercase tracking-widest"
                style={{  color: COLORS.headerTextMuted }}>
                Gestión de servicios
              </p>
              <h1 className="font-heading text-3xl font-bold tracking-tight mt-1"
                style={{ color: COLORS.headerText }}>
                Mis Servicios
              </h1>
              <p className="text-sm mt-1" style={{  color: COLORS.headerTextMuted }}>
                {totalCount} servicio{totalCount !== 1 ? 's' : ''} pendiente{totalCount !== 1 ? 's' : ''} de confirmar
              </p>
            </div>

            <button type="button" onClick={() => router.push('/confirmations/walkin')}
              style={{  borderRadius: '10px', backgroundColor: COLORS.surface, color: COLORS.primary, padding: '14px 28px' }}
              className="font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer">
              <Sparkles className="w-5 h-5" />
              Nuevo Walk-in
            </button>
          </div>

          {/* Bento Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="col-span-2 rounded-xl p-4" style={{ backgroundColor: COLORS.surfaceGlass, backdropFilter: 'blur(10px)', border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                  <Wallet className="w-5 h-5" style={{ color: COLORS.primary }} />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                    ${todayIncome.toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                    Por cobrar
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.surfaceGlass, backdropFilter: 'blur(10px)', border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                  <Calendar className="w-5 h-5" style={{ color: COLORS.primary }} />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                    {scheduledCount}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                    Citas
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.surfaceGlass, backdropFilter: 'blur(10px)', border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.warning + '20' }}>
                  <Sparkles className="w-5 h-5" style={{ color: COLORS.warning }} />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                    {walkinCount}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                    Walk-ins
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
          <div className="text-center py-20 rounded-2xl animate-in fade-in duration-300"
            style={{ backgroundColor: COLORS.surfaceGlass, border: `1px solid ${COLORS.border}`, backdropFilter: 'blur(12px)' }}>
            <div className="w-24 h-24 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.successLight }}>
              <CheckCircle className="w-12 h-12" style={{ color: COLORS.success }} />
            </div>
            <h3 className="font-heading text-heading-2 font-semibold mb-2" style={{ color: COLORS.textPrimary }}>
              Todo al día
            </h3>
            <p style={{  color: COLORS.textSecondary }} className="max-w-sm mx-auto">
              No tienes servicios pendientes de confirmar. ¡Buen trabajo!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingConfirmations.map((conf, index) => {
              const isScheduled = conf.confirmation_type === 'scheduled'
              const isSuccess = showSuccess === conf.id
              const allSelected = areAllSelected(conf)
              
              return (
                <div key={conf.id}
                  className="animate-in fade-in slide-in-from-bottom-3"
                  style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}>
                  <div className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200" style={{
                    backgroundColor: COLORS.surfaceGlass,
                    borderRadius: '16px',
                    border: `1px solid ${COLORS.border}`,
                    overflow: 'hidden',
                    backdropFilter: 'blur(12px)',
                    opacity: isSuccess ? 0.5 : 1,
                    transition: 'opacity 0.3s ease, box-shadow 0.2s ease, transform 0.2s ease',
                  }}>
                    
                    {/* Header */}
                    <div className="px-6 py-4 flex items-center justify-between"
                      style={{ background: isScheduled 
                        ? (COLORS.isDark ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' : `linear-gradient(135deg, ${COLORS.surfaceHover} 0%, ${COLORS.border} 100%)`)
                        : COLORS.warningLight }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: isScheduled ? COLORS.primary + '20' : COLORS.warningLight }}>
                          {isScheduled ? <Calendar className="w-5 h-5" style={{ color: COLORS.primary }} />
                            : <Sparkles className="w-5 h-5" style={{ color: COLORS.warning }} />}
                        </div>
                        <div>
                          <Badge variant={isScheduled ? 'primary' : 'warning'} size="md">
                            {isScheduled ? 'Cita agendada' : 'Walk-in'}
                          </Badge>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3" style={{ color: COLORS.textMuted }} />
                            <span className="text-xs" style={{ color: COLORS.textMuted }}>
                              {formatTimeAgo(conf.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>Total</p>
                        <p className="font-heading text-2xl font-bold" style={{ color: COLORS.primary }}>
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
                            <p className="font-medium" style={{  color: COLORS.textPrimary }}>
                              {conf.client_name}
                            </p>
                            {conf.client_phone && (
                              <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: COLORS.textMuted }}>
                                <Phone className="w-3 h-3" /> {conf.client_phone}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Services */}
                      <div className="space-y-2 mb-4">
                        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
                          Selecciona los servicios realizados:
                        </p>
                        {conf.services.map((service, idx) => {
                          const isSelected = selectedServices[`${conf.id}-${service.service_id}`] ?? service.performed
                          return (
                            <label key={idx}
                              className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200"
                              style={{ 
                                backgroundColor: isSelected ? `${COLORS.success}12` : COLORS.surfaceSubtle,
                                border: `1.5px solid ${isSelected ? COLORS.success : COLORS.border}`,
                              }}>
                              <div className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200"
                                style={{ 
                                  backgroundColor: isSelected ? COLORS.success : 'transparent',
                                  border: isSelected ? 'none' : `2px solid ${COLORS.border}`,
                                }}>
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </div>
                              <input type="checkbox" checked={isSelected}
                                onChange={() => handleServiceToggle(conf.id, service.service_id)} className="sr-only" />
                              <div className="flex-1">
                                <p className="font-medium text-sm" style={{  color: COLORS.textPrimary }}>
                                  {service.service_name}
                                </p>
                              </div>
                              <span className="font-heading font-bold" style={{ color: COLORS.primary }}>
                                ${service.price.toLocaleString('es-CO')}
                              </span>
                            </label>
                          )
                        })}
                      </div>

                      {/* Submit */}
                      {isSuccess ? (
                        <div className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
                          style={{ backgroundColor: COLORS.success, color: '#FFFFFF' }}>
                          <CheckCircle className="w-5 h-5" />
                          Confirmado
                        </div>
                      ) : (
                        <button type="button" onClick={() => handleConfirm(conf)} disabled={submitting === conf.id}
                          className="w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                          style={{ 
                            
                            backgroundColor: COLORS.primary,
                            color: COLORS.textOnPrimary,
                            boxShadow: `0 4px 12px ${COLORS.primary}30`,
                          }}>
                          {submitting === conf.id ? (
                            <><Spinner size="sm" className="w-5 h-5" /> Confirmando...</>
                          ) : (
                            <><CheckCircle className="w-5 h-5" /> Confirmar {allSelected ? 'servicios' : 'selección'} <ArrowRight className="w-4 h-4" /></>
                          )}
                        </button>
                      )}
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
