'use client'
import { useMemo, useState } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Minus } from 'lucide-react'
import type { PaymentMethod } from '@/types/cash-sessions'
import { CashStatusCard } from './CashStatusCard'
import { PaymentBreakdownCard } from './PaymentBreakdownCard'
import { DailyMetricsCard } from './DailyMetricsCard'
import { LowStockAlertCard } from './LowStockAlertCard'
import { ConfirmModal } from './ConfirmModal'

const METHODS: PaymentMethod[] = ['cash', 'qr', 'transfer', 'card']

interface CashSummaryProps {
  session: any
  entries: any[]
  onClose: (realCashDetail: Record<PaymentMethod, number>) => void | Promise<void>
  isClosing: boolean
  canClose: boolean
  organizationId: string
}

export function CashSummary({ session, entries, onClose, isClosing, canClose, organizationId }: CashSummaryProps) {
  const COLORS = useThemeColors()
  const [showConfirm, setShowConfirm] = useState(false)
  const isClosed = session.status === 'closed'
  const ed = session.expected_cash_detail ?? { cash: 0, qr: 0, transfer: 0, card: 0 }
  const rd = session.real_cash_detail
  const active = (entries || []).filter((e: any) => e.entry_status === 'active')
  const totalIn = active.filter((e: any) => e.direction === 'in').reduce((s: number, e: any) => s + e.amount, 0)
  const totalOut = active.filter((e: any) => e.direction === 'out').reduce((s: number, e: any) => s + e.amount, 0)
  const ec = isClosed ? session.expected_cash : session.opening_cash + totalIn - totalOut
  const diff = (m: PaymentMethod) => rd ? (rd[m] ?? 0) - (ed[m] ?? 0) : null
  const totalDiff = rd ? METHODS.reduce((s, m) => s + (diff(m) ?? 0), 0) : null

  const expectedDetail = useMemo(() => {
    if (!isClosed) {
      return METHODS.reduce((acc, m) => {
        acc[m] = (session.expected_cash_detail ?? { cash: 0, qr: 0, transfer: 0, card: 0 })[m] ?? 0
        return acc
      }, {} as Record<PaymentMethod, number>)
    }
    return ed
  }, [isClosed, ed, session.expected_cash_detail])

  return (
    <div className="flex flex-col gap-3 p-3 lg:p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-hide">
      <CashStatusCard
        session={session}
        expectedCash={ec}
        difference={isClosed ? totalDiff : null}
      />

      <PaymentBreakdownCard
        expectedDetail={expectedDetail}
        realDetail={rd}
        isClosed={isClosed}
      />

      <DailyMetricsCard entries={active} />

      <LowStockAlertCard organizationId={organizationId} />

      {canClose && (
        <>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isClosing}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
            style={{ backgroundColor: COLORS.warning, color: '#fff' }}
          >
            <Minus className="w-4 h-4" />
            {isClosing ? 'Cerrando...' : 'Cerrar caja'}
          </button>
          {showConfirm && (
            <ConfirmModal
              title="Cerrar caja"
              message="¿Cerrar la caja del día? Asegúrate de haber contado el efectivo y registrado todos los gastos."
              confirmLabel="Cerrar caja"
              variant="warning"
              onConfirm={() => onClose(session.real_cash_detail ?? { cash: 0, qr: 0, transfer: 0, card: 0 })}
              onClose={() => setShowConfirm(false)}
              isLoading={isClosing}
            />
          )}
        </>
      )}
    </div>
  )
}
