'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface DeadLetterBannerProps {
  count: number
}

export function DeadLetterBanner({ count }: DeadLetterBannerProps) {
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-purple-600" />
        <div className="flex-1">
          <p className="font-medium text-purple-900">
            {count} notificación(es) en dead letter
          </p>
          <p className="text-sm text-purple-700">
            Revisar y decidir si reintentar o descartar.
          </p>
        </div>
        <Link
          href="/notificaciones/dead-letter"
          className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Gestionar
        </Link>
      </div>
    </div>
  )
}
