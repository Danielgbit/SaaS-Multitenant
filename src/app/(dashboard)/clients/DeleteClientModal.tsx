'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useActionState } from 'react'
import { deleteClient } from '@/actions/clients/deleteClient'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { Database } from '@/../types/supabase'

type Client = Database['public']['Tables']['clients']['Row']

interface DeleteClientModalProps {
  client: Client
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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
  const COLORS = useThemeColors()
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
          backgroundColor: COLORS.surface,
          borderRadius: COLORS.radius.lg,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        className="relative w-full max-w-sm mx-4"
      >
        {/* Header */}
        <div className="p-6 text-center">
          <div 
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: COLORS.errorLight }}
          >
            <AlertTriangle className="w-7 h-7" style={{ color: COLORS.error }} />
          </div>
          
          <h2 
            style={{ color: COLORS.textPrimary }}
            className="text-xl font-semibold mb-2 font-heading"
          >
            Eliminar cliente
          </h2>
          
          <p 
            style={{ color: COLORS.textSecondary }}
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
              style={{ backgroundColor: COLORS.errorLight, border: `1px solid ${COLORS.error}30`, color: COLORS.error }}
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
                borderRadius: COLORS.radius.md,
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
                borderRadius: COLORS.radius.md,
                padding: '12px 20px',
                backgroundColor: COLORS.error,
                color: COLORS.textOnPrimary,
              }}
              className="flex-1 font-medium transition-colors hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Spinner size="sm" />}
              Eliminar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
