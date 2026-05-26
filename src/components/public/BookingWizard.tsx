'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Spinner } from '@/components/ui'
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

type BookingStep = 'service' | 'datetime' | 'client' | 'confirming' | 'confirmed'

const COLORS = {
  primary: '#0F4C5C', primaryLight: '#1A6B7C', surface: '#FFFFFF', surfaceSubtle: '#F8FAFB',
  border: '#E8ECEE', borderLight: '#F0F3F4', textPrimary: '#1A2B32', textSecondary: '#5A6B70',
  textMuted: '#8A9A9E', success: '#059669', successLight: '#D1FAE5', warning: '#D97706',
  warningLight: '#FEF3C7', error: '#DC2626', errorLight: '#FEE2E2',
}

export function BookingWizard({ organization, services, employees }: {
  organization: Organization; services: Service[]; employees: Employee[]
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

  if (step === 'confirmed') {
    return (
      <BookingConfirmed
        selectedService={selectedService} selectedEmployee={selectedEmployee}
        selectedDate={selectedDate} selectedSlot={selectedSlot}
        organizationName={organization.name} colors={COLORS}
        onNewBooking={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2" style={{ color: COLORS.textPrimary }}>{organization.name}</h1>
          <p style={{ color: COLORS.textSecondary }}>Reserva tu cita en línea</p>
        </div>

        {step !== 'confirming' && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: getStepNumber() >= s ? COLORS.primary : COLORS.borderLight, color: getStepNumber() >= s ? '#FFF' : COLORS.textMuted }}>
                    {getStepNumber() > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                  </div>
                  {s < 3 && <div className="w-12 h-0.5 mx-2" style={{ backgroundColor: getStepNumber() > s ? COLORS.primary : COLORS.borderLight }} />}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs px-8" style={{ color: COLORS.textMuted }}>
              <span>Servicio</span><span>Horario</span><span>Tus datos</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: COLORS.errorLight }}>
            <p className="text-sm font-medium" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
          {step === 'service' && (
            <StepService services={services} selectedService={selectedService} onSelect={selectService} colors={COLORS} />
          )}
          {step === 'datetime' && (
            <StepDateTime
              selectedService={selectedService} selectedEmployee={selectedEmployee}
              selectedDate={selectedDate} selectedSlot={selectedSlot}
              availableSlots={availableSlots} loadingSlots={loadingSlots}
              employees={employees} colors={COLORS}
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
              clientNotes={clientNotes} isSubmitting={isSubmitting} colors={COLORS}
              onNameChange={setClientName} onPhoneChange={setClientPhone}
              onEmailChange={setClientEmail} onNotesChange={setClientNotes}
              onSubmit={handleSubmit} onBack={() => setStep('datetime')}
            />
          )}
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: COLORS.textMuted }}>Powered by Prügressy</p>
      </div>
    </div>
  )
}
