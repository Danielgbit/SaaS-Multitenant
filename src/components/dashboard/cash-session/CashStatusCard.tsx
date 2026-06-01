'use client'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Badge } from '@/components/ui/Badge'

function fmt(n: number) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) }

interface CashStatusCardProps {
  session: any
  expectedCash: number
  difference: number | null
}

export function CashStatusCard({ session, expectedCash, difference }: CashStatusCardProps) {
  const COLORS = useThemeColors()
  const isOpen = session.status === 'open'
  const isClosed = session.status === 'closed'

  return (
    <div
      className="p-3 sm:p-4 lg:p-5 rounded-[20px] border"
      style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, boxShadow: COLORS.shadow.md }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Estado de caja</h3>
        <Badge variant={isOpen ? 'success' : 'neutral'} pulse={isOpen}>
          {isOpen ? 'Abierta' : 'Cerrada'}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: COLORS.textMuted }}>Apertura</span>
          <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
            {fmt(session.opening_cash)}
          </span>
        </div>

        {isOpen && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: COLORS.textMuted }}>Esperado</span>
            <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
              {fmt(expectedCash)}
            </span>
          </div>
        )}

        {isClosed && difference !== null && (
          <div
            className="mt-2 p-3 rounded-xl"
            style={{
              backgroundColor: difference === 0 ? COLORS.successLight : COLORS.errorLight,
            }}
          >
            <div className="flex justify-between items-center">
              <span
                className="text-sm font-semibold"
                style={{ color: difference === 0 ? COLORS.success : COLORS.error }}
              >
                {difference === 0 ? 'Cuadrada' : 'Diferencia'}
              </span>
              <span
                className="text-lg font-bold"
                style={{ color: difference === 0 ? COLORS.success : COLORS.error }}
              >
                {difference > 0 ? '+' : ''}{fmt(difference)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
