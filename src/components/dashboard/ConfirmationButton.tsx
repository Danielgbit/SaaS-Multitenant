'use client'

import { useState, useCallback } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { MarkCompletedModal } from './MarkCompletedModal'

interface ConfirmationButtonProps {
  appointmentId: string
  clientName: string
  serviceName: string
  basePrice: number
  disabled?: boolean
  className?: string
  onCompleted?: () => void
}

export function ConfirmationButton({
  appointmentId,
  clientName,
  serviceName,
  basePrice,
  disabled = false,
  className = '',
  onCompleted,
}: ConfirmationButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled) {
      setIsModalOpen(true)
    }
  }, [disabled])

  const handleClose = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-xl
          bg-emerald-100 dark:bg-emerald-900/40
          text-emerald-700 dark:text-emerald-300
          font-medium text-sm
          transition-all duration-200
          hover:bg-emerald-200 dark:hover:bg-emerald-900/60
          hover:scale-[1.02]
          active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
          ${className}
        `}
      >
        <CheckCircle2 className="w-4 h-4" />
        Listo
      </button>

      <MarkCompletedModal
        appointmentId={appointmentId}
        clientName={clientName}
        serviceName={serviceName}
        basePrice={basePrice}
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={onCompleted}
      />
    </>
  )
}
