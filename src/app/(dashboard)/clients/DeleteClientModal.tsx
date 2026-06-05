'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal, Button, Spinner } from '@/components/ui'
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

const initialState = { success: false, error: undefined }

export function DeleteClientModal({ client, organizationId, isOpen, onClose, onSuccess }: DeleteClientModalProps) {
  const [state, formAction] = useActionState(deleteClient, initialState)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const isSubmitting = isSubmitted && !state.success && !state.error

  useEffect(() => {
    if (state.success) { onSuccess(); onClose() }
  }, [state.success, onSuccess, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar cliente">
      <form action={formAction} onSubmit={() => setIsSubmitted(true)}>
        <input type="hidden" name="id" value={client.id} />
        <input type="hidden" name="organization_id" value={organizationId} />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-sm">
            ¿Estás seguro de que deseas eliminar a <strong>{client.name}</strong>?
            Esta acción no se puede deshacer.
          </p>
        </div>

        {state.error && (
          <div className="p-3 rounded-lg mb-4 text-sm text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400">
            {state.error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" variant="danger" disabled={isSubmitting} loading={isSubmitting} className="flex-1">
            Eliminar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
