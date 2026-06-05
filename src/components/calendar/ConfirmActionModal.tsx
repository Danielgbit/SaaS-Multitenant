'use client'

import { useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Spinner } from '@/components/ui'
import type { CalendarColors } from '@/types/calendar'

interface ConfirmActionModalProps {
  isOpen: boolean
  title: string
  description: string
  note: string
  placeholder: string
  confirmLabel: string
  iconColor: string
  iconBg: string
  confirmBg: string
  loading: boolean
  COLORS: CalendarColors
  onConfirm: (reason?: string) => void
  onClose: () => void
}

export function ConfirmActionModal({
  isOpen, title, description, note, placeholder, confirmLabel,
  iconColor, iconBg, confirmBg, loading, COLORS,
  onConfirm, onClose,
}: ConfirmActionModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: COLORS.overlay, backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ backgroundColor: COLORS.surface, boxShadow: '0 24px 48px rgba(15,76,92,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: iconBg }}>
            <AlertTriangle className="w-8 h-8" style={{ color: iconColor }} />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.textPrimary }}>
            {title}
          </h3>
          <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>
            {description}
          </p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            {note}
          </p>
        </div>

        <div className="px-6 pb-4">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl text-sm border transition-colors duration-200"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
          />
        </div>

        <div className="px-6 py-4 flex gap-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200"
            style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(inputRef.current?.value?.trim() || undefined)}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: confirmBg, color: '#FFF',
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? <Spinner size="sm" className="inline" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
