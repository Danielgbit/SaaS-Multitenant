import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SaleModal } from '../SaleModal'

const baseProducts = [
  { id: '1', name: 'Shampoo', quantity: 5, min_quantity: 2, unit: 'pieza', organization_id: 'org-1', active: true, price: 10000, cost_price: null, sku: null, description: null, category: null, created_at: '', updated_at: '' },
  { id: '2', name: 'Acondicionador', quantity: 0, min_quantity: 2, unit: 'pieza', organization_id: 'org-1', active: true, price: 8000, cost_price: null, sku: null, description: null, category: null, created_at: '', updated_at: '' },
]

function renderModal(products = baseProducts) {
  const onRecord = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  render(<SaleModal products={products} onRecord={onRecord} onClose={onClose} />)
  return { onRecord, onClose }
}

describe('SaleModal', () => {
  it('deshabilita productos con stock = 0', () => {
    renderModal()
    const btn = screen.getByText('Acondicionador').closest('button')
    expect(btn).toBeDisabled()
  })

  it('muestra "Sin stock" para productos agotados', () => {
    renderModal()
    expect(screen.getByText('Sin stock')).toBeTruthy()
  })

  it('no permite agregar más productos del stock disponible', () => {
    const { onRecord } = renderModal()
    const shampooBtn = screen.getByText('Shampoo').closest('button')!
    for (let i = 0; i < 10; i++) fireEvent.click(shampooBtn)
    const plusBtns = screen.getAllByText('+')
    const cartPlusBtn = plusBtns[plusBtns.length - 1]
    expect(cartPlusBtn).toBeDisabled()
  })

  it('muestra error del servidor si onRecord rechaza', async () => {
    const onRecord = vi.fn().mockRejectedValue(new Error('error server'))
    render(<SaleModal products={[baseProducts[0]]} onRecord={onRecord} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Shampoo').closest('button')!)
    const submitBtn = screen.getByRole('button', { name: /Registrar Venta/i })
    fireEvent.click(submitBtn)
    expect(
      await screen.findByText(
        /No fue posible registrar la venta\. El inventario pudo haber cambiado/
      )
    ).toBeTruthy()
  })

  it('elimina producto del carrito al hacer clic en - con cantidad 1', () => {
    renderModal()
    fireEvent.click(screen.getByText('Shampoo').closest('button')!)
    const minusBtn = screen.getAllByText('-')[0]
    fireEvent.click(minusBtn)
    expect(screen.queryByText('Total')).toBeNull()
  })
})
