'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { 
  PencilLine, 
  CalendarClock, 
  ToggleLeft, 
  ToggleRight, 
  Archive, 
  Trash2, 
  MailCheck, 
  XCircle,
} from 'lucide-react'
import type { Employee } from '@/types/employees'
import type { Invitation } from '@/types/invitations'

interface EmployeeActionMenuProps {
  employee: Employee
  isOpen: boolean
  position: DOMRect | null
  onClose: () => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  onHardDelete?: (employee: Employee) => void
  onToggle: (employee: Employee) => void
  onResendInvitation?: (invitationId: string) => void
  onCancelInvitation?: (invitationId: string) => void
  invitation?: Invitation | null
  hasAccess: boolean
  hasPendingInvite: boolean
  isOwnerOrAdmin: boolean
  isLoading: boolean
}

const GAP = 6
const MIN_SPACE = 100

type VerticalDirection = 'below' | 'above'
type HorizontalDirection = 'right' | 'left'

function getSmartPosition(
  buttonRect: DOMRect,
  menuWidth: number,
  menuHeight: number
): { top: number; left: number; vertical: VerticalDirection; maxHeight: number } {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  const spaceBelow = viewport.height - buttonRect.bottom
  const spaceAbove = buttonRect.top
  const spaceRight = viewport.width - buttonRect.right
  const spaceLeft = buttonRect.left

  let vertical: VerticalDirection
  let top: number
  let maxHeight = menuHeight

  if (spaceBelow >= MIN_SPACE && spaceBelow > spaceAbove) {
    vertical = 'below'
    top = buttonRect.bottom + GAP
    if (spaceBelow < menuHeight + GAP * 2) {
      maxHeight = spaceBelow - GAP * 2
    }
  } else if (spaceAbove >= MIN_SPACE) {
    vertical = 'above'
    top = buttonRect.top - Math.min(menuHeight, spaceAbove) - GAP
    if (spaceAbove < menuHeight + GAP * 2) {
      maxHeight = spaceAbove - GAP * 2
    }
  } else {
    vertical = spaceBelow > spaceAbove ? 'below' : 'above'
    top = vertical === 'below' 
      ? buttonRect.bottom + GAP 
      : buttonRect.top - Math.min(menuHeight, Math.max(spaceBelow, spaceAbove)) - GAP
    maxHeight = Math.max(spaceBelow, spaceAbove) - GAP * 2
  }

  let left: number
  if (spaceRight >= menuWidth || spaceRight > spaceLeft) {
    left = buttonRect.right - menuWidth
  } else {
    left = buttonRect.left
  }

  left = Math.max(GAP, Math.min(left, viewport.width - menuWidth - GAP))
  top = Math.max(GAP, Math.min(top, viewport.height - maxHeight - GAP))

  return { top, left, vertical, maxHeight: Math.max(120, maxHeight) }
}

export function EmployeeActionMenu({
  employee,
  isOpen,
  position,
  onClose,
  onEdit,
  onDelete,
  onHardDelete,
  onToggle,
  onResendInvitation,
  onCancelInvitation,
  invitation,
  hasAccess,
  hasPendingInvite,
  isOwnerOrAdmin,
  isLoading,
}: EmployeeActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, vertical: 'below' as VerticalDirection, maxHeight: 300 })
  const [isPositioned, setIsPositioned] = useState(false)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen || !position || !menuRef.current) {
      setIsPositioned(false)
      return
    }

    const timer = setTimeout(() => {
      if (menuRef.current) {
        const menuRect = menuRef.current.getBoundingClientRect()
        const newPos = getSmartPosition(position, menuRect.width, menuRect.height)
        setMenuPos(newPos)
        setIsPositioned(true)
      }
    }, 10)

    return () => clearTimeout(timer)
  }, [isOpen, position])

  if (!isOpen || !position) return null

  const hasScrollableContent = menuPos.maxHeight < 300

  const menuContent = (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .menu-enter-below {
          animation: slideDown 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .menu-enter-above {
          animation: slideUp 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .menu-indicator-below {
          top: -5px;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 6px solid rgb(226, 232, 240);
        }
        .dark .menu-indicator-below {
          border-bottom-color: rgb(51, 65, 85);
        }
        .menu-indicator-above {
          bottom: -5px;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid rgb(226, 232, 240);
        }
        .dark .menu-indicator-above {
          border-top-color: rgb(51, 65, 85);
        }
        .menu-scroll-fade {
          mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
        }
      `}</style>

      <div className="fixed inset-0 z-[9998]" onClick={onClose} onContextMenu={(e) => e.preventDefault()} />

      <div
        ref={menuRef}
        className="fixed z-[9999]"
        style={{
          top: menuPos.top,
          left: menuPos.left,
          opacity: isPositioned ? 1 : 0,
          pointerEvents: isPositioned ? 'auto' : 'none',
        }}
      >
        <div 
          className={`
            relative bg-white/95 dark:bg-slate-800/95 
            backdrop-blur-md 
            rounded-xl 
            shadow-xl shadow-slate-900/15 
            border border-slate-200/60 dark:border-slate-700/60
            overflow-hidden
            ${menuPos.vertical === 'below' ? 'menu-enter-below' : 'menu-enter-above'}
          `}
          style={{ maxHeight: menuPos.maxHeight }}
        >
          <div 
            className={`
              absolute w-3 h-3 bg-white dark:bg-slate-800 
              border-l border-t border-slate-200/60 dark:border-slate-700/60
              rotate-45
              ${menuPos.vertical === 'below' ? 'menu-indicator-below' : 'menu-indicator-above'}
            `}
            style={{ 
              left: position ? position.width / 2 - 6 : 22,
              [menuPos.vertical === 'below' ? 'top' : 'bottom']: -5,
              zIndex: 1,
            }}
          />

          <div 
            className={hasScrollableContent ? 'menu-scroll-fade' : ''} 
            style={{ maxHeight: menuPos.maxHeight - 8 }}
          >
            <div className="py-1.5">
              {hasAccess && (
                <>
                  <button
                    type="button"
                    onClick={() => { onEdit(employee); onClose() }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/80 flex items-center gap-3 cursor-pointer transition-colors duration-150"
                  >
                    <PencilLine className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>Editar información</span>
                  </button>
                  
                  <Link
                    href={`/employees/${employee.id}/availability`}
                    onClick={onClose}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/80 flex items-center gap-3 cursor-pointer transition-colors duration-150"
                  >
                    <CalendarClock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>Horarios y disponibilidad</span>
                  </Link>
                  
                  <button
                    type="button"
                    onClick={() => { onToggle(employee); onClose() }}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/80 flex items-center gap-3 cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {employee.active ? (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span>Desactivar cuenta</span>
                      </>
                    ) : (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Reactivar cuenta</span>
                      </>
                    )}
                  </button>
                  
                  <div className="h-px bg-slate-200/60 dark:bg-slate-700/60 my-1.5" />
                </>
              )}

              {!hasAccess && hasPendingInvite && invitation && (
                <>
                  <button
                    type="button"
                    onClick={() => { onCancelInvitation?.(invitation.id); onClose() }}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancelar invitación</span>
                  </button>
                  
                  <div className="h-px bg-slate-200/60 dark:bg-slate-700/60 my-1.5" />
                </>
              )}

              <button
                type="button"
                onClick={() => { onDelete(employee); onClose() }}
                className="w-full px-4 py-2.5 text-left text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-3 cursor-pointer transition-colors duration-150"
              >
                <Archive className="w-4 h-4" />
                <span>Archivar empleado</span>
              </button>

              {isOwnerOrAdmin && (
                <button
                  type="button"
                  onClick={() => { onHardDelete?.(employee); onClose() }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 cursor-pointer transition-colors duration-150"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar permanentemente</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  if (typeof window === 'undefined') return null
  
  return createPortal(menuContent, document.body)
}
