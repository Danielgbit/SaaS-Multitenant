'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/components/ui/ErrorFallback'
import { captureError } from '@/lib/error-logger'

export default function CalendarError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    captureError('calendar-error', error, {
      route: '/calendar',
    })
  }, [error])

  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <ErrorFallback
        title="Error en agenda"
        description={error.message || 'No se pudo cargar el calendario de citas.'}
        retry={reset}
      />
    </div>
  )
}
