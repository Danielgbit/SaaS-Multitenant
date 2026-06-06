'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import type { InventoryItemWithStock, SalePaymentMethod } from '@/types/clientAccounts'
import { formatCurrencyCOP } from '@/lib/billing/utils'

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

  const addProduct = (product: InventoryItemWithStock) => {
    const existing = selectedProducts.find(p => p.productId === product.id)
    if (existing) {
      setSelectedProducts(selectedProducts.map(p => p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p))
    } else {
      setSelectedProducts([...selectedProducts, { productId: product.id, quantity: 1, price: product.price || 0 }])
    }
  }

  const removeProduct = (productId: string) => setSelectedProducts(selectedProducts.filter(p => p.productId !== productId))

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeProduct(productId); return }
    setSelectedProducts(selectedProducts.map(p => p.productId === productId ? { ...p, quantity } : p))
  }

  const totalSale = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0)

  const handleSubmit = async () => {
    setLoading(true)
    await onRecord(selectedProducts, paymentMethod)
    setLoading(false)
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Registrar Venta"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading || selectedProducts.length === 0} loading={loading}>
            Registrar Venta
          </Button>
        </>
      }>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-2">Productos</label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {products.map(product => (
              <button key={product.id} type="button" onClick={() => addProduct(product)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] transition-colors">
                <div className="text-left">
                  <p className="font-medium text-sm text-[#0F172A] dark:text-[#F1F5F9]">{product.name}</p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Stock: {product.quantity} • {formatCurrencyCOP(product.price || 0)}</p>
                </div>
                <Plus className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
              </button>
            ))}
          </div>
        </div>

        {selectedProducts.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-2">Productos seleccionados</label>
            <div className="space-y-2">
              {selectedProducts.map(sp => {
                const product = products.find(p => p.id === sp.productId)
                return (
                  <div key={sp.productId} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]">
                    <div>
                      <p className="font-medium text-sm text-[#0F172A] dark:text-[#F1F5F9]">{product?.name}</p>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{formatCurrencyCOP(sp.price)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQuantity(sp.productId, sp.quantity - 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#E2E8F0] dark:bg-[#334155] text-sm">-</button>
                      <span className="text-sm text-[#0F172A] dark:text-[#F1F5F9]">{sp.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(sp.productId, sp.quantity + 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#E2E8F0] dark:bg-[#334155] text-sm">+</button>
                      <button type="button" onClick={() => removeProduct(sp.productId)} className="p-2 text-[#DC2626] dark:text-[#EF4444]">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#334155]">
              <div className="flex justify-between mb-3">
                <span className="font-bold text-sm text-[#0F172A] dark:text-[#F1F5F9]">Total</span>
                <span className="font-bold text-sm text-[#DC2626] dark:text-[#EF4444]">{formatCurrencyCOP(totalSale)}</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1.5">Método de pago</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as SalePaymentMethod)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#111827]">
                  {PAYMENT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
