'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/components/ui/ErrorFallback'
import { captureError } from '@/lib/error-logger'

export default function EmployeesError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    captureError('employees-error', error, {
      route: '/employees',
    })
  }, [error])

  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <ErrorFallback
        title="Error en equipo"
        description={error.message || 'No se pudo cargar el módulo de equipo.'}
        retry={reset}
      />
    </div>
  )
}
