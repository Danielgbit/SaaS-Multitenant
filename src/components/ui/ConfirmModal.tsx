'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { AlertTriangle, Trash2, Info } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string | ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  icon?: ReactNode
  extraContent?: ReactNode
  confirmDisabled?: boolean
}

const variantConfig = {
  danger:  { Icon: Trash2, bg: 'errorLight' as const, fg: 'error' as const },
  warning: { Icon: AlertTriangle, bg: 'warningLight' as const, fg: 'warning' as const },
  info:    { Icon: Info, bg: 'primaryLight' as const, fg: 'primary' as const },
}

export default function ConfirmModal({
  isOpen, onClose, onConfirm, title, description,
  confirmText = 'Eliminar', cancelText = 'Cancelar',
  variant = 'danger', icon, extraContent, confirmDisabled = false,
}: ConfirmModalProps) {
  const COLORS = useThemeColors()
  const [loading, setLoading] = useState(false)
  const cfg = variantConfig[variant]

  const handleConfirm = useCallback(async () => {
    setLoading(true)
    try { await onConfirm() } finally { setLoading(false) }
  }, [onConfirm])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelText}</Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={loading || confirmDisabled}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      {icon ? icon : (
        <div className="flex justify-center mb-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: COLORS[cfg.bg] as string }}
          >
            <cfg.Icon className="h-6 w-6" style={{ color: COLORS[cfg.fg] as string }} />
          </div>
        </div>
      )}
      <p className="text-center">{description}</p>
      {extraContent}
    </Modal>
  )
}
