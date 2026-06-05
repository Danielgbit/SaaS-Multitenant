'use client'

import { useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { ConfirmModal } from '@/components/ui'
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
  loading, onConfirm, onClose,
}: ConfirmActionModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={async () => { onConfirm(inputRef.current?.value) }}
      title={title}
      description={<>
        <p>{description}</p>
        {note && <p className="text-xs mt-1 text-[#64748B] dark:text-[#94A3B8]">{note}</p>}
      </>}
      confirmText={confirmLabel}
      variant="warning"
      extraContent={
        placeholder ? (
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="w-full mt-3 px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827] text-sm"
          />
        ) : undefined
      }
    />
  )
}
