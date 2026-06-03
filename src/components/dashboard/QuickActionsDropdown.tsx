'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeColors } from '@/hooks/useThemeColors'
import { QUICK_ACTIONS } from '@/lib/quickActions'
import type { UserRole } from '@/types/user'

interface QuickActionsDropdownProps {
  role: UserRole
}

export function QuickActionsDropdown({ role }: QuickActionsDropdownProps) {
  const COLORS = useThemeColors()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const filteredActions = QUICK_ACTIONS.filter(a => a.roles.includes(role))

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  if (filteredActions.length === 0) return null

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2"
        style={{
          background: COLORS.primaryGradient,
          boxShadow: `0 2px 8px ${COLORS.primary}25`,
        }}
        aria-label="Crear"
        aria-expanded={isOpen}
        data-testid="quick-actions-button"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Crear</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-52 rounded-2xl py-1 z-50"
            style={{
              backgroundColor: COLORS.surfaceGlassStrong,
              border: `1px solid ${COLORS.border}`,
              boxShadow: COLORS.shadow.xl,
            }}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {filteredActions.map(action => {
              const Icon = action.icon
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                  style={{ color: COLORS.textSecondary }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <Icon className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                  {action.label}
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
