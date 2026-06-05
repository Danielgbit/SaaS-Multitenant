'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { X, AlertTriangle, Trash2, Info } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
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
  danger: {
    Icon: Trash2,
    iconBg: 'errorLight',
    iconColor: 'error',
    buttonBg: 'error',
  },
  warning: {
    Icon: AlertTriangle,
    iconBg: 'warningLight',
    iconColor: 'warning',
    buttonBg: 'warning',
  },
  info: {
    Icon: Info,
    iconBg: 'primaryLight',
    iconColor: 'primary',
    buttonBg: 'primary',
  },
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  variant = 'danger',
  icon,
  extraContent,
  confirmDisabled = false,
}: ConfirmModalProps) {
  const COLORS = useThemeColors()
  const [loading, setLoading] = useState(false)
  const cfg = variantConfig[variant]
  const IconComponent = icon ? null : cfg.Icon

  const handleConfirm = useCallback(async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }, [onConfirm])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: COLORS.overlay }}
        onClick={loading ? undefined : onClose}
      />

      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-lg transition-all duration-200"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Close */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cerrar"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Icon */}
        <div className="mb-4 mt-2 flex justify-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: COLORS[cfg.iconBg as keyof typeof COLORS] as string }}
          >
            {icon ?? (() => {
              const Icon = IconComponent as unknown as React.ComponentType<{ className?: string; style?: React.CSSProperties }>
              return <Icon className="h-6 w-6" style={{ color: COLORS[cfg.iconColor as keyof typeof COLORS] as string }} />
            })()}
          </div>
        </div>

        {/* Title */}
        <h2
          id="confirm-modal-title"
          className="mb-2 text-center text-lg font-semibold"
          style={{ color: COLORS.textPrimary }}
        >
          {title}
        </h2>

        {/* Description */}
        <div
          className="mb-4 text-center text-sm leading-relaxed"
          style={{ color: COLORS.textSecondary }}
        >
          {description}
        </div>

        {/* Extra content */}
        {extraContent && (
          <div className="mb-6">
            {extraContent}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={loading || confirmDisabled}
            loading={loading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
