'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/components/ui/ErrorFallback'
import { captureError } from '@/lib/error-logger'

export default function BillingError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    captureError('billing-error', error, {
      route: '/billing',
    })
  }, [error])

  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <ErrorFallback
        title="Error en facturación"
        description={error.message || 'No se pudo cargar el módulo de facturación.'}
        retry={reset}
      />
    </div>
  )
}
