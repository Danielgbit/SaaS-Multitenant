'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import {
  ArrowLeft,
  DollarSign,
  ShoppingCart,
  CreditCard,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  TrendingUp
} from 'lucide-react'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import type { ClientAccountTransactionWithDetails, InventoryItemWithStock } from '@/types/clientAccounts'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryGradient: isDark
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#DCFCE7',
    warning: '#F59E0B',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    isDark,
  }
}

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
  const COLORS = useColors()
  const [mounted, setMounted] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<{
    productId: string
    quantity: number
    price: number
  }[]>([])
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentReference, setPaymentReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  const handleRecordSale = async () => {
    setLoading(true)
    setError(null)

    try {
      const { recordSale } = await import('@/actions/clientAccounts/recordTransaction')
      
      const result = await recordSale(organizationId, {
        client_id: client.id,
        products: selectedProducts.map(p => ({
          inventory_item_id: p.productId,
          quantity: p.quantity,
          unit_price: p.price,
        })),
        payment_method: 'credit',
        notes: 'Venta a crédito',
      })

      if (result.success) {
        setSuccess(true)
        setShowSaleModal(false)
        setSelectedProducts([])
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Error al registrar venta')
      }
    } catch (err) {
      setError('Error al registrar venta')
    }

    setLoading(false)
  }

  const handleRecordPayment = async () => {
    setLoading(true)
    setError(null)

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Monto inválido')
      setLoading(false)
      return
    }

    try {
      const { recordPayment } = await import('@/actions/clientAccounts/recordTransaction')
      
      const result = await recordPayment(organizationId, {
        client_id: client.id,
        amount,
        payment_method: paymentMethod,
        payment_reference: paymentReference || undefined,
      })

      if (result.success) {
        setSuccess(true)
        setShowPaymentModal(false)
        setPaymentAmount('')
        setPaymentReference('')
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Error al registrar pago')
      }
    } catch (err) {
      setError('Error al registrar pago')
    }

    setLoading(false)
  }

  const addProductToSale = (product: InventoryItemWithStock) => {
    const existing = selectedProducts.find(p => p.productId === product.id)
    if (existing) {
      setSelectedProducts(
        selectedProducts.map(p =>
          p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      )
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          productId: product.id,
          quantity: 1,
          price: product.price || 0,
        },
      ])
    }
  }

  const removeProductFromSale = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId))
  }

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromSale(productId)
    } else {
      setSelectedProducts(
        selectedProducts.map(p =>
          p.productId === productId ? { ...p, quantity } : p
        )
      )
    }
  }

  const totalSale = selectedProducts.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  )

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
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
      `}</style>

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
              className="text-3xl font-bold text-white"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {client.name}
            </h1>
            <p className="text-white/80">
              {client.phone || 'Sin teléfono'} • {client.email || 'Sin email'}
            </p>
          </div>
        </div>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: account.is_over_limit ? COLORS.error : COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: COLORS.error + '15' }}
            >
              <DollarSign className="w-4 h-4" style={{ color: COLORS.error }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Saldo Pendiente
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.error }}>
            {formatCurrencyCOP(account.balance)}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: COLORS.success + '15' }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.success }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Total Comprado
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.success }}>
            {formatCurrencyCOP(account.total_purchased)}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: COLORS.primary + '15' }}
            >
              <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.primary }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Total Pagado
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>
            {formatCurrencyCOP(account.total_paid)}
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: COLORS.warning + '15' }}
            >
              <CreditCard className="w-4 h-4" style={{ color: COLORS.warning }} />
            </div>
            <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
              Límite Crédito
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: COLORS.warning }}>
            {account.credit_limit > 0 ? formatCurrencyCOP(account.credit_limit) : 'Sin límite'}
          </p>
        </div>
      </div>

      {/* Credit Progress */}
      {account.credit_limit > 0 && (
        <div
          className="p-6 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: COLORS.textSecondary }}>Crédito usado</span>
            <span style={{ color: COLORS.textPrimary }}>
              {formatCurrencyCOP(account.balance)} / {formatCurrencyCOP(account.credit_limit)}
            </span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: COLORS.surfaceSubtle }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((account.balance / account.credit_limit) * 100, 100)}%`,
                backgroundColor: account.is_over_limit
                  ? COLORS.error
                  : account.is_at_warning_threshold
                  ? COLORS.warning
                  : COLORS.success,
              }}
            />
          </div>
          {account.is_over_limit && (
            <p className="text-sm mt-2" style={{ color: COLORS.error }}>
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Cliente ha excedido el límite de crédito
            </p>
          )}
        </div>
      )}

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
          className="text-lg font-semibold mb-4"
          style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
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

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSaleModal(false)}
          />
          <div
            className="relative w-full max-w-lg max-h-[80vh] rounded-2xl p-6 overflow-y-auto"
            style={{ backgroundColor: COLORS.surface }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
            >
              Registrar Venta
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                  Productos
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addProductToSale(product)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border transition-colors"
                      style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}
                    >
                      <div className="text-left">
                        <p className="font-medium" style={{ color: COLORS.textPrimary }}>
                          {product.name}
                        </p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>
                          Stock: {product.quantity} • {formatCurrencyCOP(product.price || 0)}
                        </p>
                      </div>
                      <Plus className="w-5 h-5" style={{ color: COLORS.primary }} />
                    </button>
                  ))}
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>
                    Productos seleccionados
                  </label>
                  <div className="space-y-2">
                    {selectedProducts.map((sp) => {
                      const product = products.find(p => p.id === sp.productId)
                      return (
                        <div
                          key={sp.productId}
                          className="flex items-center justify-between p-3 rounded-xl"
                          style={{ backgroundColor: COLORS.surfaceSubtle }}
                        >
                          <div>
                            <p className="font-medium" style={{ color: COLORS.textPrimary }}>
                              {product?.name}
                            </p>
                            <p className="text-xs" style={{ color: COLORS.textMuted }}>
                              {formatCurrencyCOP(sp.price)} c/u
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateProductQuantity(sp.productId, sp.quantity - 1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: COLORS.border }}
                            >
                              -
                            </button>
                            <span style={{ color: COLORS.textPrimary }}>{sp.quantity}</span>
                            <button
                              onClick={() => updateProductQuantity(sp.productId, sp.quantity + 1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: COLORS.border }}
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeProductFromSale(sp.productId)}
                              className="p-2"
                              style={{ color: COLORS.error }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.border }}>
                    <div className="flex justify-between">
                      <span className="font-bold" style={{ color: COLORS.textPrimary }}>
                        Total
                      </span>
                      <span className="font-bold" style={{ color: COLORS.error }}>
                        {formatCurrencyCOP(totalSale)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaleModal(false)}
                className="flex-1 py-3 rounded-xl font-medium transition-colors"
                style={{ backgroundColor: COLORS.surfaceSubtle, color: COLORS.textSecondary }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRecordSale}
                disabled={loading || selectedProducts.length === 0}
                className="flex-1 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: COLORS.primary }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? 'Registrando...' : 'Registrar Venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPaymentModal(false)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl p-6"
            style={{ backgroundColor: COLORS.surface }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
            >
              Registrar Pago
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textSecondary }}>
                  Monto (máximo: {formatCurrencyCOP(account.balance)})
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-lg font-bold"
                  style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textSecondary }}>
                  Método de pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border"
                  style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
                >
                  <option value="cash">Efectivo</option>
                  <option value="bancolombia">Transferencia Bancolombia</option>
                  <option value="nequi">Nequi</option>
                  <option value="daviplata">Daviplata</option>
                  <option value="debit_card">Tarjeta Débito</option>
                  <option value="credit_card">Tarjeta Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.textSecondary }}>
                  Referencia (opcional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border"
                  style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
                  placeholder="Últimos 4 dígitos, ID transacción, etc."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-3 rounded-xl font-medium transition-colors"
                style={{ backgroundColor: COLORS.surfaceSubtle, color: COLORS.textSecondary }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={loading || !paymentAmount}
                className="flex-1 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: COLORS.success }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? 'Registrando...' : 'Registrar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}