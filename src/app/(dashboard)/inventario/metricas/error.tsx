'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/components/ui/ErrorFallback'
import { captureError } from '@/lib/error-logger'

export default function MetricsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureError('inventory-metrics-page-error', error, { route: '/inventario/metricas' })
  }, [error])

  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <ErrorFallback
        title="Error en métricas de inventario"
        description={error.message || 'No se pudieron cargar las métricas de inventario.'}
        retry={reset}
      />
    </div>
  )
}
