'use client'

import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

interface AlertBannerProps {
  type: 'warning' | 'error' | 'info' | 'success'
  message: string
  dismissible?: boolean
  onDismiss?: () => void
}

export function AlertBanner({ type, message, dismissible, onDismiss }: AlertBannerProps) {
  const COLORS = useThemeColors()

  const config = {
    warning: {
      icon: AlertTriangle,
      bg: COLORS.warningLight,
      border: COLORS.warning,
      iconColor: COLORS.warning,
    },
    error: {
      icon: AlertTriangle,
      bg: COLORS.errorLight,
      border: COLORS.error,
      iconColor: COLORS.error,
    },
    info: {
      icon: Info,
      bg: COLORS.infoLight,
      border: COLORS.info,
      iconColor: COLORS.info,
    },
    success: {
      icon: CheckCircle,
      bg: COLORS.successLight,
      border: COLORS.success,
      iconColor: COLORS.success,
    },
  }[type]

  const Icon = config.icon

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl border"
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
      }}
      role="alert"
    >
      <Icon className="w-5 h-5 shrink-0" style={{ color: config.iconColor }} />
      <span
        className="flex-1 text-sm font-medium"
        style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        {message}
      </span>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg transition-colors"
          style={{ color: COLORS.textMuted }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}