'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  X,
  Scissors,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'
import { createPublicBooking } from '@/actions/public/createPublicBooking'
import { formatTime, formatDate as formatDateUtil, formatDuration } from '@/lib/utils/formatTime'

// =============================================================================
// TIPOS
// =============================================================================

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface Employee {
  id: string
  name: string
}

interface Organization {
  id: string
  name: string
  slug: string
}

interface TimeSlot {
  start_time: string
  end_time: string
  available: boolean
  blockedReason?: string
}

type BookingStep = 'service' | 'datetime' | 'client' | 'confirming' | 'confirmed'

// =============================================================================
// COLORS (del design system)
// =============================================================================

const COLORS = {
  primary: '#0F4C5C',
  primaryLight: '#1A6B7C',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFB',
  border: '#E8ECEE',
  borderLight: '#F0F3F4',
  textPrimary: '#1A2B32',
  textSecondary: '#5A6B70',
  textMuted: '#8A9A9E',
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BookingWizard({ 
  organization, 
  services, 
  employees 
}: { 
  organization: Organization
  services: Service[]
  employees: Employee[]
}) {
  const [step, setStep] = useState<BookingStep>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientNotes, setClientNotes] = useState('')
  
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmedAppointmentId, setConfirmedAppointmentId] = useState('')

  // Fetch slots when date/employee/service changes
  useEffect(() => {
    if (selectedEmployee && selectedService && selectedDate) {
      fetchSlots()
    }
  }, [selectedEmployee, selectedService, selectedDate])

  const fetchSlots = async () => {
    if (!selectedEmployee || !selectedService || !selectedDate) return
    
    setLoadingSlots(true)
    setError('')
    
    try {
      const res = await fetch(
        `/api/slots?employeeId=${selectedEmployee.id}&serviceId=${selectedService.id}&date=${selectedDate}&organizationId=${organization.id}`
      )
      const data = await res.json()
      
      if (data.error) {
        setError(data.error)
        return
      }
      
      if (data.slots) {
        setAvailableSlots(data.slots)
      }
    } catch (e) {
      console.error('Error fetching slots:', e)
      setError('Error al cargar horarios')
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedService || !selectedEmployee || !selectedSlot || !clientName || !clientPhone) {
      setError('Por favor completa todos los campos')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await createPublicBooking({
        organizationSlug: organization.slug,
        serviceId: selectedService.id,
        employeeId: selectedEmployee.id,
        clientName,
        clientPhone,
        clientEmail,
        startTime: selectedSlot,
        notes: clientNotes,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setConfirmedAppointmentId(result.appointmentId || '')
      setStep('confirmed')
    } catch (e) {
      console.error('Error creating booking:', e)
      setError('Error al crear la reserva. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price)
  }

  const getStepNumber = () => {
    switch (step) {
      case 'service': return 1
      case 'datetime': return 2
      case 'client': return 3
      default: return 3
    }
  }

  // ===========================================================================
  // RENDER: CONFIRMED
  // ===========================================================================
  
  if (step === 'confirmed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl p-8 shadow-lg" style={{ border: `1px solid ${COLORS.border}` }}>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: COLORS.successLight }}>
                <CheckCircle2 className="w-10 h-10" style={{ color: COLORS.success }} />
              </div>
              <h1 className="text-2xl font-semibold" style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}>
                ¡Reserva confirmada!
              </h1>
              <p className="mt-2" style={{ color: COLORS.textSecondary }}>
                Tu cita ha sido agendada exitosamente
              </p>
            </div>

            <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: COLORS.surfaceSubtle }}>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: COLORS.textMuted }}>Servicio</span>
                  <span className="font-medium" style={{ color: COLORS.textPrimary }}>{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: COLORS.textMuted }}>Profesional</span>
                  <span className="font-medium" style={{ color: COLORS.textPrimary }}>{selectedEmployee?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: COLORS.textMuted }}>Fecha</span>
                  <span className="font-medium" style={{ color: COLORS.textPrimary }}>{selectedDate && formatDateUtil(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: COLORS.textMuted }}>Hora</span>
                  <span className="font-medium" style={{ color: COLORS.textPrimary }}>{selectedSlot && formatTime(selectedSlot)}</span>
                </div>
              </div>
            </div>

            <p className="text-center text-sm" style={{ color: COLORS.textMuted }}>
              Te hemos enviado un recordatorio a tu teléfono. 
              <br />
              Gracias por confiar en {organization.name}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3 rounded-xl font-medium"
              style={{ backgroundColor: COLORS.primary, color: '#FFF' }}
            >
              Reservar otra cita
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===========================================================================
  // RENDER: MAIN WIZARD
  // ===========================================================================

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2" style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}>
            {organization.name}
          </h1>
          <p style={{ color: COLORS.textSecondary }}>
            Reserva tu cita en línea
          </p>
        </div>

        {/* Step Indicator */}
        {step !== 'confirming' && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ 
                      backgroundColor: getStepNumber() >= s ? COLORS.primary : COLORS.borderLight,
                      color: getStepNumber() >= s ? '#FFF' : COLORS.textMuted
                    }}
                  >
                    {getStepNumber() > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div 
                      className="w-12 h-0.5 mx-2" 
                      style={{ backgroundColor: getStepNumber() > s ? COLORS.primary : COLORS.borderLight }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs px-8" style={{ color: COLORS.textMuted }}>
              <span>Servicio</span>
              <span>Horario</span>
              <span>Tus datos</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: COLORS.errorLight }}>
            <p className="text-sm font-medium" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
          
          {/* STEP 1: SERVICE */}
          {step === 'service' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                  <Scissors className="w-5 h-5" style={{ color: COLORS.primary }} />
                </div>
                <h2 className="text-xl font-semibold" style={{ color: COLORS.textPrimary }}>
                  ¿Qué servicio necesitas?
                </h2>
              </div>

              <div className="space-y-3">
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service)
                      setSelectedEmployee(null)
                      setSelectedDate('')
                      setSelectedSlot('')
                      setStep('datetime')
                    }}
                    className="w-full p-4 rounded-2xl text-left transition-all hover:scale-[1.01]"
                    style={{ 
                      backgroundColor: selectedService?.id === service.id ? COLORS.primary + '10' : COLORS.surfaceSubtle,
                      border: `1px solid ${selectedService?.id === service.id ? COLORS.primary : COLORS.border}`
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium" style={{ color: COLORS.textPrimary }}>{service.name}</h3>
                        <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
                          {formatDuration(service.duration)}
                        </p>
                      </div>
                      <span className="font-semibold" style={{ color: COLORS.primary }}>
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: DATETIME */}
          {step === 'datetime' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                  <Calendar className="w-5 h-5" style={{ color: COLORS.primary }} />
                </div>
                <h2 className="text-xl font-semibold" style={{ color: COLORS.textPrimary }}>
                  ¿Cuándo quieres venir?
                </h2>
              </div>

              {/* Selected Service Summary */}
              <div className="mb-6 p-3 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: COLORS.textSecondary }}>{selectedService?.name}</span>
                  <span className="text-sm font-medium" style={{ color: COLORS.primary }}>{formatDuration(selectedService?.duration || 0)}</span>
                </div>
              </div>

              {/* Employee Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: COLORS.textPrimary }}>
                  Selecciona profesional
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {employees.map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployee(emp)
                        setSelectedSlot('')
                      }}
                      className="p-3 rounded-xl text-center transition-all"
                      style={{ 
                        backgroundColor: selectedEmployee?.id === emp.id ? COLORS.primary + '15' : COLORS.surfaceSubtle,
                        border: `1px solid ${selectedEmployee?.id === emp.id ? COLORS.primary : COLORS.border}`
                      }}
                    >
                      <User className="w-5 h-5 mx-auto mb-1" style={{ color: selectedEmployee?.id === emp.id ? COLORS.primary : COLORS.textMuted }} />
                      <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>{emp.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: COLORS.textPrimary }}>
                  Selecciona fecha
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedSlot('')
                  }}
                  className="w-full px-4 py-3 rounded-xl"
                  style={{ 
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: COLORS.surface,
                    color: COLORS.textPrimary
                  }}
                />
              </div>

              {/* Slots */}
              {selectedDate && selectedEmployee && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                      Horarios disponibles
                    </label>
                    <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.textMuted }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.success }} />
                      <span>Disponible</span>
                      <div className="w-2 h-2 rounded-full ml-2" style={{ backgroundColor: COLORS.warning }} />
                      <span>Ocupado</span>
                    </div>
                  </div>

                  {loadingSlots ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.primary }} />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-6 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                      <p className="text-sm" style={{ color: COLORS.textMuted }}>No hay horarios disponibles para esta fecha.</p>
                      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Intenta con otra fecha o profesional.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Morning */}
                      {availableSlots.filter(s => parseInt(s.start_time.split('T')[1].slice(0, 2)) < 13).length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
                            <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}>Mañana</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.surfaceSubtle, color: COLORS.textMuted }}>Antes de 1 PM</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {availableSlots
                              .filter(s => parseInt(s.start_time.split('T')[1].slice(0, 2)) < 13)
                              .map((slot, idx) => {
                                const startTime = formatTime(slot.start_time)
                                const endTime = formatTime(slot.end_time)
                                const isSelected = selectedSlot === slot.start_time
                                const isAvailable = slot.available

                                return (
                                  <div
                                    key={slot.start_time}
                                    className={`relative rounded-xl p-4 transition-all duration-200 ${isAvailable ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed'}`}
                                    style={{
                                      backgroundColor: isAvailable
                                        ? isSelected ? COLORS.primary : COLORS.surfaceSubtle
                                        : COLORS.surfaceSubtle,
                                      border: `2px solid ${isAvailable ? isSelected ? COLORS.primary : COLORS.success + '40' : COLORS.border}`,
                                      borderLeft: `4px solid ${isAvailable ? COLORS.success : slot.blockedReason ? COLORS.warning : COLORS.border}`,
                                      boxShadow: isSelected ? `0 4px 16px ${COLORS.primary}30` : 'none',
                                      opacity: isAvailable ? 1 : 0.7,
                                    }}
                                    onClick={() => isAvailable && setSelectedSlot(slot.start_time)}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-lg font-bold" style={{ 
                                        color: isAvailable ? COLORS.textPrimary : COLORS.textMuted,
                                        fontFamily: 'Cormorant Garamond, serif'
                                      }}>
                                        {startTime} → {endTime}
                                      </span>
                                      {isAvailable ? (
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.success }}>
                                          <CheckCircle2 className="w-3 h-3 text-white" />
                                        </div>
                                      ) : (
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.warning }}>
                                          <Clock className="w-3 h-3 text-white" />
                                        </div>
                                      )}
                                    </div>

                                    <span className="text-xs px-2 py-1 rounded-lg" style={{ 
                                      backgroundColor: isAvailable ? COLORS.success + '15' : COLORS.warning + '15',
                                      color: isAvailable ? COLORS.success : COLORS.warning
                                    }}>
                                      {slot.available ? 'Disponible' : (slot.blockedReason || 'Ocupado')}
                                    </span>

                                    {!isAvailable && slot.blockedReason && (
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap" style={{ 
                                        backgroundColor: COLORS.textPrimary, 
                                        color: COLORS.surface,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                      }}>
                                        {slot.blockedReason}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Afternoon */}
                      {availableSlots.filter(s => parseInt(s.start_time.split('T')[1].slice(0, 2)) >= 13).length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
                            <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}>Tarde</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.surfaceSubtle, color: COLORS.textMuted }}>Desde 1 PM</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {availableSlots
                              .filter(s => parseInt(s.start_time.split('T')[1].slice(0, 2)) >= 13)
                              .map((slot, idx) => {
                                const startTime = formatTime(slot.start_time)
                                const endTime = formatTime(slot.end_time)
                                const isSelected = selectedSlot === slot.start_time
                                const isAvailable = slot.available

                                return (
                                  <div
                                    key={slot.start_time}
                                    className={`relative rounded-xl p-4 transition-all duration-200 ${isAvailable ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed'}`}
                                    style={{
                                      backgroundColor: isAvailable
                                        ? isSelected ? COLORS.primary : COLORS.surfaceSubtle
                                        : COLORS.surfaceSubtle,
                                      border: `2px solid ${isAvailable ? isSelected ? COLORS.primary : COLORS.success + '40' : COLORS.border}`,
                                      borderLeft: `4px solid ${isAvailable ? COLORS.success : slot.blockedReason ? COLORS.warning : COLORS.border}`,
                                      boxShadow: isSelected ? `0 4px 16px ${COLORS.primary}30` : 'none',
                                      opacity: isAvailable ? 1 : 0.7,
                                    }}
                                    onClick={() => isAvailable && setSelectedSlot(slot.start_time)}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-lg font-bold" style={{
                                        color: isAvailable ? COLORS.textPrimary : COLORS.textMuted,
                                        fontFamily: 'var(--font-dm-sans), sans-serif',
                                        fontWeight: 600
                                      }}>
                                        {startTime} → {endTime}
                                      </span>
                                      {isAvailable ? (
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.success }}>
                                          <CheckCircle2 className="w-3 h-3 text-white" />
                                        </div>
                                      ) : (
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.warning }}>
                                          <Clock className="w-3 h-3 text-white" />
                                        </div>
                                      )}
                                    </div>

                                    <span className="text-xs px-2 py-1 rounded-lg" style={{ 
                                      backgroundColor: isAvailable ? COLORS.success + '15' : COLORS.warning + '15',
                                      color: isAvailable ? COLORS.success : COLORS.warning
                                    }}>
                                      {slot.available ? 'Disponible' : (slot.blockedReason || 'Ocupado')}
                                    </span>

                                    {!isAvailable && slot.blockedReason && (
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap" style={{ 
                                        backgroundColor: COLORS.textPrimary, 
                                        color: COLORS.surface,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                      }}>
                                        {slot.blockedReason}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Legend */}
                      <div className="flex items-center justify-center gap-6 pt-4 border-t" style={{ borderColor: COLORS.border }}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.success }} />
                          <span className="text-xs" style={{ color: COLORS.textSecondary }}>Disponible</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.warning }} />
                          <span className="text-xs" style={{ color: COLORS.textSecondary }}>Ocupado - hover para razón</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('service')}
                  className="px-4 py-3 rounded-xl font-medium"
                  style={{ 
                    color: COLORS.textSecondary,
                    backgroundColor: COLORS.surfaceSubtle
                  }}
                >
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Atrás
                </button>
                <button
                  onClick={() => setStep('client')}
                  disabled={!selectedSlot}
                  className="flex-1 py-3 rounded-xl font-medium"
                  style={{ 
                    backgroundColor: selectedSlot ? COLORS.primary : COLORS.borderLight,
                    color: selectedSlot ? '#FFF' : COLORS.textMuted
                  }}
                >
                  Continuar <ChevronRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CLIENT INFO */}
          {step === 'client' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                  <User className="w-5 h-5" style={{ color: COLORS.primary }} />
                </div>
                <h2 className="text-xl font-semibold" style={{ color: COLORS.textPrimary }}>
                  ¿Quién eres?
                </h2>
              </div>

              {/* Booking Summary */}
              <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.textMuted }}>Servicio</span>
                    <span style={{ color: COLORS.textPrimary }}>{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.textMuted }}>Profesional</span>
                    <span style={{ color: COLORS.textPrimary }}>{selectedEmployee?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.textMuted }}>Fecha y hora</span>
                    <span style={{ color: COLORS.textPrimary }}>
                      {selectedDate && formatDateUtil(selectedDate)} a las {selectedSlot && formatTime(selectedSlot)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                    Nombre completo *
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: COLORS.textMuted }} />
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full pl-12 pr-4 py-3 rounded-xl"
                      style={{ 
                        border: `1px solid ${COLORS.border}`,
                        backgroundColor: COLORS.surface,
                        color: COLORS.textPrimary
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                    Teléfono *
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: COLORS.textMuted }} />
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Tu número de teléfono"
                      className="w-full pl-12 pr-4 py-3 rounded-xl"
                      style={{ 
                        border: `1px solid ${COLORS.border}`,
                        backgroundColor: COLORS.surface,
                        color: COLORS.textPrimary
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                    Email (opcional)
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: COLORS.textMuted }} />
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="Tu correo electrónico"
                      className="w-full pl-12 pr-4 py-3 rounded-xl"
                      style={{ 
                        border: `1px solid ${COLORS.border}`,
                        backgroundColor: COLORS.surface,
                        color: COLORS.textPrimary
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                    Notas (opcional)
                  </label>
                  <textarea
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="Alguna información adicional..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl resize-none"
                    style={{ 
                      border: `1px solid ${COLORS.border}`,
                      backgroundColor: COLORS.surface,
                      color: COLORS.textPrimary
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('datetime')}
                  className="px-4 py-3 rounded-xl font-medium"
                  style={{ 
                    color: COLORS.textSecondary,
                    backgroundColor: COLORS.surfaceSubtle
                  }}
                >
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!clientName || !clientPhone || isSubmitting}
                  className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                  style={{ 
                    backgroundColor: (clientName && clientPhone && !isSubmitting) ? COLORS.primary : COLORS.borderLight,
                    color: (clientName && clientPhone && !isSubmitting) ? '#FFF' : COLORS.textMuted
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Reservando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Confirmar reserva
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs" style={{ color: COLORS.textMuted }}>
          Powered by Prügressy
        </p>
      </div>
    </div>
  )
}
