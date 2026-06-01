'use client'
import { useEffect } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger' | 'warning'
  onConfirm: () => void | Promise<void>
  onClose: () => void
  isLoading?: boolean
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  onClose,
  isLoading = false,
}: ConfirmModalProps) {
  const COLORS = useThemeColors()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleConfirm = async () => {
    await onConfirm()
  }

  const variantTokens = {
    default: { bg: COLORS.primary, icon: null, iconBg: COLORS.primarySubtle, iconColor: COLORS.primary },
    danger: { bg: COLORS.error, icon: <AlertTriangle className="w-5 h-5" />, iconBg: COLORS.errorLight, iconColor: COLORS.error },
    warning: { bg: COLORS.warning, icon: <AlertTriangle className="w-5 h-5" />, iconBg: COLORS.warningLight, iconColor: COLORS.warning },
  }

  const tokens = variantTokens[variant]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: COLORS.overlay }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[20px] overflow-hidden animate-scale-in-95"
        style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadow.xl }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-3">
            {tokens.icon && (
              <div className="p-2 rounded-xl" style={{ backgroundColor: tokens.iconBg }}>
                <span style={{ color: tokens.iconColor }}>{tokens.icon}</span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-base" style={{ color: COLORS.textPrimary }}>{title}</h3>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
            style={{ color: COLORS.textMuted }}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all hover:bg-opacity-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
              style={{ borderColor: COLORS.border, color: COLORS.textSecondary, backgroundColor: COLORS.surface }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
              style={{ backgroundColor: tokens.bg, color: '#fff' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {confirmLabel}...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
