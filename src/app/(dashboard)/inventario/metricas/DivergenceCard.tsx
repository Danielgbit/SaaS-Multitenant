'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Spinner } from '@/components/ui'
import { captureError } from '@/lib/error-logger'
import { resolveDivergence } from '@/actions/inventory/resolveDivergence'
import { ASSISTED_RECONCILIATION_MAX_DELTA } from '@/lib/inventory/constants'
import type { OpenDivergence } from '@/lib/metrics/getInventoryMetrics'

interface Props {
  divergence: OpenDivergence
  organizationId: string
  onResolved: () => void
}

export function DivergenceCard({ divergence, organizationId, onResolved }: Props) {
  const [resolving, setResolving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const COLORS = useThemeColors()

  const isSignificant = Math.abs(divergence.delta) > ASSISTED_RECONCILIATION_MAX_DELTA
  const alignable = divergence.suggested_action === 'align_to_ledger'

  async function handleAlign() {
    setResolving('align')
    setError('')
    try {
      const result = await resolveDivergence(divergence.id, 'align', organizationId)
      if (result.error) setError(result.error)
      else onResolved()
    } catch (e) {
      setError('Error inesperado al alinear la divergencia.')
      captureError('inventory_divergence_align_unexpected', e, { divergenceId: divergence.id, organizationId })
    } finally {
      setResolving(null)
    }
  }

  async function handleDismiss() {
    setResolving('dismiss')
    setError('')
    try {
      const result = await resolveDivergence(divergence.id, 'dismiss', organizationId)
      if (result.error) setError(result.error)
      else onResolved()
    } catch (e) {
      setError('Error inesperado al descartar la divergencia.')
      captureError('inventory_divergence_dismiss_unexpected', e, { divergenceId: divergence.id, organizationId })
    } finally {
      setResolving(null)
    }
  }

  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: isSignificant ? COLORS.warning + '40' : COLORS.border,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: isSignificant ? COLORS.warning : COLORS.textMuted }} />
            <span className="text-sm font-semibold truncate" style={{ color: COLORS.textPrimary }}>
              {divergence.item_name}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="text-xs" style={{ color: COLORS.textMuted }}>
              Stock: <b>{divergence.current_stock}</b>
            </span>
            <span className="text-xs" style={{ color: COLORS.textMuted }}>
              Ledger: <b>{divergence.ledger_stock}</b>
            </span>
            <span className="text-xs font-bold" style={{
              color: divergence.delta > 0 ? COLORS.success : COLORS.danger,
            }}>
              {divergence.delta > 0 ? '+' : ''}{divergence.delta}
            </span>
          </div>
          {error && (
            <p className="text-xs mt-1" style={{ color: COLORS.danger }}>{error}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {alignable ? (
            <button
              type="button"
              onClick={handleAlign}
              disabled={resolving !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}
            >
              {resolving === 'align' ? <Spinner size="sm" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Alinear
            </button>
          ) : (
            <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.surfaceSubtle, color: COLORS.textMuted }}>
              Investigar
            </span>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            disabled={resolving !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
            style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle }}
          >
            {resolving === 'dismiss' ? <Spinner size="sm" /> : <XCircle className="w-3.5 h-3.5" />}
            Descartar
          </button>
        </div>
      </div>
    </div>
  )
}
