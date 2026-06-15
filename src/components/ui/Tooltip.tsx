'use client'
import { useState, useCallback, type ReactNode } from 'react'

const TOOLTIP_BG = 'rgba(15, 23, 42, 0.95)'
const TOOLTIP_TEXT = '#FFFFFF'
// TODO: migrate to design system tokens (DESIGN-TOOLTIP)

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
}

export function Tooltip({ content, children, side = 'bottom' }: TooltipProps) {
  const [show, setShow] = useState(false)
  const showFn = useCallback(() => setShow(true), [])
  const hideFn = useCallback(() => setShow(false), [])

  return (
    <div
      className="relative inline-flex"
      onPointerEnter={showFn}
      onPointerLeave={hideFn}
      onFocus={showFn}
      onBlur={hideFn}
      onKeyDown={(e) => { if (e.key === 'Escape') hideFn() }}
    >
      {children}
      {show && (
        <div
          role="tooltip"
          aria-live="polite"
          className={`absolute z-50 px-3 py-2 rounded-lg shadow-lg text-xs whitespace-normal ${
            side === 'bottom'
              ? 'top-full left-1/2 -translate-x-1/2 mt-2'
              : 'bottom-full left-1/2 -translate-x-1/2 mb-2'
          }`}
          style={{ backgroundColor: TOOLTIP_BG, color: TOOLTIP_TEXT }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
