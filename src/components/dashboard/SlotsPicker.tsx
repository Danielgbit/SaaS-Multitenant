'use client'

import { useState, useTransition } from 'react'
import { Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { createAppointment } from '@/actions/appointments/createAppointment'
import { ClientSelector } from './ClientSelector'
import { useThemeColors } from '@/hooks/useThemeColors'

// =============================================================================
// TIPOS
// =============================================================================

interface TimeSlot {
  start_time: string
  end_time: string
  available: boolean
  blockedReason?: string
}

interface SlotsPickerProps {
  employeeId: string
  serviceId: string
  organizationId: string
  serviceName: string
  serviceDuration: number
  onSuccess?: () => void
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function SlotsPicker({
  employeeId,
  serviceId,
  organizationId,
  serviceName,
  serviceDuration,
  onSuccess,
}: SlotsPickerProps) {
const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedClientName, setSelectedClientName] = useState<string>('')
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

const COLORS = useThemeColors()
  const today = new Date().toISOString().split('T')[0]

  // Cargar slots cuando cambie la fecha
  async function loadSlots() {
    if (!selectedDate || !employeeId || !serviceId || !organizationId) {
      return
    }

    setIsLoading(true)
    setError(null)
    setSelectedSlot(null)
    setSlots([])

    try {
      const params = new URLSearchParams({
        employeeId,
        serviceId,
        date: selectedDate,
        organizationId,
      })

      const response = await fetch(`/api/slots?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar horarios')
      }

      setSlots(data.slots || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  // Efecto: cargar slots cuando cambie la fecha
  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedDate es el trigger
  // biome-ignore lint/correctness/useHookRules: hook personalizado
  // eslint-disable-next-line react-hooks/exhaustive-deps
  /* eslint-disable react-hooks/exhaustive-deps */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable react-hooks/rules-of-hooks */
  
  // Selector de fecha cambia - cargar slots
  // biome-ignore lint/correctness/useExhaustiveDependencies: dependencias intencionales
  const [, setDateTrigger] = useState(0)
  
  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value
    setSelectedDate(newDate)
    setSelectedSlot(null)
    
    // Trigger reload
    setTimeout(async () => {
      if (!newDate || !employeeId || !serviceId || !organizationId) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const params = new URLSearchParams({
          employeeId,
          serviceId,
          date: newDate,
          organizationId,
        })
        
        const response = await fetch(`/api/slots?${params}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al cargar horarios')
        }
        
        setSlots(data.slots || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }, 0)
  }

  async function handleBook() {
    if (!selectedSlot) {
      setError('Selecciona un horario')
      return
    }

    if (!selectedClientId) {
      setError('Selecciona o crea un cliente')
      return
    }

    setIsBooking(true)
    setError(null)

    try {
      const result = await createAppointment({
        employee_id: employeeId,
        client_id: selectedClientId,
        service_id: serviceId,
        start_time: selectedSlot,
        organization_id: organizationId,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        onSuccess?.()
        // Recargar slots
        loadSlots()
        setSelectedSlot(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reservar')
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div 
      className="space-y-6 p-6 rounded-2xl"
      style={{ backgroundColor: COLORS.surface }}
    >
      {/* Header */}
      <div className="text-center pb-4 border-b" style={{ borderColor: COLORS.border }}>
        <h3 
          className="text-2xl font-light mb-1"
          style={{ 
            fontFamily: 'Cormorant Garamond, serif',
            color: COLORS.textPrimary 
          }}
        >
          Reserva tu cita
        </h3>
        <p 
          className="text-sm"
          style={{ 
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            color: COLORS.textSecondary 
          }}
        >
          {serviceName} &middot; {serviceDuration} min
        </p>
      </div>

      {/* Selector de cliente */}
      <div className="space-y-3">
        <label 
          className="block text-sm font-medium"
          style={{ 
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            color: COLORS.textSecondary 
          }}
        >
          Cliente
        </label>
        <ClientSelector
          organizationId={organizationId}
          value={selectedClientId}
          onChange={(clientId, clientName) => {
            setSelectedClientId(clientId)
            setSelectedClientName(clientName)
            setError(null)
          }}
          placeholder="Buscar cliente..."
        />
      </div>

      {/* Selector de fecha */}
      <div className="space-y-3">
        <label
          htmlFor="date-picker"
          className="block text-sm font-medium"
          style={{ 
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            color: COLORS.textSecondary 
          }}
        >
          Selecciona una fecha
        </label>
        <div className="relative">
          <Calendar 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
            style={{ color: COLORS.textSecondary }} 
          />
          <input
            type="date"
            id="date-picker"
            min={today}
            value={selectedDate}
            onChange={handleDateChange}
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              borderRadius: COLORS.radius.md,
              borderColor: COLORS.border,
              backgroundColor: COLORS.surface,
              color: COLORS.textPrimary,
              padding: '12px 16px 12px 40px',
            }}
            className="w-full border focus:outline-none focus:ring-2 transition-all"
          />
        </div>
      </div>

      {/* Loading de slots */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 gap-3">
          <Spinner size="sm" className="w-5 h-5" style={{ color: COLORS.primary }} />
          <span 
            className="text-sm"
            style={{ 
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: COLORS.textSecondary 
            }}
          >
            Cargando horarios...
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div 
          className="flex items-start gap-3 p-4"
          style={{ 
            borderRadius: COLORS.radius.lg,
            backgroundColor: '#FEF2F2',
            border: `1px solid #FECACA`
          }}
        >
          <XCircle 
            className="w-5 h-5 flex-shrink-0 mt-0.5" 
            style={{ color: COLORS.error }} 
          />
          <p 
            className="text-sm"
            style={{ 
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: COLORS.error 
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div 
          className="flex items-start gap-3 p-4 animate-fade-in"
          style={{ 
            borderRadius: COLORS.radius.lg,
            backgroundColor: '#ECFDF5',
            border: `1px solid #A7F3D0`
          }}
        >
          <CheckCircle2 
            className="w-5 h-5 flex-shrink-0 mt-0.5" 
            style={{ color: COLORS.success }} 
          />
          <div>
            <p 
              className="text-sm"
              style={{ 
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: COLORS.success 
              }}
            >
              ¡Cita reservada correctamente!
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-xs underline mt-1 hover:opacity-80 transition-opacity"
              style={{ 
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: COLORS.success 
              }}
            >
              Reservar otra
            </button>
          </div>
        </div>
      )}

      {/* Grid de slots */}
      {!isLoading && selectedDate && slots.length > 0 && (
        <div className="space-y-3">
          <label 
            className="block text-sm font-medium"
            style={{ 
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: COLORS.textSecondary 
            }}
          >
            Horarios disponibles
          </label>
          <div 
            className="grid gap-2"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
          >
            {slots.map((slot) => {
              const time = new Date(slot.start_time).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })

              const isSelected = selectedSlot === slot.start_time
              const isAvailable = slot.available
              const blockedReason = slot.blockedReason

              if (!isAvailable) {
                return (
                  <div
                    key={slot.start_time}
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      borderRadius: COLORS.radius.md,
                      padding: '10px 8px',
                      backgroundColor: '#F1F5F9',
                      color: '#94A3B8',
                      cursor: 'not-allowed',
                      textDecoration: 'line-through',
                      textAlign: 'center',
                    }}
                    className="text-sm"
                    title={blockedReason}
                  >
                    <Clock className="w-4 h-4 inline-block mr-1.5" />
                    {time}
                    {blockedReason && (
                      <div className="text-[10px] mt-0.5 opacity-80 not-italic" style={{ textDecoration: 'none' }}>
                        {blockedReason}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <button
                  key={slot.start_time}
                  type="button"
                  disabled={!isAvailable || isBooking}
                  onClick={() => setSelectedSlot(slot.start_time)}
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    borderRadius: COLORS.radius.md,
                    padding: '10px 8px',
                    transition: 'all 0.2s ease',
                    ...(isSelected
                      ? { 
                          backgroundColor: COLORS.primary, 
                          color: '#FFFFFF',
                          boxShadow: `0 4px 12px ${COLORS.primary}40`
                        }
                      : isAvailable
                      ? { 
                          backgroundColor: COLORS.surface, 
                          color: COLORS.textPrimary,
                          border: `1px solid ${COLORS.border}`
                        }
                      : { 
                          backgroundColor: '#F1F5F9', 
                          color: '#94A3B8',
                          cursor: 'not-allowed',
                          textDecoration: 'line-through'
                        })
                  }}
                  className="text-sm font-medium hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  <Clock className="w-4 h-4 inline-block mr-1.5" />
                  {time}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Sin slots disponibles */}
      {!isLoading && selectedDate && slots.length === 0 && !error && (
        <div 
          className="text-center py-8"
          style={{ color: COLORS.textSecondary }}
        >
          <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p 
            className="mb-1"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            No hay horarios disponibles para esta fecha.
          </p>
          <p 
            className="text-sm"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', opacity: 0.8 }}
          >
            Intenta con otra fecha.
          </p>
        </div>
      )}

      {/* Botón de reserva */}
      {selectedSlot && !success && (
        <button
          type="button"
          disabled={isBooking}
          onClick={handleBook}
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            borderRadius: COLORS.radius.md,
            padding: '14px 24px',
            backgroundColor: COLORS.primary,
            color: '#FFFFFF',
            transition: 'all 0.2s ease',
            boxShadow: `0 4px 14px ${COLORS.primary}30`,
          }}
          className="w-full font-semibold hover:shadow-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isBooking ? (
            <>
              <Spinner size="sm" />
              Reservando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Confirmar reserva
            </>
          )}
        </button>
      )}
    </div>
  )
}
