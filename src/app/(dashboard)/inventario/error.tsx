'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/components/ui/ErrorFallback'
import { captureError } from '@/lib/error-logger'

export default function InventoryError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureError('inventory-page-error', error, { route: '/inventario' })
  }, [error])

  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <ErrorFallback
        title="Error en inventario"
        description={error.message || 'No se pudo cargar el módulo de inventario.'}
        retry={reset}
      />
    </div>
  )
}
