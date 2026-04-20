'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push('/calendar')
      }

      if (e.key === 'C' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push('/calendar')
      }

      if (e.key === 'g' && e.shiftKey) {
        e.preventDefault()
        router.push('/calendar')
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        const modals = document.querySelectorAll('[role="dialog"]')
        modals.forEach(modal => {
          const closeBtn = modal.querySelector('button[aria-label="Cerrar"]') as HTMLButtonElement
          if (closeBtn) closeBtn.click()
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])
}
