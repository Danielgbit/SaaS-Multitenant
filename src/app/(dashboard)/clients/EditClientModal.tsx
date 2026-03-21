'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { X, Loader2, UserCircle, Check, AlertCircle, Sparkles } from 'lucide-react'
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

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryHover: isDark ? '#0EA5E9' : '#0C3E4A',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEF2F2',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#ECFDF5',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)',
    radius: {
      lg: '16px',
      md: '10px',
      sm: '8px',
    },
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    transition: 'all 0.2s ease-out',
    isDark,
  }
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
  const COLORS = useColors()
  const [state, formAction] = useActionState(createClient, initialState)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const isNewClient = !client

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        onSuccess()
        onClose()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [state.success, onSuccess, onClose])

  if (!isOpen && !isClosing) return null

  const isLoading = isSubmitted && !state.success && !state.error && !state.fieldErrors

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ 
        opacity: isClosing ? 0 : 1,
        transition: COLORS.transition,
        pointerEvents: isClosing ? 'none' : 'auto'
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: COLORS.overlay,
          backdropFilter: 'blur(8px)',
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: COLORS.radius.lg,
          boxShadow: COLORS.shadow,
          opacity: isClosing ? 0 : 1,
          transform: isClosing ? 'scale(0.95)' : 'scale(1)',
          transition: COLORS.transition,
        }}
        className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-hidden border"
      >
        {/* Header with gradient */}
        <div 
          className="relative p-5 border-b overflow-hidden"
          style={{ 
            borderColor: COLORS.border,
            background: COLORS.primaryGradient,
          }}
        >
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
              >
                <UserCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 
                  style={{ 
                    fontFamily: "'Cormorant Garamond', serif",
                    color: '#FFFFFF',
                  }}
                  className="text-xl font-semibold"
                >
                  {isNewClient ? 'Nuevo cliente' : 'Editar cliente'}
                </h2>
                <p 
                  style={{ 
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: 'rgba(255,255,255,0.8)',
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
              className="p-2 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form action={formAction} onSubmit={() => setIsSubmitted(true)} className="p-5 space-y-4">
          {/* Hidden fields */}
          {!isNewClient && (
            <input type="hidden" name="id" value={client.id} />
          )}
          <input type="hidden" name="organization_id" value={organizationId} />

          {/* Success Message */}
          {state.success && (
            <div 
              className="flex items-center gap-2 p-3 rounded-xl"
              style={{ 
                backgroundColor: COLORS.successLight,
                border: `1px solid ${COLORS.success}30`,
                color: COLORS.success,
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
              className="flex items-start gap-2 p-3 rounded-xl"
              style={{ 
                backgroundColor: COLORS.errorLight,
                border: `1px solid ${COLORS.error}30`,
                color: COLORS.error,
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
              className="block text-sm font-medium mb-1.5"
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: COLORS.textPrimary 
              }}
            >
              Nombre completo <span style={{ color: COLORS.error }}>*</span>
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
                borderRadius: COLORS.radius.sm,
                borderColor: state.fieldErrors?.name ? COLORS.error : COLORS.border,
                padding: '12px 14px',
                color: COLORS.textPrimary,
                backgroundColor: COLORS.surface,
                opacity: isLoading ? 0.7 : 1,
                transition: COLORS.transition,
              }}
              className="w-full border focus:outline-none focus:ring-2 focus:ring-offset-2"
            />
            {state.fieldErrors?.name && (
              <p 
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: COLORS.error,
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
              className="block text-sm font-medium mb-1.5"
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: COLORS.textPrimary 
              }}
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
                borderRadius: COLORS.radius.sm,
                borderColor: state.fieldErrors?.email ? COLORS.error : COLORS.border,
                padding: '12px 14px',
                color: COLORS.textPrimary,
                backgroundColor: COLORS.surface,
                opacity: isLoading ? 0.7 : 1,
                transition: COLORS.transition,
              }}
              className="w-full border focus:outline-none focus:ring-2 focus:ring-offset-2"
            />
            {state.fieldErrors?.email && (
              <p 
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: COLORS.error,
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
              className="block text-sm font-medium mb-1.5"
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: COLORS.textPrimary 
              }}
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
                borderRadius: COLORS.radius.sm,
                borderColor: state.fieldErrors?.phone ? COLORS.error : COLORS.border,
                padding: '12px 14px',
                color: COLORS.textPrimary,
                backgroundColor: COLORS.surface,
                opacity: isLoading ? 0.7 : 1,
                transition: COLORS.transition,
              }}
              className="w-full border focus:outline-none focus:ring-2 focus:ring-offset-2"
            />
            {state.fieldErrors?.phone && (
              <p 
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: COLORS.error,
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
              className="block text-sm font-medium mb-1.5"
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: COLORS.textPrimary 
              }}
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
                borderRadius: COLORS.radius.sm,
                borderColor: COLORS.border,
                padding: '12px 14px',
                color: COLORS.textPrimary,
                backgroundColor: COLORS.surface,
                opacity: isLoading ? 0.7 : 1,
                transition: COLORS.transition,
                resize: 'none',
              }}
              className="w-full border focus:outline-none focus:ring-2 focus:ring-offset-2"
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
                borderRadius: COLORS.radius.sm,
                padding: '12px 20px',
                color: COLORS.textSecondary,
                backgroundColor: COLORS.surfaceSubtle,
                border: `1px solid ${COLORS.border}`
              }}
              className="flex-1 border font-medium hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || state.success}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: COLORS.radius.sm,
                padding: '12px 20px',
                backgroundColor: state.success ? COLORS.success : COLORS.primary,
                color: '#FFFFFF',
                opacity: isLoading ? 0.7 : 1,
              }}
              className="flex-1 font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity cursor-pointer"
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
