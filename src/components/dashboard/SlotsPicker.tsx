'use client'

import { useState, useTransition } from 'react'
import { Loader2, Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react'
import { createAppointment } from '@/actions/appointments/createAppointment'
import { ClientSelector } from './ClientSelector'

// =============================================================================
// TIPOS
// =============================================================================

interface TimeSlot {
  start_time: string
  end_time: string
  available: boolean
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

  // Fecha mínima (hoy)
  const today = new Date().toISOString().split('T')[0]

  // Design system tokens
  const DS = {
    primary: '#0F4C5C',
    primaryHover: '#0C3E4A',
    primaryLight: '#E6F1F4',
    bg: '#FAFAF9',
    surface: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    border: '#E2E8F0',
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#DC2626',
    radius: {
      sm: '6px',
      md: '10px',
      lg: '16px',
      xl: '24px',
    },
  }

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
      style={{ backgroundColor: DS.surface }}
    >
      {/* Header */}
      <div className="text-center pb-4 border-b" style={{ borderColor: DS.border }}>
        <h3 
          className="text-2xl font-light mb-1"
          style={{ 
            fontFamily: 'Cormorant Garamond, serif',
            color: DS.textPrimary 
          }}
        >
          Reserva tu cita
        </h3>
        <p 
          className="text-sm"
          style={{ 
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            color: DS.textSecondary 
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
            color: DS.textSecondary 
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
            color: DS.textSecondary 
          }}
        >
          Selecciona una fecha
        </label>
        <div className="relative">
          <Calendar 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
            style={{ color: DS.textSecondary }} 
          />
          <input
            type="date"
            id="date-picker"
            min={today}
            value={selectedDate}
            onChange={handleDateChange}
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              borderRadius: DS.radius.md,
              borderColor: DS.border,
              backgroundColor: DS.surface,
              color: DS.textPrimary,
              padding: '12px 16px 12px 40px',
            }}
            className="w-full border focus:outline-none focus:ring-2 transition-all"
          />
        </div>
      </div>

      {/* Loading de slots */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 gap-3">
          <Loader2 
            className="w-5 h-5 animate-spin" 
            style={{ color: DS.primary }} 
          />
          <span 
            className="text-sm"
            style={{ 
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: DS.textSecondary 
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
            borderRadius: DS.radius.lg,
            backgroundColor: '#FEF2F2',
            border: `1px solid #FECACA`
          }}
        >
          <XCircle 
            className="w-5 h-5 flex-shrink-0 mt-0.5" 
            style={{ color: DS.error }} 
          />
          <p 
            className="text-sm"
            style={{ 
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: DS.error 
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
            borderRadius: DS.radius.lg,
            backgroundColor: '#ECFDF5',
            border: `1px solid #A7F3D0`
          }}
        >
          <CheckCircle2 
            className="w-5 h-5 flex-shrink-0 mt-0.5" 
            style={{ color: DS.success }} 
          />
          <div>
            <p 
              className="text-sm"
              style={{ 
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: DS.success 
              }}
            >
              ¡Cita reservada correctamente!
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-xs underline mt-1 hover:opacity-80 transition-opacity"
              style={{ 
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: DS.success 
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
              color: DS.textSecondary 
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

              return (
                <button
                  key={slot.start_time}
                  type="button"
                  disabled={!isAvailable || isBooking}
                  onClick={() => setSelectedSlot(slot.start_time)}
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    borderRadius: DS.radius.md,
                    padding: '10px 8px',
                    transition: 'all 0.2s ease',
                    ...(isSelected
                      ? { 
                          backgroundColor: DS.primary, 
                          color: '#FFFFFF',
                          boxShadow: `0 4px 12px ${DS.primary}40`
                        }
                      : isAvailable
                      ? { 
                          backgroundColor: DS.surface, 
                          color: DS.textPrimary,
                          border: `1px solid ${DS.border}`
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
          style={{ color: DS.textSecondary }}
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
            borderRadius: DS.radius.md,
            padding: '14px 24px',
            backgroundColor: DS.primary,
            color: '#FFFFFF',
            transition: 'all 0.2s ease',
            boxShadow: `0 4px 14px ${DS.primary}30`,
          }}
          className="w-full font-semibold hover:shadow-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isBooking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
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
