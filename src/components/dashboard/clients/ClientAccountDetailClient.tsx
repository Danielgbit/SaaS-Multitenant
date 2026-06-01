'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, DollarSign, CheckCircle2, AlertTriangle, Clock, ChevronUp, ChevronDown } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import type { ClientAccountTransactionWithDetails, InventoryItemWithStock } from '@/types/clientAccounts'
import { AccountSummaryCards } from './AccountSummaryCards'
import { SaleModal } from './SaleModal'
import { PaymentModal } from './PaymentModal'

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
  const [success, setSuccess] = useState(false)
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
      <div className="flex gap-4">
        <button
          onClick={() => setShowSaleModal(true)}
          className="flex-1 py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
          style={{ backgroundColor: COLORS.primary }}
        >
          <ShoppingCart className="w-5 h-5" />
          Registrar Venta
        </button>
        <button
          onClick={() => setShowPaymentModal(true)}
          disabled={account.balance <= 0}
          className="flex-1 py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: COLORS.success }}
        >
          <DollarSign className="w-5 h-5" />
          Registrar Pago
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div
          className="p-4 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: COLORS.successLight }}
        >
          <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.success }} />
          <span style={{ color: COLORS.success }}>Operación realizada correctamente</span>
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
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div className="text-left">
                      <p className="font-medium" style={{ color: COLORS.textPrimary }}>
                        {transaction.transaction_type === 'sale' ? 'Venta' : 'Pago'}
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
              setSuccess(true)
              setShowSaleModal(false)
              setTimeout(() => setSuccess(false), 3000)
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
              setSuccess(true)
              setShowPaymentModal(false)
              setTimeout(() => setSuccess(false), 3000)
            } else {
              setError(result.error || 'Error al registrar pago')
            }
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  )
}