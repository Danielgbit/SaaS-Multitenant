'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Package, User, Phone, FileText, Loader2, Check, 
  Search, ArrowLeft, ArrowRight, Sparkles, Clock,
  CreditCard, Banknote, DollarSign, X, ShoppingCart,
  CheckCircle, AlertCircle
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { createConfirmation } from '@/actions/confirmations/createConfirmation'
import type { ConfirmationService } from '@/actions/confirmations/types'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
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
    warning: '#F59E0B',
    warningLight: isDark ? '#451A03' : '#FEF3C7',
    danger: '#DC2626',
    dangerLight: isDark ? '#450A0A' : '#FEE2E2',
    purple: '#8B5CF6',
    purpleLight: isDark ? '#2E1065' : '#EDE9FE',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.5)',
    isDark,
  }
}

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

interface WalkinFormProps {
  services: Service[]
  organizationId: string
  employeeId: string
}

type Step = 'services' | 'client' | 'confirm' | 'success'

const STEPS = [
  { id: 'services', label: 'Servicios', icon: Package },
  { id: 'client', label: 'Cliente', icon: User },
  { id: 'confirm', label: 'Confirmar', icon: CheckCircle },
]

export function WalkinForm({ services, organizationId, employeeId }: WalkinFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('services')
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const COLORS = useColors()

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const total = Array.from(selectedServices).reduce((sum, id) => {
    const service = services.find(s => s.id === id)
    return sum + (service?.price || 0)
  }, 0)

  const selectedCount = selectedServices.size

  const toggleService = (id: string) => {
    const newSet = new Set(selectedServices)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedServices(newSet)
  }

  const canProceedToClient = selectedCount > 0
  const canSubmit = clientName.trim().length > 0

  const handleSubmit = async () => {
    if (!clientName.trim()) {
      setError('Ingresa el nombre del cliente')
      return
    }

    setSubmitting(true)
    setError('')

    const servicesData: ConfirmationService[] = Array.from(selectedServices).map(id => {
      const service = services.find(s => s.id === id)!
      return {
        service_id: service.id,
        service_name: service.name,
        price: service.price,
        performed: true
      }
    })

    const result = await createConfirmation({
      organization_id: organizationId,
      employee_id: employeeId,
      services: servicesData,
      confirmation_type: 'walkin',
      client_name: clientName.trim(),
      client_phone: clientPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    })

    setSubmitting(false)

    if (result.success) {
      setStep('success')
      setTimeout(() => {
        router.push('/confirmations')
        router.refresh()
      }, 2000)
    } else {
      setError(result.error || 'Error al registrar')
    }
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === step)
  const isConfirmStep = step === 'confirm'
  const isSuccessStep = step === 'success'

  if (!mounted) return null

  if (isSuccessStep) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-scaleIn">
          <div 
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.successLight }}
          >
            <CheckCircle className="w-12 h-12" style={{ color: COLORS.success }} />
          </div>
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}
          >
            Walk-in registrado
          </h2>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary }}>
            La confirmación llegó a recepción.
          </p>
        </div>
        <style jsx>{`
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-scaleIn {
            animation: scaleIn 0.4s ease-out;
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm mb-4 transition-colors cursor-pointer"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary }}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        
        <h1 
          className="text-2xl font-bold"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}
        >
          Registrar Walk-in
        </h1>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary }} className="text-sm mt-1">
          Registra un servicio sin cita previa
        </p>
      </div>

      {/* Stepper Visual */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {STEPS.map((s, idx) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isCompleted = STEPS.findIndex(s => s.id === step) > idx
            
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      backgroundColor: isActive ? COLORS.primary : isCompleted ? COLORS.success : COLORS.surfaceSubtle,
                      color: isActive || isCompleted ? '#FFFFFF' : COLORS.textMuted,
                    }}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span 
                    className="text-xs mt-2 font-medium"
                    style={{ 
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      color: isActive ? COLORS.primary : COLORS.textMuted 
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div 
                    className="w-16 h-0.5 mx-2"
                    style={{ 
                      backgroundColor: isCompleted ? COLORS.success : COLORS.border 
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating Preview - Always visible */}
      <div 
        className="fixed bottom-6 right-6 z-40 animate-slideUp"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          padding: '16px 20px',
          minWidth: '200px',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: COLORS.primary + '20' }}
          >
            <ShoppingCart className="w-5 h-5" style={{ color: COLORS.primary }} />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {selectedCount} servicio{selectedCount !== 1 ? 's' : ''}
            </p>
            <p className="text-lg font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.primary }}>
              ${total.toLocaleString('es-CO')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto pb-24">
        
        {/* Step 1: Services */}
        {step === 'services' && (
          <div className="animate-fadeIn">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: COLORS.textMuted }} />
              <input
                type="text"
                placeholder="Buscar servicios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  borderRadius: '10px',
                  borderColor: COLORS.border,
                  padding: '14px 14px 14px 48px',
                  color: COLORS.textPrimary,
                  backgroundColor: COLORS.surface,
                }}
                className={`w-full border-2 focus:outline-none transition-colors ${COLORS.isDark ? 'focus:border-sky-400' : 'focus:border-[#0F4C5C]'}`}
              />
            </div>

            {/* Services Grid */}
            {filteredServices.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: COLORS.surfaceGlass, border: `1px solid ${COLORS.border}` }}>
                <Package className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.textMuted, opacity: 0.5 }} />
                <p style={{ color: COLORS.textMuted }}>No hay servicios disponibles</p>
              </div>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                {filteredServices.map((service) => {
                  const isSelected = selectedServices.has(service.id)
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.id)}
                      className="p-4 rounded-xl text-left transition-all duration-200 hover:shadow-md cursor-pointer"
                      style={{
                        backgroundColor: isSelected ? COLORS.primary + '15' : COLORS.surface,
                        border: `2px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span 
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ 
                            backgroundColor: isSelected ? COLORS.primary : COLORS.surfaceSubtle,
                            color: isSelected ? '#FFFFFF' : COLORS.textMuted,
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                          }}
                        >
                          {service.duration} min
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p 
                        className="font-medium"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textPrimary }}
                      >
                        {service.name}
                      </p>
                      <p 
                        className="text-lg font-bold mt-1"
                        style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.primary }}
                      >
                        ${service.price.toLocaleString('es-CO')}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Action */}
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setStep('client')}
                disabled={!canProceedToClient}
                className="py-3 px-6 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  background: COLORS.primaryGradient,
                  color: '#FFFFFF',
                }}
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Client Info */}
        {step === 'client' && (
          <div className="animate-fadeIn">
            <div 
              className="rounded-2xl p-6"
              style={{ backgroundColor: COLORS.surfaceGlass, border: `1px solid ${COLORS.border}`, backdropFilter: 'blur(12px)' }}
            >
              <h3 className="text-lg font-semibold mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.textPrimary }}>
                Datos del cliente
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Nombre del cliente *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: COLORS.textMuted }} />
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nombre completo"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        borderRadius: '10px',
                        borderColor: error && !clientName.trim() ? COLORS.danger : COLORS.border,
                        padding: '14px 14px 14px 48px',
                        color: COLORS.textPrimary,
                        backgroundColor: COLORS.surface,
                      }}
                      className={`w-full border-2 focus:outline-none transition-colors ${COLORS.isDark ? 'focus:border-sky-400' : 'focus:border-[#0F4C5C]'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Teléfono (opcional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: COLORS.textMuted }} />
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Número de teléfono"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        borderRadius: '10px',
                        borderColor: COLORS.border,
                        padding: '14px 14px 14px 48px',
                        color: COLORS.textPrimary,
                        backgroundColor: COLORS.surface,
                      }}
                      className={`w-full border-2 focus:outline-none transition-colors ${COLORS.isDark ? 'focus:border-sky-400' : 'focus:border-[#0F4C5C]'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Información adicional..."
                    rows={3}
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      borderRadius: '10px',
                      borderColor: COLORS.border,
                      padding: '14px',
                      color: COLORS.textPrimary,
                      backgroundColor: COLORS.surface,
                    }}
                    className={`w-full border-2 focus:outline-none transition-colors resize-none ${COLORS.isDark ? 'focus:border-sky-400' : 'focus:border-[#0F4C5C]'}`}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 mt-4 p-3 rounded-lg" style={{ backgroundColor: COLORS.dangerLight }}>
                  <AlertCircle className="w-5 h-5" style={{ color: COLORS.danger }} />
                  <span style={{ color: COLORS.danger, fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="text-sm">
                    {error}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep('services')}
                className="flex-1 py-3 rounded-xl font-medium transition-colors cursor-pointer"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textSecondary,
                  backgroundColor: COLORS.surface,
                }}
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep('confirm')}
                disabled={!canSubmit}
                className="flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  background: COLORS.primaryGradient,
                  color: '#FFFFFF',
                }}
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="animate-fadeIn">
            <div 
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              {/* Header */}
              <div 
                className="p-6"
                style={{ background: COLORS.primaryGradient }}
              >
                <h3 className="text-xl font-semibold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Resumen del servicio
                </h3>
                <p className="text-sm text-white/70 mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Confirma los detalles antes de enviar
                </p>
              </div>

              {/* Client Info */}
              <div className="p-6 border-b" style={{ borderColor: COLORS.border }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                    <User className="w-5 h-5" style={{ color: COLORS.primary }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: COLORS.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {clientName}
                    </p>
                    {clientPhone && (
                      <p className="text-sm" style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {clientPhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="p-6">
                <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Servicios ({selectedCount})
                </p>
                <div className="space-y-2">
                  {Array.from(selectedServices).map(id => {
                    const service = services.find(s => s.id === id)
                    return (
                      <div key={id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textPrimary }}>
                          {service?.name}
                        </span>
                        <span className="font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.primary }}>
                          ${service?.price.toLocaleString('es-CO')}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: COLORS.border }}>
                  <span className="font-semibold" style={{ color: COLORS.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Total a cobrar
                  </span>
                  <span className="text-3xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: COLORS.primary }}>
                    ${total.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep('client')}
                className="flex-1 py-3 rounded-xl font-medium transition-colors cursor-pointer"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textSecondary,
                  backgroundColor: COLORS.surface,
                }}
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  background: COLORS.primaryGradient,
                  color: '#FFFFFF',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
