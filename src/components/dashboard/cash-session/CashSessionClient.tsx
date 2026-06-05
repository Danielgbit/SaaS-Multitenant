'use client'
import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, RefreshCw, Download, Plus, Users, TrendingUp, TrendingDown, Minus, Calendar, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useThemeColors } from '@/hooks/useThemeColors'
import { getTodaySession } from '@/actions/cash-sessions/getTodaySession'
import { openSession } from '@/actions/cash-sessions/openSession'
import { closeSession } from '@/actions/cash-sessions/closeSession'
import { createManualEntry } from '@/actions/operation-entries/createManualEntry'
import { payEmployee } from '@/actions/operation-entries/payEmployee'
import { voidEntry } from '@/actions/operation-entries/voidEntry'
import type { PaymentMethod } from '@/types/cash-sessions'
import { ENTRY_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/types/cash-sessions'
import { CashTimeline } from './CashTimeline'
import { CashSummary } from './CashSummary'
import { OpenSessionForm } from './OpenSessionForm'
import { NewEntryModal } from './NewEntryModal'
import { PayEmployeeModal } from './PayEmployeeModal'
import { VoidEntryModal } from './VoidEntryModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { CashSessionAlertBanner } from './CashSessionAlertBanner'
import { CashSessionFAB } from './CashSessionFAB'
import { CashSessionSkeleton } from './CashSessionSkeleton'
import { formatTime12h } from '@/lib/utils/date-formatters'
import { MetricCard } from '@/components/ui/MetricCard'
import { Badge } from '@/components/ui/Badge'
import { PageContainer } from '@/components/ui/PageContainer'

function csvCell(value: unknown): string {
  const str = String(value ?? '')
  return `"${str.replace(/"/g, '""')}"`
}

function exportCashCSV(entries: any[]) {
  const headers = ['Hora', 'Tipo', 'Grupo', 'Titulo', 'Descripcion', 'Direccion', 'Monto', 'Metodo Pago', 'Origen']
  const rows = entries.map((e: any) => [
    e.created_at ? formatTime12h(e.created_at) : '',
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

function fmt(n: number) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) }

interface Props { initialSession: any; initialEntries: any[]; organizationId: string; role: string; userId: string }

export function CashSessionClient({ initialSession, initialEntries, organizationId, role, userId }: Props) {
  const COLORS = useThemeColors()
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [voidTarget, setVoidTarget] = useState<{ id: string; title: string } | null>(null)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const canManage = ['owner', 'admin', 'staff'].includes(role)
  const canAdmin = ['owner', 'admin'].includes(role)

  const { data: sd, error: queryError, refetch, isFetching } = useQuery({
    queryKey: ['cash-session', organizationId],
    queryFn: () => getTodaySession(organizationId),
    initialData: { success: true, session: initialSession, entries: initialEntries },
    refetchInterval: 30000,
  })
  const session = sd?.session ?? null
  const entries = sd?.entries ?? []

  const openM = useMutation({ mutationFn: openSession, onSuccess: () => qc.invalidateQueries({ queryKey: ['cash-session', organizationId] }), onError: (e) => toast.error(e.message || 'Error al abrir caja') })
  const closeM = useMutation({ mutationFn: closeSession, onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-session', organizationId] }); setShowPay(false); setShowCloseConfirm(false) }, onError: (e) => toast.error(e.message || 'Error al cerrar caja') })
  const entryM = useMutation({ mutationFn: createManualEntry, onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-session', organizationId] }); setShowNew(false) }, onError: (e) => toast.error(e.message || 'Error al registrar movimiento') })
  const payM = useMutation({ mutationFn: payEmployee, onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-session', organizationId] }); setShowPay(false) }, onError: (e) => toast.error(e.message || 'Error al pagar empleado') })
  const voidM = useMutation({ mutationFn: voidEntry, onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-session', organizationId] }); setVoidTarget(null) }, onError: (e) => toast.error(e.message || 'Error al anular movimiento') })

  const hOpen = useCallback(async (c: number) => openM.mutateAsync({ organization_id: organizationId, opening_cash: c }), [organizationId, openM])
  const hClose = useCallback(async (r: Record<PaymentMethod, number>, n?: string) => { if (session) await closeM.mutateAsync({ session_id: session.id, real_cash_detail: r, notes: n }) }, [session, closeM])
  const hEntry = useCallback(async (d: any) => { if (session) await entryM.mutateAsync({ cash_session_id: session.id, ...d }) }, [session, entryM])
  const hPay = useCallback(async (d: any) => payM.mutateAsync(d), [payM])
  const hVoid = useCallback(async (entryId: string, reason: string) => { await voidM.mutateAsync({ entry_id: entryId, reason }) }, [voidM])

  const today = useMemo(() => {
    return new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }, [])

  const sessionDuration = useMemo(() => {
    if (!session?.opened_at || session.status === 'closed') return null
    const opened = new Date(session.opened_at).getTime()
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    const diffMs = now - opened
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) return `Abierta hace ${hours}h ${mins}min`
    return `Abierta hace ${mins}min`
  }, [session])

  const kpis = useMemo(() => {
    const active = (entries || []).filter((e: any) => e.entry_status === 'active')
    const totalIn = active.filter((e: any) => e.direction === 'in').reduce((s: number, e: any) => s + e.amount, 0)
    const totalOut = active.filter((e: any) => e.direction === 'out').reduce((s: number, e: any) => s + e.amount, 0)
    const net = totalIn - totalOut
    return { totalIn, totalOut, net }
  }, [entries])

  const difference = useMemo(() => {
    if (!session) return null
    const isClosed = session.status === 'closed'
    const rd = session.real_cash_detail
    if (!rd) return null
    const METHODS: PaymentMethod[] = ['cash', 'qr', 'transfer', 'card']
    const ed = session.expected_cash_detail ?? { cash: 0, qr: 0, transfer: 0, card: 0 }
    const diff = METHODS.reduce((s, m) => s + ((rd[m] ?? 0) - (ed[m] ?? 0)), 0)
    return diff
  }, [session])

  if (!session) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <OpenSessionForm onSubmit={hOpen} isLoading={openM.isPending} />
        </div>
      </PageContainer>
    )
  }

  if (queryError) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="p-4 rounded-2xl" style={{ backgroundColor: COLORS.errorLight }}>
            <AlertCircle className="w-8 h-8" style={{ color: COLORS.error }} />
          </div>
          <p className="text-sm font-medium" style={{ color: COLORS.error }}>No se pudo cargar la caja</p>
          <p className="text-xs text-center max-w-sm" style={{ color: COLORS.textMuted }}>{queryError.message || 'Error desconocido al cargar los datos'}</p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:bg-opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8] disabled:opacity-50 flex items-center gap-2"
            style={{ borderColor: COLORS.border, color: COLORS.textPrimary, backgroundColor: COLORS.surface }}
          >
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Reintentar
          </button>
        </div>
      </PageContainer>
    )
  }

  const isOpen = session.status === 'open'

  return (
    <PageContainer>
      <div className="flex flex-col gap-5 py-4 lg:py-6">

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: COLORS.accentTealSubtle }}>
            <DollarSign className="w-6 h-6" style={{ color: COLORS.accentTeal }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>Caja del día</h1>
              <Badge variant={isOpen ? 'success' : 'neutral'} pulse={isOpen}>
                {isOpen ? 'Caja abierta' : 'Caja cerrada'}
              </Badge>
              {sessionDuration && (
                <span className="text-xs" style={{ color: COLORS.textMuted }}>{sessionDuration}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Calendar className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
              <span className="text-xs capitalize" style={{ color: COLORS.textMuted }}>{today}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0">
          <div className="shrink-0 w-[140px] lg:w-auto lg:flex-1 lg:max-w-[200px]">
            <MetricCard
              title="Ingresos"
              value={kpis.totalIn}
              icon={<TrendingUp className="w-4 h-4" />}
              iconColor={COLORS.success}
              className="lg:max-w-full"
            />
          </div>
          <div className="shrink-0 w-[140px] lg:w-auto lg:flex-1 lg:max-w-[200px]">
            <MetricCard
              title="Egresos"
              value={kpis.totalOut}
              icon={<TrendingDown className="w-4 h-4" />}
              iconColor={COLORS.error}
              className="lg:max-w-full"
            />
          </div>
          <div className="shrink-0 w-[140px] lg:w-auto lg:flex-1 lg:max-w-[200px]">
            <MetricCard
              title="Diferencia"
              value={Math.abs(kpis.net)}
              icon={kpis.net >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              iconColor={kpis.net >= 0 ? COLORS.success : COLORS.error}
              className="lg:max-w-full"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && isOpen && (
            <>
              <button
                onClick={() => setShowNew(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
                style={{ backgroundColor: COLORS.primary, color: '#fff' }}
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo gasto</span>
              </button>
              {canAdmin && (
                <button
                  onClick={() => setShowPay(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-all hover:bg-opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
                  style={{ borderColor: COLORS.border, color: COLORS.textPrimary, backgroundColor: COLORS.surface }}
                >
                  <Users className="w-4 h-4" />
                  <span>Pagar empleado</span>
                </button>
              )}
            </>
          )}
          <button
            onClick={() => { setIsExporting(true); try { exportCashCSV(entries); toast.success('CSV exportado correctamente') } finally { setIsExporting(false) } }}
            disabled={isExporting}
            className="p-2 rounded-xl transition-all hover:opacity-70 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8] disabled:opacity-50"
            style={{ borderColor: COLORS.border, color: COLORS.textSecondary, backgroundColor: COLORS.surface }}
            title="Exportar CSV"
            aria-label="Exportar CSV"
            aria-busy={isExporting}
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { setIsRefreshing(true); qc.invalidateQueries({ queryKey: ['cash-session', organizationId] }).finally(() => setIsRefreshing(false)) }}
            className="p-2 rounded-xl transition-all hover:opacity-70 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
            style={{ borderColor: COLORS.border, color: COLORS.textSecondary, backgroundColor: COLORS.surface }}
            title="Actualizar"
            aria-label="Actualizar"
          >
            {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
          {canManage && isOpen && (
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
              style={{ backgroundColor: COLORS.warning, color: '#fff' }}
            >
              <Minus className="w-4 h-4" />
              <span>Cerrar caja</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {difference !== null && isOpen && (
            <span className="text-xs" style={{ color: COLORS.textMuted }}>
              Esperado: {fmt(session.expected_cash)}
            </span>
          )}
          {!isOpen && difference !== null && (
            <span className="text-xs" style={{ color: difference === 0 ? COLORS.success : COLORS.error }}>
              {difference === 0 ? 'Cuadrada' : `Diferencia: ${fmt(difference)}`}
            </span>
          )}
        </div>

        <CashSessionAlertBanner
          sessionDate={session.session_date}
          openedAt={session.opened_at}
        />

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <CashTimeline entries={entries} onVoid={canAdmin ? (entry: any) => setVoidTarget({ id: entry.id, title: entry.title }) : undefined} />
          </div>
          <div className="w-full lg:w-80 shrink-0">
            <CashSummary session={session} entries={entries} onClose={(r) => { void hClose(r) }} isClosing={closeM.isPending} canClose={canManage && isOpen} organizationId={organizationId} />
          </div>
        </div>

      </div>
      {showNew && <NewEntryModal onSubmit={hEntry} onClose={() => setShowNew(false)} isLoading={entryM.isPending} />}
      {showPay && <PayEmployeeModal organizationId={organizationId} onSubmit={hPay} onClose={() => setShowPay(false)} isLoading={payM.isPending} />}
      {voidTarget && (
        <VoidEntryModal
          entryTitle={voidTarget.title}
          onSubmit={(reason) => hVoid(voidTarget.id, reason)}
          onClose={() => setVoidTarget(null)}
          isLoading={voidM.isPending}
        />
      )}

      {showCloseConfirm && (
        <ConfirmModal
          isOpen={showCloseConfirm}
          title="Cerrar caja"
          description="¿Cerrar la caja del día? Asegúrate de haber contado el efectivo y registrado todos los gastos."
          confirmText="Cerrar caja"
          variant="warning"
          onConfirm={async () => { hClose(session.real_cash_detail ?? { cash: 0, qr: 0, transfer: 0, card: 0 }) }}
          onClose={() => setShowCloseConfirm(false)}
          loading={closeM.isPending}
        />
      )}

      <CashSessionFAB
        onNewEntry={() => setShowNew(true)}
        onPayEmployee={() => setShowPay(true)}
        onCloseSession={async () => { await hClose(session.real_cash_detail ?? { cash: 0, qr: 0, transfer: 0, card: 0 }) }}
        onExport={() => { setIsExporting(true); try { exportCashCSV(entries); toast.success('CSV exportado correctamente') } finally { setIsExporting(false) } }}
        onRefresh={() => qc.invalidateQueries({ queryKey: ['cash-session', organizationId] })}
        canManage={canManage}
        canAdmin={canAdmin}
        isOpen={isOpen}
        isClosing={closeM.isPending}
        isExporting={isExporting}
      />
    </PageContainer>
  )
}
