'use client'

import { useState } from 'react'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import type { InventoryItemWithStock, SalePaymentMethod } from '@/types/clientAccounts'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useConfirmClose } from '@/hooks/useConfirmClose'

interface SaleModalProps {
  products: InventoryItemWithStock[]
  onRecord: (products: { productId: string; quantity: number; price: number }[], paymentMethod: SalePaymentMethod) => Promise<void>
  onClose: () => void
}

const PAYMENT_OPTIONS: { value: SalePaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'qr', label: 'QR' },
  { value: 'credit', label: 'Crédito (Fiado)' },
]

export function SaleModal({ products, onRecord, onClose }: SaleModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<{ productId: string; quantity: number; price: number }[]>([])
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>('credit')
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const COLORS = useThemeColors()
  const isDirty = selectedProducts.length > 0
  const { confirmClose, dialog: closeDialog } = useConfirmClose(isDirty, onClose)

  const addProduct = (product: InventoryItemWithStock) => {
    if (product.quantity <= 0) return
    const existing = selectedProducts.find(p => p.productId === product.id)
    if (existing) {
      const maxAdd = product.quantity - existing.quantity
      if (maxAdd <= 0) return
      setSelectedProducts(selectedProducts.map(p => p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p))
    } else {
      setSelectedProducts([...selectedProducts, { productId: product.id, quantity: 1, price: product.price || 0 }])
    }
  }

  const removeProduct = (productId: string) => setSelectedProducts(selectedProducts.filter(p => p.productId !== productId))

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeProduct(productId); return }
    const product = products.find(p => p.id === productId)
    if (product && quantity > product.quantity) return
    setSelectedProducts(selectedProducts.map(p => p.productId === productId ? { ...p, quantity } : p))
  }

  const totalSale = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0)

  const handleSubmit = async () => {
    setLoading(true)
    setServerError('')
    try {
      await onRecord(selectedProducts, paymentMethod)
    } catch {
      setServerError('No fue posible registrar la venta. El inventario pudo haber cambiado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={confirmClose} title="Registrar Venta"
      footer={
        <>
          <Button variant="secondary" onClick={confirmClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading || selectedProducts.length === 0} loading={loading}>
            Registrar Venta
          </Button>
        </>
      }>
      <div className="space-y-4">
        {serverError && (
          <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: COLORS.errorLight, color: COLORS.error }}>
            <p className="font-medium">No fue posible registrar la venta</p>
            <p className="text-sm opacity-90">{serverError}</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: COLORS.textSecondary }}>Productos</label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {products.map(product => {
              const hasStock = product.quantity > 0
              return (
                <button key={product.id} type="button"
                  onClick={() => hasStock && addProduct(product)}
                  disabled={!hasStock}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${!hasStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}>
                  <div className="text-left">
                    <p className="font-medium text-sm" style={{ color: COLORS.textPrimary }}>{product.name}</p>
                    <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                      {!hasStock ? 'Sin stock' : `Stock: ${product.quantity} • ${formatCurrencyCOP(product.price || 0)}`}
                    </p>
                  </div>
                  {!hasStock ? (
                    <AlertTriangle className="w-5 h-5" style={{ color: COLORS.error }} />
                  ) : (
                    <Plus className="w-5 h-5" style={{ color: COLORS.primary }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {selectedProducts.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: COLORS.textSecondary }}>Productos seleccionados</label>
            <div className="space-y-2">
              {selectedProducts.map(sp => {
                const product = products.find(p => p.id === sp.productId)
                const atMax = product ? sp.quantity >= product.quantity : false
                return (
                  <div key={sp.productId} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: COLORS.textPrimary }}>{product?.name}</p>
                      <p className="text-xs" style={{ color: COLORS.textSecondary }}>{formatCurrencyCOP(sp.price)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQuantity(sp.productId, sp.quantity - 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: COLORS.border }}>-</button>
                      <span className="text-sm" style={{ color: COLORS.textPrimary }}>{sp.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(sp.productId, sp.quantity + 1)}
                        disabled={atMax}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm disabled:opacity-40" style={{ backgroundColor: COLORS.border }}>+</button>
                      <button type="button" onClick={() => removeProduct(sp.productId)} className="p-2" style={{ color: COLORS.error }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.border }}>
              <div className="flex justify-between mb-3">
                <span className="font-bold text-sm" style={{ color: COLORS.textPrimary }}>Total</span>
                <span className="font-bold text-sm" style={{ color: COLORS.error }}>{formatCurrencyCOP(totalSale)}</span>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>Método de pago</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as SalePaymentMethod)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
                  {PAYMENT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      {closeDialog}
    </Modal>
  )
}
