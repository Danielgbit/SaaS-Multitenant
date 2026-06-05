'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function EmployeePayrollError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <ErrorFallback
        title="Error en detalle de nómina"
        description={error.message || 'No se pudo cargar el detalle de nómina del empleado.'}
        retry={reset}
      />
    </div>
  )
}
