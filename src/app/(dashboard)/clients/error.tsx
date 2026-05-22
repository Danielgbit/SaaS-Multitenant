'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/components/ui/ErrorFallback'
import { captureError } from '@/lib/error-logger'

export default function ClientsError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    captureError('clients-error', error, {
      route: '/clients',
    })
  }, [error])

  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <ErrorFallback
        title="Error en clientes"
        description={error.message || 'No se pudo cargar el módulo de clientes.'}
        retry={reset}
      />
    </div>
  )
}
