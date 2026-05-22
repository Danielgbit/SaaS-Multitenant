import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SearchInput } from '@/components/dashboard/notifications/SearchInput'
import { Badge } from '@/components/ui/Badge'
import { FileSearch, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import type { NotificationChannel } from '@/types/notifications'
import { searchMessages } from '@/lib/notifications/inspector'

export const metadata: Metadata = {
  title: 'Inspector de Mensajes | Prügressy',
  description: 'Búsqueda e inspección de mensajes de notificaciones',
}

function statusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    sent: 'success',
    delivered: 'success',
    read: 'info',
    pending: 'warning',
    processing: 'warning',
    failed: 'error',
    failed_permanently: 'error',
    received: 'info',
    error: 'error',
  }
  return map[status] || 'neutral'
}

function relativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `Hace ${diffHr}h`
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function performSearch(orgId: string, q: string | null) {
  if (!q || q.length < 3) return null
  return searchMessages(orgId, q, {}, { limit: 50 })
}

export default async function MessagesSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember?.organization_id) redirect('/dashboard')

  const results = await performSearch(orgMember.organization_id, q || null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inspector de Mensajes</h1>
        <p className="text-muted-foreground mt-1">
          Busca e inspecciona mensajes de notificaciones en detalle
        </p>
      </div>

      <SearchInput
        defaultValue={q || ''}
        onSearch={async (term) => {
          'use server'
        }}
        placeholder="Buscar por teléfono, appointment ID, trace ID, correlation ID..."
      />

      {results && results.results.length > 0 ? (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Fecha</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Estado</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Canal</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Destinatario</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Mensaje</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Provider ID</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Acción</th>
              </tr>
            </thead>
            <tbody>
              {results.results.map((r) => (
                <tr
                  key={`${r.type}-${r.id}`}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                  style={{ borderColor: 'hsl(var(--border) / 0.5)' }}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                    {relativeTime(r.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadgeVariant(r.status)} size="sm">
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono">{r.channel}</td>
                  <td className="px-4 py-3 text-xs font-mono max-w-[140px] truncate">
                    {r.toAddress || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[220px] truncate">
                    {r.bodyPreview || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[100px] truncate">
                    {r.providerMessageId ? (
                      <span title={r.providerMessageId}>{r.providerMessageId.slice(0, 12)}...</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={r.type === 'queue' ? `/notificaciones/messages/${r.id}?type=queue` : `/notificaciones/messages/${r.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                    >
                      Inspeccionar
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 text-xs text-muted-foreground border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            {results.total} resultado(s) · Mostrando hasta 50
          </div>
        </div>
      ) : q && q.length >= 3 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Sin resultados</p>
          <p className="text-sm mt-1">
            No se encontraron mensajes para &quot;{q}&quot;
          </p>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <FileSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Buscar mensajes</p>
          <p className="text-sm mt-1">
            Busca por teléfono, appointment ID, trace ID, correlation ID o provider message ID
          </p>
          <p className="text-xs mt-2 text-muted-foreground">
            Mínimo 3 caracteres · Usa <kbd className="rounded border px-1 font-mono text-[10px]">⌘K</kbd> para buscar rápido
          </p>
        </div>
      )}
    </div>
  )
}
