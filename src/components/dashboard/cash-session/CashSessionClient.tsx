'use client'
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, RefreshCw, Download } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { getTodaySession } from '@/actions/cash-sessions/getTodaySession'
import { openSession } from '@/actions/cash-sessions/openSession'
import { closeSession } from '@/actions/cash-sessions/closeSession'
import { createManualEntry } from '@/actions/operation-entries/createManualEntry'
import { payEmployee } from '@/actions/operation-entries/payEmployee'
import type { PaymentMethod } from '@/types/cash-sessions'
import { ENTRY_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/types/cash-sessions'
import { CashTimeline } from './CashTimeline'
import { CashSummary } from './CashSummary'
import { OpenSessionForm } from './OpenSessionForm'
import { NewEntryModal } from './NewEntryModal'
import { PayEmployeeModal } from './PayEmployeeModal'
import { CashSessionAlertBanner } from './CashSessionAlertBanner'

function csvCell(value: unknown): string {
  const str = String(value ?? '')
  return `"${str.replace(/"/g, '""')}"`
}

function exportCashCSV(entries: any[]) {
  const headers = ['Hora', 'Tipo', 'Grupo', 'Titulo', 'Descripcion', 'Direccion', 'Monto', 'Metodo Pago', 'Origen']
  const rows = entries.map((e: any) => [
    e.created_at ? new Date(e.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
    ENTRY_TYPE_LABELS[e.entry_type as keyof typeof ENTRY_TYPE_LABELS] || e.entry_type,
    e.entry_group || '',
    e.title,
    e.description || '',
    e.direction || '-',
    e.amount.toString(),
    e.payment_method ? PAYMENT_METHOD_LABELS[e.payment_method as keyof typeof PAYMENT_METHOD_LABELS] : '-',
    e.created_via,
  ])
  const csvContent = [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `caja-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

interface Props { initialSession: any; initialEntries: any[]; organizationId: string; role: string; userId: string }

export function CashSessionClient({ initialSession, initialEntries, organizationId, role, userId }: Props) {
  const theme = useThemeColors()
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const canManage = ['owner', 'admin', 'staff'].includes(role)
  const canAdmin = ['owner', 'admin'].includes(role)

  const { data: sd } = useQuery({
    queryKey: ['cash-session', organizationId],
    queryFn: () => getTodaySession(organizationId),
    initialData: { success: true, session: initialSession, entries: initialEntries },
    refetchInterval: 30000,
  })
  const session = sd?.session ?? null
  const entries = sd?.entries ?? []

  const openM = useMutation({ mutationFn: openSession, onSuccess: () => qc.invalidateQueries({ queryKey: ['cash-session', organizationId] }) })
  const closeM = useMutation({ mutationFn: closeSession, onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-session', organizationId] }); setShowPay(false) } })
  const entryM = useMutation({ mutationFn: createManualEntry, onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-session', organizationId] }); setShowNew(false) } })
  const payM = useMutation({ mutationFn: payEmployee, onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-session', organizationId] }); setShowPay(false) } })

  const hOpen = useCallback(async (c: number) => openM.mutateAsync({ organization_id: organizationId, opening_cash: c }), [organizationId, openM])
  const hClose = useCallback(async (r: Record<PaymentMethod, number>, n?: string) => { if (session) await closeM.mutateAsync({ session_id: session.id, real_cash_detail: r, notes: n }) }, [session, closeM])
  const hEntry = useCallback(async (d: any) => { if (session) await entryM.mutateAsync({ cash_session_id: session.id, ...d }) }, [session, entryM])
  const hPay = useCallback(async (d: any) => payM.mutateAsync(d), [payM])

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <OpenSessionForm onSubmit={hOpen} isLoading={openM.isPending} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6" style={{ color: theme.accentTeal }} />
          <h1 className="text-xl font-bold" style={{ color: theme.textPrimary }}>Caja del Dia</h1>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: session.status === 'open' ? 'rgba(34,197,94,0.15)' : 'rgba(156,163,175,0.15)', color: session.status === 'open' ? '#22c55e' : '#9ca3af' }}>
            {session.status === 'open' ? 'Abierta' : 'Cerrada'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canManage && session.status === 'open' && (
            <>
              <button onClick={() => setShowNew(true)} className="px-3 py-1.5 text-sm rounded-lg font-medium" style={{ backgroundColor: theme.primary, color: '#fff' }}>+ Gasto / Nota</button>
              {canAdmin && <button onClick={() => setShowPay(true)} className="px-3 py-1.5 text-sm rounded-lg font-medium border" style={{ borderColor: theme.border, color: theme.textPrimary }}>Pagar Empleado</button>}
            </>
          )}
          <button onClick={() => exportCashCSV(entries)} className="p-1.5 rounded-lg transition-all hover:opacity-70" style={{ color: theme.textSecondary }} title="Exportar CSV">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => qc.invalidateQueries({ queryKey: ['cash-session', organizationId] })} className="p-1.5 rounded-lg" style={{ color: theme.textSecondary }}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <CashSessionAlertBanner
        sessionDate={session.session_date}
        openedAt={session.opened_at}
      />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <CashTimeline entries={entries} canVoid={canAdmin} />
        </div>
        <div className="w-full lg:w-80 shrink-0">
          <CashSummary session={session} entries={entries} onClose={hClose} isClosing={closeM.isPending} canClose={canManage && session.status === 'open'} organizationId={organizationId} />
        </div>
      </div>
      {showNew && <NewEntryModal onSubmit={hEntry} onClose={() => setShowNew(false)} isLoading={entryM.isPending} />}
      {showPay && <PayEmployeeModal organizationId={organizationId} onSubmit={hPay} onClose={() => setShowPay(false)} isLoading={payM.isPending} />}
    </div>
  )
}
