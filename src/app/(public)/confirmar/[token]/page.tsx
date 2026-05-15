'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AppointmentDetails {
  id: string
  start_time: string
  end_time: string
  status: string
  confirmation_status: string
  organizations: {
    name: string
    phone?: string
    address?: string
  } | null
  services: {
    name: string
  } | null
  employees: {
    name: string
  } | null
  clients: {
    name: string
    phone: string | null
  } | null
}

type ViewState = 'loading' | 'valid' | 'invalid' | 'expired' | 'used' | 'success' | 'cancelled' | 'error'

export default function ConfirmarPage() {
  const params = useParams()
  const token = params.token as string

  const [viewState, setViewState] = useState<ViewState>('loading')
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [action, setAction] = useState<'confirm' | 'cancel' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    validateAndFetch()
  }, [token])

  async function validateAndFetch() {
    try {
      const supabase = createClient()

      const { data: tokenData, error: tokenError } = await (supabase as any)
        .from('confirmation_tokens')
        .select('*')
        .eq('token', token)
        .single()

      if (tokenError || !tokenData) {
        setViewState('invalid')
        return
      }

      if (tokenData.used_at) {
        setViewState('used')
        return
      }

      if (tokenData.invalidated_at) {
        setViewState('cancelled')
        return
      }

      const now = new Date()
      const expiresAt = new Date(tokenData.expires_at)

      if (now > expiresAt) {
        setViewState('expired')
        return
      }

      const { data: appt, error: apptError } = await (supabase as any)
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          confirmation_status,
          organizations!inner(name, phone, address),
          services!inner(name),
          employees!inner(name),
          clients!inner(name, phone)
        `)
        .eq('id', tokenData.appointment_id)
        .single()

      if (apptError || !appt) {
        setViewState('error')
        return
      }

      if (appt.status === 'cancelled') {
        setViewState('cancelled')
        return
      }

      setAppointment(appt as AppointmentDetails)
      setViewState('valid')
    } catch (e) {
      console.error('[ConfirmarPage] Error:', e)
      setViewState('error')
    }
  }

  async function handleResponse(responseAction: 'confirm' | 'cancel') {
    setSubmitting(true)
    setAction(responseAction)

    try {
      const res = await fetch('/api/confirmations/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: responseAction }),
      })

      const data = await res.json()

      if (data.success) {
        setViewState(responseAction === 'confirm' ? 'success' : 'cancelled')
      } else {
        setError(data.error || 'Error al procesar la respuesta')
        setViewState('error')
      }
    } catch (e) {
      setError('Error de conexión')
      setViewState('error')
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Bogota',
    })
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota',
    })
  }

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F4C5C] to-[#1A6B7C]">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verificando tu confirmación...</p>
        </div>
      </div>
    )
  }

  if (viewState === 'invalid' || viewState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F4C5C] to-[#1A6B7C] p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Enlace inválido</h1>
          <p className="text-gray-600">
            {viewState === 'invalid'
              ? 'Este enlace de confirmación no existe o ya no es válido.'
              : error || 'Ocurrió un error al procesar tu solicitud.'}
          </p>
        </div>
      </div>
    )
  }

  if (viewState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F4C5C] to-[#1A6B7C] p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Enlace expirado</h1>
          <p className="text-gray-600">
            Este enlace de confirmación ha expirado. Por favor contacta al negocio para reprogramar tu cita.
          </p>
        </div>
      </div>
    )
  }

  if (viewState === 'used') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F4C5C] to-[#1A6B7C] p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Ya confirmado</h1>
          <p className="text-gray-600">
            Ya confirmaste tu asistencia anteriormente. ¡Gracias!
          </p>
        </div>
      </div>
    )
  }

  if (viewState === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F4C5C] to-[#1A6B7C] p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Cita cancelada</h1>
          <p className="text-gray-600">
            Esta cita ha sido cancelada. Si deseas reprogramar, por favor contacta al negocio.
          </p>
          {appointment?.organizations?.phone && (
            <p className="mt-4 text-[#0F4C5C] font-medium">
              Tel: {appointment.organizations.phone}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (viewState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#27AE60] to-[#2ECC71] p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Confirmado!</h1>
          <p className="text-gray-600 mb-4">
            Tu asistencia ha sido confirmada. ¡Nos vemos pronto!
          </p>
          {appointment && (
            <div className="bg-gray-50 rounded-xl p-4 text-left">
              <p className="font-medium text-[#0F4C5C]">{appointment.organizations?.name}</p>
              <p className="text-gray-600 text-sm">
                {formatDate(appointment.start_time)} a las {formatTime(appointment.start_time)}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!appointment) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F4C5C] to-[#1A6B7C] p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#0F4C5C] to-[#1A6B7C] p-6 text-center">
            <h1 className="text-2xl font-bold text-white">Confirmar Asistencia</h1>
            <p className="text-white/80 mt-1">{appointment.organizations?.name}</p>
          </div>

          <div className="p-6">
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h2 className="font-semibold text-gray-800 mb-3">Detalles de tu cita</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">📅</span>
                  <span className="text-gray-700">{formatDate(appointment.start_time)}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">⏰</span>
                  <span className="text-gray-700">{formatTime(appointment.start_time)}</span>
                </div>
                {appointment.services && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">💇</span>
                    <span className="text-gray-700">{appointment.services.name}</span>
                  </div>
                )}
                {appointment.employees && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">👤</span>
                    <span className="text-gray-700">{appointment.employees.name}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-gray-600 text-center mb-6">
              Hola <span className="font-semibold">{appointment.clients?.name}</span>, ¿puedes confirmar tu asistencia?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleResponse('confirm')}
                disabled={submitting}
                className="w-full py-4 px-6 bg-[#27AE60] hover:bg-[#219A52] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && action === 'confirm' ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  '✅'
                )}
                {submitting && action === 'confirm' ? 'Confirmando...' : 'Sí, confirmo mi asistencia'}
              </button>

              <button
                onClick={() => handleResponse('cancel')}
                disabled={submitting}
                className="w-full py-4 px-6 bg-white border-2 border-gray-200 hover:border-[#E74C3C] text-gray-700 hover:text-[#E74C3C] font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && action === 'cancel' ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  '❌'
                )}
                {submitting && action === 'cancel' ? 'Cancelando...' : 'No puedo asistir'}
              </button>
            </div>

            {error && (
              <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
            )}

            {appointment.organizations?.phone && (
              <p className="mt-6 text-center text-gray-500 text-sm">
                ¿Dudas? Llámanos al{' '}
                <a href={`tel:${appointment.organizations.phone}`} className="text-[#0F4C5C] font-medium">
                  {appointment.organizations.phone}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}