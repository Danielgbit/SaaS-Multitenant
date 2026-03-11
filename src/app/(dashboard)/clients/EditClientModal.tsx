'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, UserCircle, Check, AlertCircle } from 'lucide-react'
import { useActionState } from 'react'
import { createClient } from '@/actions/clients/createClient'
import type { Database } from '@/../types/supabase'

type Client = Database['public']['Tables']['clients']['Row']

interface EditClientModalProps {
  client: Client | null
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Design system tokens (light mode only) - Premium minimal design
const DS = {
  primary: '#0F4C5C',
  primaryHover: '#0C3E4A',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  error: '#DC2626',
  success: '#059669',
  overlay: 'rgba(15, 23, 42, 0.4)',
  radius: {
    lg: '16px',
    md: '10px',
    sm: '8px',
  },
  shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
  transition: 'all 0.2s ease-out',
}

const initialState = {
  success: false,
  error: undefined,
  fieldErrors: undefined,
}

export function EditClientModal({
  client,
  organizationId,
  isOpen,
  onClose,
  onSuccess,
}: EditClientModalProps) {
  // Use different action based on whether we're creating or editing
  const [state, formAction] = useActionState(createClient, initialState)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Determine if we're creating a new client
  const isNewClient = !client

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false)
    }
  }, [isOpen])

  // Handle success
  useEffect(() => {
    if (state.success) {
      // Small delay to show success state
      const timer = setTimeout(() => {
        onSuccess()
        onClose()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [state.success, onSuccess, onClose])

  if (!isOpen && !isClosing) return null

  // Calculate if form is in loading state
  const isLoading = isSubmitted && !state.success && !state.error && !state.fieldErrors

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ 
        opacity: isClosing ? 0 : 1,
        transition: DS.transition,
        pointerEvents: isClosing ? 'none' : 'auto'
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: DS.overlay,
          backdropFilter: 'blur(4px)',
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        style={{
          backgroundColor: DS.surface,
          borderRadius: DS.radius.lg,
          boxShadow: DS.shadow,
          opacity: isClosing ? 0 : 1,
          transform: isClosing ? 'scale(0.95)' : 'scale(1)',
          transition: DS.transition,
        }}
        className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: DS.border }}
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#E6F1F4' }}
            >
              <UserCircle className="w-5 h-5" style={{ color: DS.primary }} />
            </div>
            <div>
              <h2 
                style={{ 
                  fontFamily: "'Cormorant Garamond', serif",
                  color: DS.textPrimary,
                }}
                className="text-xl font-semibold"
              >
                {isNewClient ? 'Nuevo cliente' : 'Editar cliente'}
              </h2>
              <p 
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: DS.textSecondary,
                  fontSize: '12px'
                }}
              >
                {isNewClient ? 'Añade los datos del cliente' : 'Actualiza la información'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Cerrar"
            style={{ transition: DS.transition }}
          >
            <X className="w-5 h-5" style={{ color: DS.textSecondary }} />
          </button>
        </div>

        {/* Form */}
        <form action={formAction} onSubmit={() => setIsSubmitted(true)} className="p-5 space-y-4">
          {/* Hidden fields - only include for editing */}
          {!isNewClient && (
            <input type="hidden" name="id" value={client.id} />
          )}
          <input type="hidden" name="organization_id" value={organizationId} />

          {/* Success Message */}
          {state.success && (
            <div 
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{ 
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: DS.success,
              }}
            >
              <Check className="w-5 h-5 flex-shrink-0" />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px' }}>
                Cliente creado exitosamente
              </span>
            </div>
          )}

          {/* Error general */}
          {state.error && (
            <div 
              className="flex items-start gap-2 p-3 rounded-lg"
              style={{ 
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: DS.error,
              }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px' }}>
                {state.error}
              </span>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label 
              htmlFor="name"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              className="block text-sm font-medium mb-1.5"
            >
              Nombre completo <span style={{ color: DS.error }}>*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={isNewClient ? '' : client.name}
              required
              disabled={isLoading}
              placeholder="Ej: María García"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: DS.radius.sm,
                borderColor: state.fieldErrors?.name ? DS.error : DS.border,
                padding: '12px 14px',
                color: DS.textPrimary,
                opacity: isLoading ? 0.7 : 1,
                transition: DS.transition,
              }}
              className="w-full border focus:outline-none focus:ring-2 focus:border-transparent"
            />
            {state.fieldErrors?.name && (
              <p 
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: DS.error,
                  fontSize: '12px'
                }} 
                className="mt-1"
              >
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label 
              htmlFor="email"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              className="block text-sm font-medium mb-1.5"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={isNewClient ? '' : (client.email || '')}
              disabled={isLoading}
              placeholder="ej: maria@email.com"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: DS.radius.sm,
                borderColor: state.fieldErrors?.email ? DS.error : DS.border,
                padding: '12px 14px',
                color: DS.textPrimary,
                opacity: isLoading ? 0.7 : 1,
                transition: DS.transition,
              }}
              className="w-full border focus:outline-none focus:ring-2 focus:border-transparent"
            />
            {state.fieldErrors?.email && (
              <p 
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: DS.error,
                  fontSize: '12px'
                }} 
                className="mt-1"
              >
                {state.fieldErrors.email[0]}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label 
              htmlFor="phone"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              className="block text-sm font-medium mb-1.5"
            >
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              defaultValue={isNewClient ? '' : (client.phone || '')}
              disabled={isLoading}
              placeholder="Ej: +34 612 345 678"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: DS.radius.sm,
                borderColor: state.fieldErrors?.phone ? DS.error : DS.border,
                padding: '12px 14px',
                color: DS.textPrimary,
                opacity: isLoading ? 0.7 : 1,
                transition: DS.transition,
              }}
              className="w-full border focus:outline-none focus:ring-2 focus:border-transparent"
            />
            {state.fieldErrors?.phone && (
              <p 
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: DS.error,
                  fontSize: '12px'
                }} 
                className="mt-1"
              >
                {state.fieldErrors.phone[0]}
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label 
              htmlFor="notes"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              className="block text-sm font-medium mb-1.5"
            >
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={isNewClient ? '' : (client.notes || '')}
              disabled={isLoading}
              placeholder="Información adicional sobre el cliente..."
              rows={3}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: DS.radius.sm,
                borderColor: DS.border,
                padding: '12px 14px',
                color: DS.textPrimary,
                opacity: isLoading ? 0.7 : 1,
                transition: DS.transition,
                resize: 'none',
              }}
              className="w-full border focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: DS.radius.sm,
                padding: '12px 20px',
                color: DS.textSecondary,
              }}
              className="flex-1 border font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || state.success}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: DS.radius.sm,
                padding: '12px 20px',
                backgroundColor: state.success ? DS.success : DS.primary,
                color: '#FFFFFF',
                opacity: isLoading ? 0.7 : 1,
              }}
              className="flex-1 font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {state.success ? (
                <>
                  <Check className="w-4 h-4" />
                  ¡Listo!
                </>
              ) : isNewClient ? 'Crear cliente' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
