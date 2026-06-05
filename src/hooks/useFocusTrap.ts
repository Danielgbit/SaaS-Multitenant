import { useEffect, useRef, type RefObject } from 'react'

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  isActive: boolean,
  onClose?: () => void
) {
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive) return

    previousFocus.current = document.activeElement as HTMLElement

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return

      const focusable = ref.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handler)

    requestAnimationFrame(() => {
      if (!ref.current) return
      const first = ref.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      first?.focus()
    })

    return () => {
      document.removeEventListener('keydown', handler)
      requestAnimationFrame(() => {
        previousFocus.current?.focus()
      })
    }
  }, [isActive, onClose, ref])
}
