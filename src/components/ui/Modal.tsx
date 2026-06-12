'use client'

import { useRef, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useScrollLock } from '@/hooks/useScrollLock'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  scrollable?: boolean
  className?: string
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({ isOpen, onClose, title, children, header, footer, size = 'md', scrollable, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Orden explícito: 1. focus trap (incluye escape + auto-focus) 2. scroll lock
  useFocusTrap(panelRef, isOpen, onClose)
  useScrollLock(isOpen)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className={cn(
          'relative w-full rounded-2xl bg-white dark:bg-[#111827] p-6 shadow-xl transition-all duration-200',
          sizeMap[size],
          scrollable !== false && 'max-h-[85dvh] overflow-y-auto',
          className
        )}
      >
        {header ? (
          <>
            <h2 id={titleId} className="sr-only">{title}</h2>
            {header}
          </>
        ) : (
          <div className="flex items-center justify-between mb-4">
            <h2 id={titleId} className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
              {title}
            </h2>
            <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="text-sm text-[#475569] dark:text-[#94A3B8]">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#334155]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex justify-end gap-3 mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#334155]', className)}>
      {children}
    </div>
  )
}
