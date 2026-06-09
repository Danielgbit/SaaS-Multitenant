'use client'

import { useState, useEffect } from 'react'
import { Package, TrendingUp, TrendingDown, RotateCcw, AlertTriangle, RefreshCw, History } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

import { Modal, Button, Spinner } from '@/components/ui'
import { getInventoryMovements, type InventoryMovement } from '@/actions/inventory/getInventoryMovements'

interface Props {
  itemId: string
  organizationId: string
  isOpen: boolean
  onClose: () => void
}

const MOVEMENT_LABELS: Record<string, string> = {
  purchase: 'Compra',
  sale: 'Venta',
  consumption: 'Consumo',
  adjustment: 'Ajuste',
  void: 'Anulación',
  return: 'Devolución',
}

const MOVEMENT_ICONS: Record<string, React.ReactNode> = {
  purchase: <Package className="w-4 h-4" />,
  sale: <TrendingUp className="w-4 h-4" />,
  consumption: <TrendingDown className="w-4 h-4" />,
  adjustment: <RotateCcw className="w-4 h-4" />,
  void: <RefreshCw className="w-4 h-4" />,
  return: <History className="w-4 h-4" />,
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  return new Date(date).toLocaleDateString('es-CO')
}

export function InventoryMovementModal({ itemId, organizationId, isOpen, onClose }: Props) {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const COLORS = useThemeColors()

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    const loadHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        setMovements([])

        const data = await getInventoryMovements(itemId, organizationId)

        if (cancelled) return

        setMovements(data)
      } catch (err) {
        if (cancelled) return

        console.error('[InventoryMovementModal]', err)

        setError(
          err instanceof Error
            ? err.message
            : 'Error al cargar historial'
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      cancelled = true
    }
  }, [isOpen, itemId, organizationId])

  

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: COLORS.overlay, backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[80dvh] overflow-hidden rounded-2xl"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-3">
            <History className="w-5 h-5" style={{ color: COLORS.primary }} />
            <h2 className="text-lg font-bold font-heading" style={{ color: COLORS.textPrimary }}>
              Historial de movimientos
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
          </button>
        </div>

        <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(80dvh - 80px)' }}>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" style={{ color: COLORS.primary }} />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <AlertTriangle className="w-8 h-8" style={{ color: COLORS.error }} />
              <p className="text-sm text-center" style={{ color: COLORS.textSecondary }}>
                {error}
              </p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true)
                  setError(null)
                  setMovements([])
                  getInventoryMovements(itemId, organizationId)
                    .then(setMovements)
                    .catch((err) => {
                      console.error('[InventoryMovementModal]', err)
                      setError(err instanceof Error ? err.message : 'Error al cargar historial')
                    })
                    .finally(() => setLoading(false))
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                style={{ color: COLORS.primary, backgroundColor: COLORS.primary + '15' }}
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: COLORS.textMuted }}>Sin movimientos registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((m) => {
                const isPositive = m.quantity_change > 0
                const color = isPositive ? COLORS.success : COLORS.danger
                return (
                  <div
                    key={m.id}
                    className="flex items-start gap-3 p-4 rounded-xl transition-colors"
                    style={{ backgroundColor: COLORS.surfaceSubtle }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.primary + '15' }}>
                      {MOVEMENT_ICONS[m.movement_type] || <Package className="w-4 h-4" style={{ color: COLORS.primary }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold truncate" style={{ color: COLORS.textPrimary }}>
                          {MOVEMENT_LABELS[m.movement_type] || m.movement_type}
                        </span>
                        <span className="text-sm font-bold shrink-0" style={{ color }}>
                          {isPositive ? '+' : ''}{m.quantity_change}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs" style={{ color: COLORS.textMuted }}>
                          {m.quantity_before} → {m.quantity_after}
                        </span>
                        <span className="text-xs" style={{ color: COLORS.textMuted }}>·</span>
                        <span className="text-xs" style={{ color: COLORS.textMuted }}>{timeAgo(m.created_at)}</span>
                      </div>
                      {m.reason && (
                        <p className="text-xs mt-1.5" style={{ color: COLORS.textSecondary }}>{m.reason}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return modalContent
}
