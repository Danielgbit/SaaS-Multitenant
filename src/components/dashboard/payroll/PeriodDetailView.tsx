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
import { Spinner } from '@/components/ui'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PAYROLL_STATUS_CONFIG } from '@/lib/payroll/constants'
import { toast } from 'sonner'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { ChangesPreviewModal } from './ChangesPreviewModal'
import { StatusBadge, ContractTypeBadge, PaymentTypeBadge } from './PayrollBadges'
import type { PayrollPeriod, PayrollItemWithEmployee, PayrollReceipt } from '@/types/payroll'

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

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function parsePeriod(period: string): { month: number; year: number; label: string } {
  const [year, month] = period.split('-').map(Number)
  return { month, year, label: `${MONTHS_ES[month - 1]} ${year}` }
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
  const COLORS = useThemeColors()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<PayrollItemWithEmployee>>>({})
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<EditingValues>({})
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)

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
    setLoading(true)
    setError(null)
    try {
      const { managePayrollPeriod } = await import('@/actions/payroll/managePayrollPeriod')
      const result = await managePayrollPeriod({
        periodId: period.id,
        action: 'delete',
      })
      if (result.success) {
        toast.success('Período eliminado correctamente')
        setShowDeleteModal(false)
        window.location.href = '/payroll'
      } else {
        const msg = result.error || 'Error al eliminar'
        setError(msg)
        toast.error(msg)
      }
    } catch (e) {
      const msg = 'Error inesperado'
      setError(msg)
      toast.error(msg)
    }
    setLoading(false)
    setShowDeleteModal(false)
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
        <Spinner size="lg" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
                className="text-3xl font-bold text-white font-heading"
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
                  onClick={() => setShowApproveModal(true)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  {loading ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                  Aprobar
                </button>
                <button
                  onClick={() => { setShowDeleteModal(true); setDeleteConfirmed(false) }}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  style={{ backgroundColor: 'rgba(220,38,38,0.6)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.6)'}
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
            {period.status === 'approved' && (
              <button
                onClick={() => { setShowDeleteModal(true); setDeleteConfirmed(false) }}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: 'rgba(220,38,38,0.4)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.4)'}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
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
        <Card variant="surface" className="p-5">
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
        </Card>

        <Card variant="surface" className="p-5">
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
        </Card>

        <Card variant="surface" className="p-5">
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
        </Card>

        <Card variant="surface" className="p-5">
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
        </Card>
      </div>

      {/* Employees Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: COLORS.surfaceGlass, borderColor: COLORS.border }}
      >
        <div className="p-5 border-b" style={{ borderColor: COLORS.border }}>
          <h2
            className="text-lg font-semibold font-heading"
            style={{ color: COLORS.textPrimary }}
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
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium" style={{ color: COLORS.textPrimary }}>
                                {(item.employee as any)?.name || 'Empleado'}
                              </span>
                              {item.base_salary > 0 && item.base_salary < 1500000 && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: COLORS.warning + '20', color: COLORS.warning }}
                                >
                                  Medio tiempo
                                </span>
                              )}
                            </div>
                          </div>
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
                            {item.payment_type === 'porcentaje' && item.gross_commission > 0
                              ? <>
                                  <span className="text-xs font-medium" style={{ color: COLORS.warning }}>
                                    {(item.employee as any)?.percentage || 60}%
                                  </span>
                                  <span className="mx-1" style={{ color: COLORS.textMuted }}>·</span>
                                  {formatCurrencyCOP(item.gross_commission)}
                                </>
                              : item.payment_type === 'mixed' && item.base_salary > 0
                                ? <>
                                    {formatCurrencyCOP(item.base_salary)}
                                    <span className="mx-1" style={{ color: COLORS.textMuted }}>+</span>
                                    <span className="text-xs font-medium" style={{ color: COLORS.warning }}>
                                      {(item.employee as any)?.percentage || 60}%
                                    </span>
                                  </>
                                : item.payment_type === 'porcentaje'
                                  ? '-'
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
            className="text-lg font-semibold font-heading"
            style={{ color: COLORS.textPrimary }}
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

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={period.status === 'approved' ? 'Eliminar período aprobado' : 'Eliminar período de nómina'}
        description={period.status === 'approved'
          ? `"${label}" ya fue aprobado. Si lo eliminas perderás todos los datos de nómina de este período. Los empleados se verán afectados.`
          : `¿Estás seguro de eliminar "${label}"? Se eliminarán todos los datos de nómina asociados. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant={period.status === 'approved' ? 'warning' : 'danger'}
        confirmDisabled={period.status === 'approved' && !deleteConfirmed}
        extraContent={period.status === 'approved' ? (
          <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-xl transition-colors"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = (COLORS as any).surfaceSubtle}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <input
              type="checkbox"
              checked={deleteConfirmed}
              onChange={(e) => setDeleteConfirmed(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: COLORS.error }}
            />
            <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>
              Entiendo que esto eliminará datos ya aprobados y no podré recuperarlos
            </span>
          </label>
        ) : undefined}
      />

      {/* Approve Modal */}
      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleApprove}
        title={`Aprobar período ${label}`}
        description={
          <div className="space-y-2 text-left">
            <p>Al aprobar el período se confirmarán los siguientes valores:</p>
            <div className="rounded-xl p-3 space-y-1.5" style={{ backgroundColor: (COLORS as any).surfaceSubtle }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: COLORS.textMuted }}>Empleados</span>
                <span className="font-medium" style={{ color: COLORS.textPrimary }}>{period.total_employees || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: COLORS.textMuted }}>Total Bruto</span>
                <span className="font-medium" style={{ color: COLORS.textPrimary }}>{formatCurrencyCOP(period.total_gross_pay || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: COLORS.textMuted }}>Deducciones</span>
                <span className="font-medium" style={{ color: COLORS.warning }}>-{formatCurrencyCOP(period.total_deductions || 0)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1.5 border-t" style={{ borderColor: COLORS.border }}>
                <span className="font-semibold" style={{ color: COLORS.textPrimary }}>Neto a Pagar</span>
                <span className="font-semibold" style={{ color: COLORS.success }}>{formatCurrencyCOP(period.total_net_pay || 0)}</span>
              </div>
            </div>
            <p className="text-xs" style={{ color: COLORS.warning }}>
              Una vez aprobado no podrás editar los valores del período.
            </p>
          </div>
        }
        confirmText="Aprobar período"
        variant="info"
      />

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModalWrapper
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handleMarkPaid}
          loading={loading}
          totalNetPay={formatCurrencyCOP(period.total_net_pay || 0)}
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


// PaymentModalWrapper moved to ./PaymentModalWrapper
