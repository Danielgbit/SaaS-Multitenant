'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/components/ui/ErrorFallback'
import { captureError } from '@/lib/error-logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    captureError('global-error', error, {
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    })
  }, [error])

  return (
    <html>
      <body>
        <ErrorFallback
          title="Error crítico"
          description="La aplicación no pudo cargarse correctamente. Por favor intenta nuevamente."
          retry={reset}
        />
      </body>
    </html>
  )
}
