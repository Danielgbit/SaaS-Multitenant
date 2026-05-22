'use client'

import { useRouter } from 'next/navigation'
import { SearchInput } from './SearchInput'
import { FileSearch } from 'lucide-react'
import Link from 'next/link'

export function DashboardSearch() {
  const router = useRouter()

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 max-w-md">
        <SearchInput
          placeholder="Buscar mensajes por ID, teléfono, trace..."
          onSearch={(term) => {
            if (term.length >= 3) {
              router.push(`/notificaciones/messages?q=${encodeURIComponent(term)}`)
            }
          }}
        />
      </div>
      <Link
        href="/notificaciones/messages"
        className="rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors inline-flex items-center gap-1.5 shrink-0"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <FileSearch className="w-4 h-4" />
        Inspector
      </Link>
    </div>
  )
}
