'use client'

import { AlertCircle, RefreshCcw } from 'lucide-react'

interface ErrorFallbackProps {
  title: string
  description?: string
  retry?: () => void
}

export function ErrorFallback({ title, description, retry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h2>
      
      {description && (
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
          {description}
        </p>
      )}
      
      {retry && (
        <button
          onClick={retry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F4C5C] dark:bg-[#38BDF8] text-white rounded-lg font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          Reintentar
        </button>
      )}
    </div>
  )
}
