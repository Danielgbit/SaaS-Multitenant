'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/components/ui/ErrorFallback'
import { captureError } from '@/lib/error-logger'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    captureError('dashboard-error', error, {
      route: '/dashboard',
    })
  }, [error])

  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <ErrorFallback
        title="Error en el dashboard"
        description={error.message || 'No se pudo cargar el panel de control.'}
        retry={reset}
      />
    </div>
  )
}
