// =====================================================
// CLIENT ACCOUNTS RECEIVABLE - Cuentas por Cobrar a Clientes
// =====================================================

export type TransactionType = 'sale' | 'payment' | 'credit' | 'refund' | 'adjustment'
export type PaymentMethodType = 'cash' | 'transfer' | 'card' | 'other'

export type ClientAccount = {
  id: string
  client_id: string
  organization_id: string
  balance: number
  total_purchased: number
  total_paid: number
  credit_limit: number
  is_over_limit: boolean
  is_at_warning_threshold: boolean
  last_transaction_at: string | null
  created_at: string
  updated_at: string
}

export type ClientAccountWithClient = ClientAccount & {
  client: {
    id: string
    name: string
    phone: string | null
    email: string | null
  }
}

export type ClientAccountTransaction = {
  id: string
  account_id: string
  organization_id: string
  transaction_type: TransactionType
  amount: number
  balance_after: number
  payment_method: string | null
  payment_reference: string | null
  notes: string | null
  related_transaction_id: string | null
  created_by: string | null
  created_at: string
}

export type ClientAccountTransactionWithDetails = ClientAccountTransaction & {
  product_sales?: ClientProductSale[]
  created_by_user?: {
    name: string
  }
}

export type ClientProductSale = {
  id: string
  transaction_id: string
  inventory_item_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  discount_percent: number
  total_price: number
  created_at: string
}

export type ClientProductDiscount = {
  id: string
  client_id: string
  inventory_item_id: string
  discount_percent: number
  valid_from: string | null
  valid_until: string | null
  created_at: string
}

export type ClientPaymentMethod = {
  id: string
  organization_id: string
  name: string
  code: string
  type: PaymentMethodType
  is_active: boolean
  sort_order: number
  created_at: string
}

export type InventoryItemWithStock = {
  id: string
  organization_id: string
  name: string
  sku: string | null
  description: string | null
  category: string | null
  quantity: number
  min_quantity: number
  price: number | null
  cost_price: number | null
  unit: string
  active: boolean
  created_at: string
  updated_at: string
}

export type ClientWithCreditInfo = {
  id: string
  organization_id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
  credit_limit: number
  credit_warning_threshold: number
  has_credit_account: boolean
  default_payment_method: string
  account?: ClientAccount
}

export type CreateSaleInput = {
  client_id: string
  products: {
    inventory_item_id: string
    quantity: number
    unit_price: number
    discount_percent?: number
  }[]
  payment_method?: string
  notes?: string
}

export type RecordPaymentInput = {
  client_id: string
  amount: number
  payment_method: string
  payment_reference?: string
  notes?: string
}

export type AccountSummary = {
  total_balance: number
  total_credit_used: number
  total_credit_available: number
  clients_with_balance: number
  clients_at_warning: number
  clients_over_limit: number
}

export type ProductSalesSummary = {
  product_id: string
  product_name: string
  total_quantity_sold: number
  total_revenue: number
  transaction_count: number
}
