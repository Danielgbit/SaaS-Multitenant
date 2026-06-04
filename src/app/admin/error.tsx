'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <h2 className="text-xl font-semibold text-[#0F172A] dark:text-white font-heading mb-2">
        Algo salió mal
      </h2>
      <p className="text-[#475569] dark:text-slate-400 mb-6 max-w-md">
        Ocurrió un error al cargar esta sección. Intenta de nuevo.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-[#0F4C5C] text-white rounded-lg text-sm font-medium hover:bg-[#0C3E4A] transition-colors cursor-pointer"
      >
        Reintentar
      </button>
    </div>
  )
}
