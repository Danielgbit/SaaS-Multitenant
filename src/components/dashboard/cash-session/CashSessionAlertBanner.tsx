'use client'
import { useThemeColors } from '@/hooks/useThemeColors'
import { AlertTriangle } from 'lucide-react'

interface Props {
  sessionDate: string
  openedAt: string | null
}

export function CashSessionAlertBanner({ sessionDate, openedAt }: Props) {
  const theme = useThemeColors()
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())

  if (sessionDate >= today) return null

  const hours = openedAt
    ? Math.floor((Date.now() - new Date(openedAt).getTime()) / (1000 * 60 * 60))
    : 0

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
      style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>
        Caja abierta desde{' '}
        {new Date(sessionDate).toLocaleDateString('es-CO', {
          day: 'numeric', month: 'long', year: 'numeric',
        })}
        {' '}({hours}h). Ciérrala para poder abrir una nueva.
      </span>
    </div>
  )
}
