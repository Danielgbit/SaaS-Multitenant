'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, DollarSign, CheckCircle2, AlertTriangle, Clock, ChevronUp, ChevronDown, FileText, Ban, Pencil } from 'lucide-react'
import { Spinner } from '@/components/ui'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import type { ClientAccountTransactionWithDetails, InventoryItemWithStock } from '@/types/clientAccounts'
import { AccountSummaryCards } from './AccountSummaryCards'
import { SaleModal } from './SaleModal'
import { PaymentModal } from './PaymentModal'
import { AdjustmentModal } from './AdjustmentModal'
import { EditAdjustmentModal } from './EditAdjustmentModal'

interface ClientAccountDetailClientProps {
  client: {
    id: string
    name: string
    phone: string | null
    email: string | null
  }
  account: {
    id: string
    balance: number
    total_purchased: number
    total_paid: number
    credit_limit: number
    is_over_limit: boolean
    is_at_warning_threshold: boolean
  }
  transactions: ClientAccountTransactionWithDetails[]
  products: InventoryItemWithStock[]
  organizationId: string
  userRole: string
}

export function ClientAccountDetailClient({
  client,
  account,
  transactions,
  products,
  organizationId,
}: ClientAccountDetailClientProps) {
  const COLORS = useThemeColors()
  const [mounted, setMounted] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [voidTarget, setVoidTarget] = useState<{ id: string; type: string; amount: number } | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [editTarget, setEditTarget] = useState<{ id: string; description: string; reference: string | null } | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="w-4 h-4" style={{ color: COLORS.error }} />
      case 'payment':
        return <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.success }} />
      case 'adjustment':
        return <FileText className="w-4 h-4" style={{ color: COLORS.warning }} />
      default:
        return <DollarSign className="w-4 h-4" style={{ color: COLORS.textMuted }} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/clients/accounts"
        className="inline-flex items-center gap-2 text-sm transition-colors"
        style={{ color: COLORS.textSecondary }}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Cuentas
      </Link>

      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: COLORS.primaryGradient }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1
              className="text-3xl font-bold text-white font-heading"
            >
              {client.name}
            </h1>
            <p className="text-white/80">
              {client.phone || 'Sin teléfono'} • {client.email || 'Sin email'}
            </p>
          </div>
        </div>
      </div>

      <AccountSummaryCards
        balance={account.balance}
        totalPurchased={account.total_purchased}
        totalPaid={account.total_paid}
        creditLimit={account.credit_limit}
        isOverLimit={account.is_over_limit}
        isAtWarningThreshold={account.is_at_warning_threshold}
      />

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setShowSaleModal(true)}
          className="py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
          style={{ backgroundColor: COLORS.primary }}
        >
          <ShoppingCart className="w-5 h-5" />
          Registrar Venta
        </button>
        <button
          onClick={() => setShowPaymentModal(true)}
          disabled={account.balance <= 0}
          className="py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: COLORS.success }}
        >
          <DollarSign className="w-5 h-5" />
          Registrar Pago
        </button>
        <button
          onClick={() => setShowAdjustmentModal(true)}
          className="py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
          style={{ backgroundColor: COLORS.warning }}
        >
          <FileText className="w-5 h-5" />
          Agregar Cargo
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div
          className="p-4 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: COLORS.successLight }}
        >
          <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.success }} />
          <span style={{ color: COLORS.success }}>{successMessage}</span>
        </div>
      )}

      {error && (
        <div
          className="p-4 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: COLORS.errorLight }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: COLORS.error }} />
          <span style={{ color: COLORS.error }}>{error}</span>
        </div>
      )}

      {/* Transaction History */}
      <div
        className="p-6 rounded-2xl border"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
        }}
      >
        <h2
          className="text-lg font-semibold mb-4 font-heading"
          style={{ color: COLORS.textPrimary }}
        >
          Historial de Transacciones
        </h2>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.textMuted }} />
            <p style={{ color: COLORS.textMuted }}>No hay transacciones registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: COLORS.surfaceSubtle }}
              >
                <button
                  onClick={() =>
                    setExpandedTransaction(
                      expandedTransaction === transaction.id ? null : transaction.id
                    )
                  }
                  className="w-full flex items-center justify-between p-4"
                  style={{ opacity: transaction.is_voided ? 0.5 : 1 }}
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div className="text-left">
                      <p className="font-medium" style={{ color: COLORS.textPrimary }}>
                        {transaction.transaction_type === 'sale' ? 'Venta' :
                         transaction.transaction_type === 'payment' ? 'Pago' :
                         transaction.transaction_type === 'adjustment' ? 'Ajuste' :
                         transaction.transaction_type}
                        {transaction.is_voided && (
                          <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.errorLight, color: COLORS.error }}>
                            Anulado
                          </span>
                        )}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>
                        {new Date(transaction.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="font-bold"
                      style={{
                        color:
                          transaction.transaction_type === 'sale'
                            ? COLORS.error
                            : transaction.transaction_type === 'adjustment'
                              ? COLORS.warning
                              : COLORS.success,
                      }}
                    >
                      {transaction.transaction_type === 'sale' ? '-' : '+'}
                      {formatCurrencyCOP(transaction.amount)}
                    </span>
                    {expandedTransaction === transaction.id ? (
                      <ChevronUp className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                    ) : (
                      <ChevronDown className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                    )}
                  </div>
                </button>

                {expandedTransaction === transaction.id && (
                  <div
                    className="px-4 pb-4 pt-2 border-t"
                    style={{ borderColor: COLORS.border }}
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: COLORS.textMuted }}>Método de pago</span>
                        <span style={{ color: COLORS.textSecondary }}>
                          {transaction.payment_method || 'N/A'}
                        </span>
                      </div>
                      {transaction.payment_reference && (
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.textMuted }}>Referencia</span>
                          <span style={{ color: COLORS.textSecondary }}>
                            {transaction.payment_reference}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span style={{ color: COLORS.textMuted }}>Balance después</span>
                        <span style={{ color: COLORS.textSecondary }}>
                          {formatCurrencyCOP(transaction.balance_after)}
                        </span>
                      </div>
                      {transaction.notes && (
                        <div className="pt-2">
                          <p style={{ color: COLORS.textMuted }}>Notas:</p>
                          <p style={{ color: COLORS.textSecondary }}>{transaction.notes}</p>
                        </div>
                      )}
                      {!transaction.is_voided && (
                        <div className="pt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setVoidTarget({
                                id: transaction.id,
                                type: transaction.transaction_type,
                                amount: transaction.amount,
                              })
                            }}
                            className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                            style={{ color: COLORS.error, backgroundColor: COLORS.errorLight }}
                          >
                            <Ban className="w-4 h-4" />
                            Anular transacción
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showSaleModal && (
        <SaleModal
          products={products}
          onRecord={async (selected, paymentMethod) => {
            const { recordSale } = await import('@/actions/clientAccounts/recordTransaction')
            const isCredit = paymentMethod === 'credit'
            const result = await recordSale(organizationId, {
              client_id: client.id,
              products: selected.map(p => ({ inventory_item_id: p.productId, quantity: p.quantity, unit_price: p.price })),
              payment_method: paymentMethod,
              notes: isCredit ? 'Venta a crédito' : 'Venta de contado',
            })
            if (result.success) {
              setSuccessMessage(isCredit ? 'Venta a crédito registrada' : 'Venta registrada en caja')
              setShowSaleModal(false)
              setTimeout(() => setSuccessMessage(null), 3000)
            } else {
              setError(result.error || 'Error al registrar venta')
            }
          }}
          onClose={() => setShowSaleModal(false)}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          balance={account.balance}
          onRecord={async (amount, method, reference) => {
            const { recordPayment } = await import('@/actions/clientAccounts/recordTransaction')
            const result = await recordPayment(organizationId, {
              client_id: client.id,
              amount,
              payment_method: method,
              payment_reference: reference || undefined,
            })
            if (result.success) {
              setSuccessMessage('Pago registrado en caja')
              setShowPaymentModal(false)
              setTimeout(() => setSuccessMessage(null), 3000)
            } else {
              setError(result.error || 'Error al registrar pago')
            }
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {showAdjustmentModal && (
        <AdjustmentModal
          onRecord={async (amount, description, reference) => {
            const { recordAdjustment } = await import('@/actions/clientAccounts/recordAdjustment')
            const result = await recordAdjustment(organizationId, {
              client_id: client.id,
              amount,
              description,
              reference: reference || undefined,
            })
            if (result.success) {
              setSuccessMessage('Cargo registrado en caja')
              setShowAdjustmentModal(false)
              setTimeout(() => setSuccessMessage(null), 3000)
            } else {
              setError(result.error || 'Error al registrar cargo')
            }
          }}
          onClose={() => setShowAdjustmentModal(false)}
        />
      )}

      <ConfirmModal
        isOpen={!!voidTarget}
        onClose={() => {
          setVoidTarget(null)
          setVoidReason('')
        }}
        onConfirm={async () => {
          if (!voidTarget) return
          const { voidTransaction } = await import('@/actions/clientAccounts/voidTransaction')
          const result = await voidTransaction(organizationId, {
            transaction_id: voidTarget.id,
            reason: voidReason,
          })
          if (result.success) {
            setSuccessMessage('Transacción anulada')
            setVoidTarget(null)
            setVoidReason('')
            setTimeout(() => setSuccessMessage(null), 3000)
          } else {
            setError(result.error || 'Error al anular')
          }
        }}
        title="Anular transacción"
        description={
          voidTarget
            ? `¿Estás seguro de anular esta ${voidTarget.type === 'sale' ? 'venta' : voidTarget.type === 'payment' ? 'pago' : 'ajuste'} de ${formatCurrencyCOP(voidTarget.amount)}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Anular"
        variant="danger"
        extraContent={
          <div>
            <label className="block text-sm font-medium mb-1 text-left" style={{ color: COLORS.textSecondary }}>
              Motivo de anulación *
            </label>
            <input
              type="text"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
              placeholder="Ej: Error en el monto, venta duplicada, etc."
            />
          </div>
        }
        confirmDisabled={!voidReason.trim()}
      />

      {editTarget && (
        <EditAdjustmentModal
          currentDescription={editTarget.description}
          currentReference={editTarget.reference}
          onSave={async (description, reference) => {
            const { updateAdjustment } = await import('@/actions/clientAccounts/updateAdjustment')
            const result = await updateAdjustment(organizationId, {
              transaction_id: editTarget.id,
              description,
              reference: reference || undefined,
            })
            if (result.success) {
              setSuccessMessage('Ajuste actualizado')
              setEditTarget(null)
              setTimeout(() => setSuccessMessage(null), 3000)
            } else {
              setError(result.error || 'Error al actualizar')
            }
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  )
}