'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <ErrorFallback
        title="Error en el panel"
        description={error.message || 'Ocurrió un error inesperado.'}
        retry={reset}
      />
    </div>
  )
}
