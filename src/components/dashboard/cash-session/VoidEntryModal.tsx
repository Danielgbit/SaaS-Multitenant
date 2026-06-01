'use client'
import { useState, useEffect, useRef } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'

interface VoidEntryModalProps {
  entryTitle: string
  onSubmit: (reason: string) => Promise<void>
  onClose: () => void
  isLoading: boolean
}

export function VoidEntryModal({ entryTitle, onSubmit, onClose, isLoading }: VoidEntryModalProps) {
  const COLORS = useThemeColors()
  const [reason, setReason] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return
    await onSubmit(reason.trim())
  }

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
            <div className="p-2 rounded-xl" style={{ backgroundColor: COLORS.errorLight }}>
              <AlertTriangle className="w-5 h-5" style={{ color: COLORS.error }} />
            </div>
            <div>
              <h3 className="font-semibold text-base" style={{ color: COLORS.textPrimary }}>Anular movimiento</h3>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>Esta accion no se puede deshacer</p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>Movimiento a anular</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: COLORS.textPrimary }}>{entryTitle}</p>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
              Motivo de anulacion
            </label>
            <textarea
              ref={inputRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Pago duplicado, error de registro..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
              style={{
                backgroundColor: COLORS.surfaceSubtle,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textPrimary,
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all hover:bg-opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
              style={{ borderColor: COLORS.border, color: COLORS.textSecondary, backgroundColor: COLORS.surface }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !reason.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
              style={{ backgroundColor: COLORS.error, color: '#fff' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Anulando...
                </>
              ) : (
                'Anular'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
