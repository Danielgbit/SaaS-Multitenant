'use client'

import { useState, useCallback } from 'react'
import { HelpCircle } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

interface ProgressStepTooltipProps {
  whenUsed: string
  restrictions: string
}

export function ProgressStepTooltip({ whenUsed, restrictions }: ProgressStepTooltipProps) {
  const [show, setShow] = useState(false)
  const colors = useThemeColors()

  const handleOpen = useCallback(() => setShow(true), [])
  const handleClose = useCallback(() => setShow(false), [])

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <button
        type="button"
        className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
        aria-label="Ver información del estado"
        aria-expanded={show}
        aria-describedby={show ? 'step-tooltip-content' : undefined}
        onFocus={handleOpen}
        onBlur={handleClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setShow(false)
            e.currentTarget.blur()
          }
        }}
      >
        <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: colors.textMuted }} />
      </button>

      {show && (
        <div
          id="step-tooltip-content"
          role="tooltip"
          className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2.5 rounded-lg shadow-lg max-w-[90vw] sm:max-w-none"
          style={{
            backgroundColor: colors.isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.95)',
            color: '#fff',
            minWidth: '180px',
          }}
        >
          <div className="space-y-1.5">
            <div>
              <span className="text-sidebar-label font-semibold opacity-70">Cuándo</span>
              <p className="text-xs leading-relaxed">{whenUsed}</p>
            </div>
            <div className="pt-1 border-t border-white/10">
              <span className="text-sidebar-label font-semibold opacity-70">Restricciones</span>
              <p className="text-xs leading-relaxed">{restrictions}</p>
            </div>
          </div>
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1"
            style={{
              borderWidth: '6px',
              borderStyle: 'solid',
              borderColor: `transparent transparent ${colors.isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.95)'} transparent`,
            }}
          />
        </div>
      )}
    </div>
  )
}
