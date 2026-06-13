'use client'

import { useCallback } from 'react'

export function useConfirmClose(
  isDirty: boolean,
  onClose: () => void,
  message = '¿Descartar cambios sin guardar?'
): { confirmClose: () => void } {
  const confirmClose = useCallback(() => {
    if (!isDirty) {
      onClose()
      return
    }
    if (window.confirm(message)) {
      onClose()
    }
  }, [isDirty, onClose, message])

  return { confirmClose }
}
