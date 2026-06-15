'use client'

import { useState, type ReactNode } from 'react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

export function useConfirmClose(
  isDirty: boolean,
  onClose: () => void,
  message = 'Descartar cambios sin guardar?'
): {
  confirmClose: () => void
  dialog: ReactNode
} {
  const [showConfirm, setShowConfirm] = useState(false)

  const confirmClose = () => {
    if (!isDirty) {
      onClose()
      return
    }
    setShowConfirm(true)
  }

  const dialog = (
    <ConfirmModal
      isOpen={showConfirm}
      onClose={() => setShowConfirm(false)}
      onConfirm={async () => {
        setShowConfirm(false)
        onClose()
      }}
      title="Descartar cambios"
      description={message}
      confirmText="Descartar"
      cancelText="Seguir editando"
      variant="warning"
    />
  )

  return { confirmClose, dialog }
}
