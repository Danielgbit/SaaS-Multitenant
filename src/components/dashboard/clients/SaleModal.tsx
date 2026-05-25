'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { InventoryItemWithStock } from '@/types/clientAccounts'
import { formatCurrencyCOP } from '@/lib/billing/utils'

interface SaleModalProps {
  products: InventoryItemWithStock[]
  onRecord: (products: { productId: string; quantity: number; price: number }[]) => Promise<void>
  onClose: () => void
}

export function SaleModal({ products, onRecord, onClose }: SaleModalProps) {
  const COLORS = useThemeColors()
  const [selectedProducts, setSelectedProducts] = useState<{
    productId: string; quantity: number; price: number
  }[]>([])
  const [loading, setLoading] = useState(false)

  const addProduct = (product: InventoryItemWithStock) => {
    const existing = selectedProducts.find(p => p.productId === product.id)
    if (existing) {
      setSelectedProducts(selectedProducts.map(p =>
        p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
      ))
    } else {
      setSelectedProducts([...selectedProducts, { productId: product.id, quantity: 1, price: product.price || 0 }])
    }
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeProduct(productId); return }
    setSelectedProducts(selectedProducts.map(p =>
      p.productId === productId ? { ...p, quantity } : p
    ))
  }

  const totalSale = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0)

  const handleSubmit = async () => {
    setLoading(true)
    await onRecord(selectedProducts)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[80dvh] rounded-2xl p-6 overflow-y-auto" style={{ backgroundColor: COLORS.surface }}>
        <h2 className="text-xl font-bold mb-4 font-heading" style={{ color: COLORS.textPrimary }}>
          Registrar Venta
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>Productos</label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {products.map(product => (
                <button key={product.id} onClick={() => addProduct(product)} className="w-full flex items-center justify-between p-3 rounded-xl border transition-colors" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}>
                  <div className="text-left">
                    <p className="font-medium" style={{ color: COLORS.textPrimary }}>{product.name}</p>
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>Stock: {product.quantity} • {formatCurrencyCOP(product.price || 0)}</p>
                  </div>
                  <Plus className="w-5 h-5" style={{ color: COLORS.primary }} />
                </button>
              ))}
            </div>
          </div>
          {selectedProducts.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>Productos seleccionados</label>
              <div className="space-y-2">
                {selectedProducts.map(sp => {
                  const product = products.find(p => p.id === sp.productId)
                  return (
                    <div key={sp.productId} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
                      <div>
                        <p className="font-medium" style={{ color: COLORS.textPrimary }}>{product?.name}</p>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>{formatCurrencyCOP(sp.price)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(sp.productId, sp.quantity - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.border }}>-</button>
                        <span style={{ color: COLORS.textPrimary }}>{sp.quantity}</span>
                        <button onClick={() => updateQuantity(sp.productId, sp.quantity + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.border }}>+</button>
                        <button onClick={() => removeProduct(sp.productId)} className="p-2" style={{ color: COLORS.error }}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.border }}>
                <div className="flex justify-between">
                  <span className="font-bold" style={{ color: COLORS.textPrimary }}>Total</span>
                  <span className="font-bold" style={{ color: COLORS.error }}>{formatCurrencyCOP(totalSale)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium transition-colors" style={{ backgroundColor: COLORS.surfaceSubtle, color: COLORS.textSecondary }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || selectedProducts.length === 0} className="flex-1 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: COLORS.primary }}>
            {loading ? <Spinner size="sm" /> : null}
            {loading ? 'Registrando...' : 'Registrar Venta'}
          </button>
        </div>
      </div>
    </div>
  )
}
