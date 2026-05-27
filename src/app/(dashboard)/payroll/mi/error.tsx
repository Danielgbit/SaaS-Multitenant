'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function MyPayrollError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <ErrorFallback
        title="Error en mi nómina"
        description={error.message || 'No se pudo cargar tu información de nómina.'}
        retry={reset}
      />
    </div>
  )
}
