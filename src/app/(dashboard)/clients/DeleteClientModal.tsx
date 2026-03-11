'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import { useActionState } from 'react'
import { deleteClient } from '@/actions/clients/deleteClient'
import type { Database } from '@/../types/supabase'

type Client = Database['public']['Tables']['clients']['Row']

interface DeleteClientModalProps {
  client: Client
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Design system tokens (light mode only)
const DS = {
  primary: '#0F4C5C',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#E2E8F0',
  error: '#DC2626',
  radius: {
    lg: '16px',
    md: '10px',
  },
}

const initialState = {
  success: false,
  error: undefined,
}

export function DeleteClientModal({
  client,
  organizationId,
  isOpen,
  onClose,
  onSuccess,
}: DeleteClientModalProps) {
  const [state, formAction] = useActionState(deleteClient, initialState)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Handle success
  useEffect(() => {
    if (state.success) {
      onSuccess()
      onClose()
    }
  }, [state.success, onSuccess, onClose])

  // Handle submitting state - isSubmitting is true when form is submitted but not yet completed
  const isSubmitting = isSubmitted && !state.success && !state.error

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          backgroundColor: DS.surface,
          borderRadius: DS.radius.lg,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        className="relative w-full max-w-sm mx-4"
      >
        {/* Header */}
        <div className="p-6 text-center">
          <div 
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: '#FEF2F2' }}
          >
            <AlertTriangle className="w-7 h-7" style={{ color: DS.error }} />
          </div>
          
          <h2 
            style={{ 
              fontFamily: "'Cormorant Garamond', serif",
              color: DS.textPrimary,
            }}
            className="text-xl font-semibold mb-2"
          >
            Eliminar cliente
          </h2>
          
          <p 
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: DS.textSecondary,
            }}
            className="text-sm"
          >
            ¿Estás seguro de que deseas eliminar a <strong>{client.name}</strong>? 
            Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Form */}
        <form action={formAction} onSubmit={() => setIsSubmitted(true)} className="p-6 pt-0">
          {/* Hidden fields */}
          <input type="hidden" name="id" value={client.id} />
          <input type="hidden" name="organization_id" value={organizationId} />

          {/* Error general */}
          {state.error && (
            <div 
              className="p-3 rounded-lg mb-4 text-sm text-center"
              style={{ 
                backgroundColor: '#FEF2F2',
                border: `1px solid #FECACA`,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: DS.error,
              }}
            >
              {state.error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: DS.radius.md,
                padding: '12px 20px',
              }}
              className="flex-1 border font-medium transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: DS.radius.md,
                padding: '12px 20px',
                backgroundColor: DS.error,
                color: '#FFFFFF',
              }}
              className="flex-1 font-medium transition-colors hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Eliminar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
