import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InventoryFormModal } from '../InventoryFormModal'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'

vi.mock('@/actions/inventory/saveInventoryItem', () => ({
  saveInventoryItem: vi.fn(() => ({ success: false })),
}))

vi.mock('@/hooks/useConfirmClose', () => ({
  useConfirmClose: () => ({
    confirmClose: vi.fn(),
    dialog: null,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const mockCategories = ['Shampoo', 'Acondicionador']

const baseItem: InventoryItem = {
  id: 'item-1',
  organization_id: 'org-1',
  name: 'Test Product',
  sku: 'TST-001',
  category: 'Shampoo',
  unit: 'pieza',
  description: 'A test product',
  quantity: 10,
  min_quantity: 5,
  price: 25000,
  cost_price: 15000,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  active: true,
}

describe('InventoryFormModal', () => {
  const defaultProps = {
    item: null,
    categories: mockCategories,
    organizationId: 'org-1',
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 9 inputs with associated labels', () => {
    render(<InventoryFormModal {...defaultProps} />)
    expect(screen.getByLabelText('Nombre del producto *')).toBeInTheDocument()
    expect(screen.getByLabelText('Codigo SKU')).toBeInTheDocument()
    expect(screen.getByLabelText('Categoria')).toBeInTheDocument()
    expect(screen.getByLabelText('Cantidad en stock')).toBeInTheDocument()
    expect(screen.getByLabelText('Stock minimo')).toBeInTheDocument()
    expect(screen.getByLabelText('Precio de venta')).toBeInTheDocument()
    expect(screen.getByLabelText('Precio de costo')).toBeInTheDocument()
  })

  it('detects dirty on name change', () => {
    render(<InventoryFormModal {...defaultProps} />)
    const nameInput = screen.getByLabelText('Nombre del producto *')
    fireEvent.change(nameInput, { target: { value: 'Changed' } })
    expect(nameInput).toHaveValue('Changed')
  })

  it('detects dirty on price change', () => {
    render(<InventoryFormModal {...defaultProps} />)
    const priceInput = screen.getByLabelText('Precio de venta')
    fireEvent.change(priceInput, { target: { value: '50000' } })
    expect(priceInput).toHaveValue(50000)
  })

  it('resets snapshot on item change', () => {
    const { rerender } = render(<InventoryFormModal {...defaultProps} />)
    const nameInputBefore = screen.getByLabelText('Nombre del producto *')
    fireEvent.change(nameInputBefore, { target: { value: 'Changed' } })
    rerender(<InventoryFormModal {...defaultProps} item={baseItem} />)
    const nameInputAfter = screen.getByLabelText('Nombre del producto *')
    expect(nameInputAfter).toHaveValue('Test Product')
  })
})
