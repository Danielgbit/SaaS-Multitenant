'use client'

import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
        Algo salió mal
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">
        {error.message || 'No se pudo cargar la página de horarios.'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-[#0F4C5C] dark:bg-[#38BDF8] text-white rounded-lg font-medium hover:opacity-90 transition-opacity cursor-pointer"
      >
        Reintentar
      </button>
    </div>
  )
}