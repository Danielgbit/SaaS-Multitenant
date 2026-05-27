'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function PublicBookingError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF9' }}>
      <ErrorFallback
        title="Error al cargar la reserva"
        description={error.message || 'No pudimos cargar la información. Intenta de nuevo.'}
        retry={reset}
      />
    </div>
  )
}
