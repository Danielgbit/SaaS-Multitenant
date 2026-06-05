'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/components/ui/ErrorFallback'
import { captureError } from '@/lib/error-logger'

export default function PayrollError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    captureError('payroll-error', error, {
      route: '/nomina',
    })
  }, [error])

  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <ErrorFallback
        title="Error en nómina"
        description={error.message || 'No se pudo cargar el módulo de nómina.'}
        retry={reset}
      />
    </div>
  )
}
