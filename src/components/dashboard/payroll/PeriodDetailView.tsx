'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Users,
  Wallet,
  TrendingUp,
  CheckCircle,
  Clock,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Pencil,
  Save,
  X,
  Receipt,
  Download,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Trash2,
  FileText,
  Mail,
  Edit2
} from 'lucide-react'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { useThemeColors } from '@/hooks/useThemeColors'

function useColors() {
  return useThemeColors()
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function parsePeriod(period: string): { month: number; year: number; label: string } {
  const [year, month] = period.split('-').map(Number)
  return {
    month,
    year,
    label: `${MONTHS_ES[month - 1]} ${year}`,
  }
}

function StatusBadge({ status }: { status: string }) {
  const COLORS = useColors()
  const config = {
    draft: { bg: COLORS.warning + '20', color: COLORS.warning, icon: Clock, label: 'Borrador' },
    approved: { bg: COLORS.primary + '20', color: COLORS.primary, icon: CheckCircle, label: 'Aprobado' },
    paid: { bg: COLORS.success + '20', color: COLORS.success, icon: CheckCircle, label: 'Pagado' },
  }[status] || { bg: COLORS.textMuted + '20', color: COLORS.textMuted, icon: Clock, label: status }

  const Icon = config.icon

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

function ContractTypeBadge({ type }: { type: string }) {
  const COLORS = useColors()
  const config = type === 'laboral'
    ? { bg: COLORS.primary + '15', color: COLORS.primary, label: 'Laboral' }
    : { bg: COLORS.success + '15', color: COLORS.success, label: 'Prestación' }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}

function PaymentTypeBadge({ type }: { type: string }) {
  const COLORS = useColors()
  const config = {
    fijo: { bg: COLORS.primary + '15', color: COLORS.primary, label: 'Fijo' },
    porcentaje: { bg: COLORS.warning + '15', color: COLORS.warning, label: 'Comisión' },
    mixed: { bg: '#8B5CF615', color: '#8B5CF6', label: 'Mixto' },
  }[type] || { bg: COLORS.textMuted + '15', color: COLORS.textMuted, label: type }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}

type PendingChange = {
  itemId: string
  employeeName: string
  field: string
  oldValue: any
  newValue: any
}

type EditingValues = {
  contract_type?: 'laboral' | 'prestacion'
  payment_type?: 'fijo' | 'porcentaje' | 'mixed'
  base_salary?: number
}

interface PeriodDetailViewProps {
  period: PayrollPeriod
  items: PayrollItemWithEmployee[]
  receipts: PayrollReceipt[]
  organizationId: string
  userRole: string
}

export function PeriodDetailView({
  period,
  items,
  receipts,
  organizationId,
  userRole,
}: PeriodDetailViewProps) {
  const COLORS = useColors()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<PayrollItemWithEmployee>>>({})
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<EditingValues>({})
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { month, year, label } = parsePeriod(period.period)

  const getPendingChangesList = useMemo((): PendingChange[] => {
    const changes: PendingChange[] = []
    const item = items.find(i => i.id === editingItemId)
    if (!item || !editingValues) return changes

    if (editingValues.contract_type !== item.contract_type) {
      changes.push({
        itemId: item.id,
        employeeName: (item.employee as any)?.name || 'Empleado',
        field: 'contract_type',
        oldValue: item.contract_type,
        newValue: editingValues.contract_type,
      })
    }
    if (editingValues.payment_type !== item.payment_type) {
      changes.push({
        itemId: item.id,
        employeeName: (item.employee as any)?.name || 'Empleado',
        field: 'payment_type',
        oldValue: item.payment_type,
        newValue: editingValues.payment_type,
      })
    }
    if (editingValues.base_salary !== item.base_salary) {
      changes.push({
        itemId: item.id,
        employeeName: (item.employee as any)?.name || 'Empleado',
        field: 'base_salary',
        oldValue: item.base_salary,
        newValue: editingValues.base_salary,
      })
    }
    return changes
  }, [editingItemId, editingValues, items])

  const handleApprove = async () => {
    setLoading(true)
    setError(null)
    try {
      const { managePayrollPeriod } = await import('@/actions/payroll/managePayrollPeriod')
      const result = await managePayrollPeriod({
        periodId: period.id,
        action: 'approve',
      })
      if (result.success) {
        setSuccess('Período aprobado correctamente')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setError(result.error || 'Error al aprobar')
      }
    } catch (e) {
      setError('Error inesperado')
    }
    setLoading(false)
  }

  const handleMarkPaid = async (paymentMethod: PaymentMethod, paymentReference?: string) => {
    setLoading(true)
    setError(null)
    try {
      const { managePayrollPeriod } = await import('@/actions/payroll/managePayrollPeriod')
      const result = await managePayrollPeriod({
        periodId: period.id,
        action: 'markPaid',
        paymentMethod,
        paymentReference,
      })
      if (result.success) {
        setSuccess('Período marcado como pagado')
        setShowPaymentModal(false)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setError(result.error || 'Error al marcar como pagado')
      }
    } catch (e) {
      setError('Error inesperado')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este período? Esta acción no se puede deshacer.')) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { managePayrollPeriod } = await import('@/actions/payroll/managePayrollPeriod')
      const result = await managePayrollPeriod({
        periodId: period.id,
        action: 'delete',
      })
      if (result.success) {
        window.location.href = '/payroll'
      } else {
        setError(result.error || 'Error al eliminar')
      }
    } catch (e) {
      setError('Error inesperado')
    }
    setLoading(false)
  }

  const startEditing = (item: PayrollItemWithEmployee) => {
    if (period.status !== 'draft') return
    setEditingItemId(item.id)
    setEditingValues({
      contract_type: item.contract_type,
      payment_type: item.payment_type,
      base_salary: item.base_salary,
    })
  }

  const cancelEditing = () => {
    setEditingItemId(null)
    setEditingValues({})
  }

  const handleFieldChange = (field: string, value: any) => {
    setEditingValues(prev => ({ ...prev, [field]: value }))
  }

  const hasChanges = () => {
    const item = items.find(i => i.id === editingItemId)
    if (!item || !editingValues) return false
    return (
      editingValues.contract_type !== item.contract_type ||
      editingValues.payment_type !== item.payment_type ||
      editingValues.base_salary !== item.base_salary
    )
  }

  const handleSaveChanges = () => {
    const item = items.find(i => i.id === editingItemId)
    if (!item) return

    const changes: PendingChange[] = []

    if (editingValues.contract_type !== item.contract_type) {
      changes.push({
        itemId: item.id,
        employeeName: (item.employee as any)?.name || 'Empleado',
        field: 'contract_type',
        oldValue: item.contract_type,
        newValue: editingValues.contract_type,
      })
    }
    if (editingValues.payment_type !== item.payment_type) {
      changes.push({
        itemId: item.id,
        employeeName: (item.employee as any)?.name || 'Empleado',
        field: 'payment_type',
        oldValue: item.payment_type,
        newValue: editingValues.payment_type,
      })
    }
    if (editingValues.base_salary !== item.base_salary) {
      changes.push({
        itemId: item.id,
        employeeName: (item.employee as any)?.name || 'Empleado',
        field: 'base_salary',
        oldValue: item.base_salary,
        newValue: editingValues.base_salary,
      })
    }

    if (changes.length > 0) {
      setPendingChanges({ [item.id]: editingValues })
      setShowPreviewModal(true)
    }
  }

  const handleConfirmChanges = async () => {
    if (!editingItemId) return
    setLoading(true)
    setShowPreviewModal(false)

    try {
      const { updatePayrollItem } = await import('@/actions/payroll/updatePayrollItem')
      const result = await updatePayrollItem({
        itemId: editingItemId,
        changes: {
          contract_type: editingValues.contract_type,
          payment_type: editingValues.payment_type,
          base_salary: editingValues.base_salary,
        }
      })

      if (result.success) {
        setSuccess('Cambios aplicados correctamente')
        setEditingItemId(null)
        setEditingValues({})
        setPendingChanges({})
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setError(result.error || 'Error al guardar cambios')
      }
    } catch (e) {
      setError('Error inesperado')
    }
    setLoading(false)
  }

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
      `}</style>

      {/* Back Button */}
      <Link
        href="/payroll"
        className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80"
        style={{ color: COLORS.textSecondary }}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Nómina
      </Link>

      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: COLORS.primaryGradient }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Período de Nómina
              </p>
              <h1
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {label}
              </h1>
              <div className="mt-2">
                <StatusBadge status={period.status} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {period.status === 'draft' && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Aprobar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: 'rgba(220,38,38,0.6)' }}
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </>
            )}
            {period.status === 'approved' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center gap-2"
                style={{ backgroundColor: COLORS.success }}
              >
                <CreditCard className="w-4 h-4" />
                Marcar Pagado
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div
          className="p-4 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: COLORS.errorLight }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: COLORS.error }} />
          <span style={{ color: COLORS.error }}>{error}</span>
        </div>
      )}
      {success && (
        <div
          className="p-4 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: COLORS.successLight }}
        >
          <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.success }} />
          <span style={{ color: COLORS.success }}>{success}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primary + '15' }}>
              <Users className="w-4 h-4" style={{ color: COLORS.primary }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Empleados
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
            {items.length}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.success + '15' }}>
              <Wallet className="w-4 h-4" style={{ color: COLORS.success }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Total Bruto
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
            {formatCurrencyCOP(period.total_gross_pay || 0)}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.warning + '15' }}>
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.warning }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Deducciones
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>
            -{formatCurrencyCOP(period.total_deductions || 0)}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.success + '15' }}>
              <DollarSign className="w-4 h-4" style={{ color: COLORS.success }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Neto a Pagar
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.success }}>
            {formatCurrencyCOP(period.total_net_pay || 0)}
          </p>
        </div>
      </div>

      {/* Employees Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
      >
        <div className="p-5 border-b" style={{ borderColor: COLORS.border }}>
          <h2
            className="text-lg font-semibold"
            style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
          >
            Empleados en este Período
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.textMuted }} />
            <p style={{ color: COLORS.textMuted }}>No hay empleados en este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: COLORS.border }}>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Empleado</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Contrato</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Tipo</th>
                  <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Base/Comisión</th>
                  <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Deducciones</th>
                  <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Neto</th>
                  {period.status === 'draft' && (
                    <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isEditing = editingItemId === item.id
                  return (
                    <tr
                      key={item.id}
                      className="border-b transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      style={{ borderColor: COLORS.border }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}
                          >
                            {(item.employee as any)?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium" style={{ color: COLORS.textPrimary }}>
                            {(item.employee as any)?.name || 'Empleado'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <select
                            value={editingValues.contract_type || item.contract_type}
                            onChange={(e) => handleFieldChange('contract_type', e.target.value)}
                            className="px-2 py-1 rounded-lg text-xs font-medium border"
                            style={{
                              backgroundColor: COLORS.surface,
                              borderColor: COLORS.border,
                              color: COLORS.textPrimary
                            }}
                          >
                            <option value="laboral">Laboral</option>
                            <option value="prestacion">Prestación</option>
                          </select>
                        ) : (
                          <ContractTypeBadge type={item.contract_type} />
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <select
                            value={editingValues.payment_type || item.payment_type}
                            onChange={(e) => handleFieldChange('payment_type', e.target.value)}
                            className="px-2 py-1 rounded-lg text-xs font-medium border"
                            style={{
                              backgroundColor: COLORS.surface,
                              borderColor: COLORS.border,
                              color: COLORS.textPrimary
                            }}
                          >
                            <option value="fijo">Fijo</option>
                            <option value="porcentaje">Comisión</option>
                            <option value="mixed">Mixto</option>
                          </select>
                        ) : (
                          <PaymentTypeBadge type={item.payment_type} />
                        )}
                      </td>
                      <td className="p-4 text-right min-w-[120px]">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingValues.base_salary ?? item.base_salary ?? 0}
                            onChange={(e) => handleFieldChange('base_salary', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 rounded-lg text-xs text-right border"
                            style={{
                              backgroundColor: COLORS.surface,
                              borderColor: COLORS.border,
                              color: COLORS.textPrimary
                            }}
                          />
                        ) : (
                          <span style={{ color: COLORS.textPrimary }}>
                            {item.payment_type === 'porcentaje'
                              ? (item.gross_commission > 0 ? formatCurrencyCOP(item.gross_commission) : '-')
                              : formatCurrencyCOP(item.base_salary || 0)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span style={{ color: COLORS.warning }}>
                          {item.total_deductions > 0 ? `-${formatCurrencyCOP(item.total_deductions)}` : '-'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-semibold" style={{ color: COLORS.success }}>
                          {formatCurrencyCOP(item.net_pay)}
                        </span>
                      </td>
                      {period.status === 'draft' && (
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={cancelEditing}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: COLORS.textMuted, backgroundColor: COLORS.surfaceSubtle }}
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleSaveChanges}
                                disabled={!hasChanges()}
                                className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                style={{ color: 'white', backgroundColor: hasChanges() ? COLORS.primary : COLORS.textMuted }}
                              >
                                <Save className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditing(item)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                              style={{ color: COLORS.textMuted }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipts Section */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
      >
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
          <h2
            className="text-lg font-semibold"
            style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
          >
            Recibos de este Período
          </h2>
          <span className="text-sm" style={{ color: COLORS.textMuted }}>
            {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {receipts.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.textMuted }} />
            <p style={{ color: COLORS.textMuted }}>No hay recibos generados para este período</p>
            {period.status === 'paid' && (
              <p className="text-sm mt-2" style={{ color: COLORS.textMuted }}>
                Los recibos se generan al marcar el período como pagado
              </p>
            )}
          </div>
        ) : (
          <div className="p-5 space-y-3">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: COLORS.surfaceSubtle }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: COLORS.success + '15' }}
                  >
                    <Receipt className="w-5 h-5" style={{ color: COLORS.success }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: COLORS.textPrimary }}>
                      {(receipt as any).employee_name || 'Empleado'}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                      {new Date(receipt.payment_date).toLocaleDateString('es-ES')}
                      {receipt.payment_method && ` · ${PAYMENT_METHODS[receipt.payment_method as PaymentMethod]?.label || receipt.payment_method}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold" style={{ color: COLORS.success }}>
                    {formatCurrencyCOP(receipt.net_amount)}
                  </span>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: receipt.status === 'paid' ? COLORS.successLight : COLORS.warningLight,
                      color: receipt.status === 'paid' ? COLORS.success : COLORS.warning,
                    }}
                  >
                    {receipt.status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModalWrapper
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handleMarkPaid}
          loading={loading}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && Object.keys(pendingChanges).length > 0 && (
        <ChangesPreviewModal
          changes={getPendingChangesList}
          onCancel={() => {
            setShowPreviewModal(false)
          }}
          onConfirm={handleConfirmChanges}
          loading={loading}
        />
      )}
    </div>
  )
}


function PaymentModalWrapper({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void
  onConfirm: (method: PaymentMethod, reference?: string) => void
  loading: boolean
}) {
  const COLORS = useColors()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo')
  const [paymentReference, setPaymentReference] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        <h3
          className="text-xl font-bold mb-4"
          style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
        >
          Registrar Pago
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
              Método de pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-4 py-3 rounded-xl border"
              style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
            >
              {Object.entries(PAYMENT_METHODS).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
              Referencia (opcional)
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Número de transacción, referencia..."
              className="w-full px-4 py-3 rounded-xl border"
              style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: COLORS.surfaceSubtle, color: COLORS.textSecondary }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(paymentMethod, paymentReference || undefined)}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.success }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  )
}
