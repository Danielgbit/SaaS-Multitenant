'use client'

import { Loader2, Trash2 } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

interface ConfirmDeleteButtonProps {
  onConfirm: () => void | Promise<void>
  loading: boolean
  label?: string
}

export function ConfirmDeleteButton({ onConfirm, loading, label = '¿Eliminar?' }: ConfirmDeleteButtonProps) {
  const COLORS = useThemeColors()

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onConfirm}
        disabled={loading}
        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
        style={{ backgroundColor: COLORS.error, opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : label}
      </button>
      <button
        disabled={loading}
        className="px-2.5 py-1 rounded-lg text-xs font-medium border"
        style={{ borderColor: COLORS.border, color: COLORS.textSecondary, opacity: loading ? 0.5 : 1 }}
      >
        No
      </button>
    </div>
  )
}

interface DeleteButtonProps {
  onDelete: () => void
  deleting: boolean
  confirmDelete: boolean
  onSetConfirmDelete: (value: boolean) => void
}

export function DeleteButton({ onDelete, deleting, confirmDelete, onSetConfirmDelete }: DeleteButtonProps) {
  const COLORS = useThemeColors()

  if (confirmDelete) {
    return (
      <ConfirmDeleteButton
        onConfirm={onDelete}
        loading={deleting}
      />
    )
  }

  return (
    <button
      onClick={() => onSetConfirmDelete(true)}
      className="p-2 rounded-xl transition-colors"
      style={{ color: COLORS.error }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.errorLight ?? '#FEE2E2' }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
      aria-label="Eliminar template"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}