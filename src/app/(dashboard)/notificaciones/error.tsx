'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function NotificacionesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Error en notificaciones:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <AlertTriangle className="h-12 w-12 text-error" />
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Error al cargar notificaciones</h2>
        <p className="text-muted-foreground max-w-md">
          No pudimos cargar los datos del sistema de notificaciones. Por favor intenta nuevamente.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Reintentar
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Volver al dashboard
        </button>
      </div>
    </div>
  )
}
