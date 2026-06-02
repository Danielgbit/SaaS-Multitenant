'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Scissors, Calendar, User } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { createPublicBooking } from '@/actions/public/createPublicBooking'
import { formatTime, formatDate as formatDateUtil, formatDuration } from '@/lib/utils/formatTime'
import { StepService } from './booking/StepService'
import { StepDateTime } from './booking/StepDateTime'
import { StepClient } from './booking/StepClient'
import { BookingConfirmed } from './booking/BookingConfirmed'

interface Service { id: string; name: string; duration: number; price: number }
interface Employee { id: string; name: string }
interface Organization { id: string; name: string; slug: string }
interface TimeSlot { start_time: string; end_time: string; available: boolean; blockedReason?: string }

type BookingStep = 'service' | 'datetime' | 'client' | 'confirmed'

export function BookingWizard({ organization, services, employees }: {
  organization: Organization; services: Service[]; employees: Employee[]
}) {
  const colors = useThemeColors()
  const [mounted, setMounted] = useState(false)
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

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (selectedEmployee && selectedService && selectedDate) fetchSlots()
  }, [selectedEmployee, selectedService, selectedDate])

  const fetchSlots = async () => {
    if (!selectedEmployee || !selectedService || !selectedDate) return
    setLoadingSlots(true); setError('')
    try {
      const res = await fetch(`/api/slots?employeeId=${selectedEmployee.id}&serviceId=${selectedService.id}&date=${selectedDate}&organizationId=${organization.id}`)
      const data = await res.json()
      if (data.error) return setError(data.error)
      if (data.slots) setAvailableSlots(data.slots)
    } catch { setError('Error al cargar horarios') }
    finally { setLoadingSlots(false) }
  }

  const handleSubmit = async () => {
    if (!selectedService || !selectedEmployee || !selectedSlot || !clientName || !clientPhone) {
      return setError('Por favor completa todos los campos')
    }
    setIsSubmitting(true); setError('')
    try {
      const result = await createPublicBooking({
        organizationSlug: organization.slug, serviceId: selectedService.id, employeeId: selectedEmployee.id,
        clientName, clientPhone, clientEmail, startTime: selectedSlot, notes: clientNotes,
      })
      if (result.error) return setError(result.error)
      setStep('confirmed')
    } catch { setError('Error al crear la reserva. Intenta de nuevo.') }
    finally { setIsSubmitting(false) }
  }

  const selectService = (service: Service) => {
    setSelectedService(service)
    setSelectedEmployee(null); setSelectedDate(''); setSelectedSlot('')
    setStep('datetime')
  }

  const getStepNumber = () => step === 'service' ? 1 : step === 'datetime' ? 2 : 3
  const stepIcons = [Scissors, Calendar, User]
  const stepLabels = ['Servicio', 'Horario', 'Tus datos']

  if (!mounted) {
    return (
      <div className="min-h-screen px-4 py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-[20px] bg-white shadow-md overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-teal-700 to-teal-800" />
            <div className="p-8 space-y-4">
              <div className="h-8 bg-gray-100 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="space-y-3 mt-8">
                <div className="h-16 bg-gray-50 rounded-lg" />
                <div className="h-16 bg-gray-50 rounded-lg" />
                <div className="h-16 bg-gray-50 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'confirmed') {
    return (
      <BookingConfirmed
        selectedService={selectedService} selectedEmployee={selectedEmployee}
        selectedDate={selectedDate} selectedSlot={selectedSlot}
        organizationName={organization.name} colors={colors}
        onNewBooking={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: colors.surfaceSubtle }}>
      <div className="max-w-4xl mx-auto">
        {/* Mobile: Organization Header (outside card) */}
        <div className="text-center mb-6 md:hidden">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: colors.textPrimary }}>
            {organization.name}
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Reserva tu cita en línea
          </p>
        </div>

        {/* Mobile: Sticky Summary */}
        {(selectedService || selectedDate || selectedSlot) && (
          <div
            className="md:hidden mb-6 p-4"
            style={{
              borderRadius: colors.radius.sm,
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              boxShadow: colors.shadow.tealSm
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>Tu reserva</span>
              {selectedService && (
                <span className="text-xs px-2 py-0.5" style={{ borderRadius: colors.radius.sm, backgroundColor: colors.primarySubtle, color: colors.primary }}>
                  Paso {getStepNumber()} de 3
                </span>
              )}
            </div>
            {selectedService && (
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{selectedService.name}</span>
                <span className="text-sm font-semibold" style={{ color: colors.primary }}>{formatPrice(selectedService.price)}</span>
              </div>
            )}
            {selectedService && (
              <div className="text-xs mb-2" style={{ color: colors.textSecondary }}>{formatDuration(selectedService.duration)}</div>
            )}
            {selectedDate && selectedSlot && (
              <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
                <Calendar className="w-3.5 h-3.5" style={{ color: colors.textMuted }} />
                <span>{formatDateUtil(selectedDate)} · {formatTime(selectedSlot)}</span>
              </div>
            )}
            {selectedEmployee && (
              <div className="flex items-center gap-2 text-xs mt-1" style={{ color: colors.textSecondary }}>
                <User className="w-3.5 h-3.5" style={{ color: colors.textMuted }} />
                <span>{selectedEmployee.name}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-6 items-start">
          {/* Main Wizard Card */}
          <div
            className="flex-1 overflow-hidden"
            style={{
              borderRadius: colors.radius.card,
              boxShadow: colors.shadow.tealMd,
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`
            }}
          >
            {/* Desktop: Gradient Header */}
            <div
              className="hidden md:block px-8 py-8 text-center"
              style={{ background: colors.primaryGradient }}
            >
              <h1 className="text-2xl font-semibold mb-1" style={{ color: colors.surface }}>
                {organization.name}
              </h1>
              <p className="text-sm" style={{ color: colors.surface, opacity: 0.85 }}>
                Reserva tu cita en línea
              </p>
            </div>

            {/* Mobile: Gradient Header (compact) */}
            <div
              className="md:hidden px-6 py-4 text-center"
              style={{ background: colors.primaryGradient }}
            >
              <p className="text-sm font-medium" style={{ color: colors.surface }}>
                {organization.name}
              </p>
            </div>

            {/* Step Indicator */}
            <div className="px-8 pt-8 pb-2">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-4 left-0 right-0 h-0.5" style={{ backgroundColor: colors.border }} />
                  <div
                    className="absolute top-4 left-0 h-0.5"
                    style={{
                      width: `${((getStepNumber() - 1) / 2) * 100}%`,
                      backgroundColor: colors.primary,
                      transition: colors.transition
                    }}
                  />
                  {[1, 2, 3].map((s) => {
                    const Icon = stepIcons[s - 1]
                    const isActive = getStepNumber() === s
                    const isCompleted = getStepNumber() > s
                    return (
                      <div key={s} className="flex flex-col items-center relative z-10">
                        <div
                          className="w-8 h-8 flex items-center justify-center"
                          style={{
                            borderRadius: colors.radius.sm,
                            backgroundColor: isCompleted ? colors.success : isActive ? colors.primary : colors.surface,
                            border: `2px solid ${isCompleted ? colors.success : isActive ? colors.primary : colors.borderLight}`,
                            transition: colors.transition,
                            boxShadow: isActive ? `0 0 0 4px ${colors.primary}20` : 'none'
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" style={{ color: colors.surface }} />
                          ) : (
                            <Icon className="w-4 h-4" style={{ color: isActive ? colors.surface : colors.textMuted }} />
                          )}
                        </div>
                        <span
                          className="text-xs mt-2 font-medium"
                          style={{ color: isActive ? colors.textPrimary : colors.textMuted }}
                        >
                          {stepLabels[s - 1]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

            {/* Service Context Bar */}
            {step !== 'service' && selectedService && (
              <div className="mx-8 mt-6 p-4" style={{ borderRadius: colors.radius.sm, backgroundColor: colors.primarySubtle, border: `1px solid ${colors.primary}20` }}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{selectedService.name}</span>
                    <span className="text-sm ml-2" style={{ color: colors.textSecondary }}>{formatDuration(selectedService.duration)}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: colors.primary }}>
                    {formatPrice(selectedService.price)}
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mx-8 mt-6 p-4" style={{ backgroundColor: colors.errorLight, borderRadius: colors.radius.sm }}>
                <p className="text-sm font-medium" style={{ color: colors.error }}>{error}</p>
              </div>
            )}

            {/* Step Content */}
            {step === 'service' && (
              <StepService services={services} selectedService={selectedService} onSelect={selectService} colors={colors} />
            )}
            {step === 'datetime' && (
              <StepDateTime
                selectedService={selectedService} selectedEmployee={selectedEmployee}
                selectedDate={selectedDate} selectedSlot={selectedSlot}
                availableSlots={availableSlots} loadingSlots={loadingSlots}
                employees={employees} colors={colors}
                onSelectEmployee={(emp) => { setSelectedEmployee(emp); setSelectedSlot('') }}
                onSelectDate={(d) => { setSelectedDate(d); setSelectedSlot('') }}
                onSelectSlot={setSelectedSlot}
                onContinue={() => setStep('client')}
                onBack={() => setStep('service')}
              />
            )}
            {step === 'client' && (
              <StepClient
                clientName={clientName} clientPhone={clientPhone} clientEmail={clientEmail}
                clientNotes={clientNotes} isSubmitting={isSubmitting} colors={colors}
                onNameChange={setClientName} onPhoneChange={setClientPhone}
                onEmailChange={setClientEmail} onNotesChange={setClientNotes}
                onSubmit={handleSubmit} onBack={() => setStep('datetime')}
              />
            )}
          </div>

          {/* Desktop: Sticky Summary Sidebar */}
          {(selectedService || selectedDate || selectedSlot) && (
            <div
              className="hidden md:block w-64 sticky top-8 p-6"
              style={{
                borderRadius: colors.radius.card,
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                boxShadow: colors.shadow.tealSm
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>Tu reserva</span>
                {selectedService && (
                  <span className="text-xs px-2 py-0.5" style={{ borderRadius: colors.radius.sm, backgroundColor: colors.primarySubtle, color: colors.primary }}>
                    Paso {getStepNumber()} de 3
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {selectedService && (
                  <div>
                    <span className="text-xs block mb-1" style={{ color: colors.textMuted }}>Servicio</span>
                    <span className="text-sm font-medium block" style={{ color: colors.textPrimary }}>{selectedService.name}</span>
                    <span className="text-xs" style={{ color: colors.textSecondary }}>{formatDuration(selectedService.duration)}</span>
                  </div>
                )}

                {selectedDate && (
                  <div>
                    <span className="text-xs block mb-1" style={{ color: colors.textMuted }}>Fecha</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formatDateUtil(selectedDate)}</span>
                  </div>
                )}

                {selectedSlot && (
                  <div>
                    <span className="text-xs block mb-1" style={{ color: colors.textMuted }}>Hora</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formatTime(selectedSlot)}</span>
                  </div>
                )}

                {selectedEmployee && (
                  <div>
                    <span className="text-xs block mb-1" style={{ color: colors.textMuted }}>Profesional</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{selectedEmployee.name}</span>
                  </div>
                )}

                {selectedService && (
                  <div
                    className="pt-4 mt-4 flex justify-between items-center"
                    style={{ borderTop: `1px solid ${colors.border}` }}
                  >
                    <span className="text-xs font-semibold uppercase" style={{ color: colors.textMuted }}>Total</span>
                    <span className="text-lg font-bold" style={{ color: colors.primary }}>{formatPrice(selectedService.price)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: colors.textMuted }}>Powered by Prügressy</p>
      </div>
    </div>
  )
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price)
}
