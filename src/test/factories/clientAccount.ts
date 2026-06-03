import type { ClientAccount, ClientAccountTransaction, ClientProductSale } from '@/types/clientAccounts'

export function createClientAccount(overrides: Partial<ClientAccount> = {}): ClientAccount {
  return {
    id: 'account-1',
    client_id: 'client-1',
    organization_id: 'org-1',
    balance: 0,
    total_purchased: 0,
    total_paid: 0,
    credit_limit: 1000000,
    is_over_limit: false,
    is_at_warning_threshold: false,
    last_transaction_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createTransaction(overrides: Partial<ClientAccountTransaction> = {}): ClientAccountTransaction {
  return {
    id: 'txn-1',
    account_id: 'account-1',
    organization_id: 'org-1',
    transaction_type: 'sale',
    amount: 50000,
    balance_after: 50000,
    payment_method: 'cash',
    payment_reference: null,
    notes: null,
    related_transaction_id: null,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
    is_voided: false,
    voided_by: null,
    voided_at: null,
    edited_by: null,
    edited_at: null,
    ...overrides,
  }
}

export function createOperationEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'entry-1',
    cash_session_id: 'session-1',
    entry_type: 'income',
    entry_group: 'operational',
    entry_status: 'active',
    created_via: 'manual',
    direction: 'in',
    title: 'Test entry',
    description: null,
    amount: 50000,
    payment_method: 'cash',
    source_type: 'client_account_payment',
    source_id: null,
    metadata: {},
    created_by: 'user-1',
    voided_by: null,
    voided_at: null,
    void_reason: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createProductSale(overrides: Partial<ClientProductSale> = {}): ClientProductSale {
  return {
    id: 'ps-1',
    transaction_id: 'txn-1',
    inventory_item_id: 'item-1',
    product_name: 'Test Product',
    quantity: 2,
    unit_price: 25000,
    discount_percent: 0,
    total_price: 50000,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}
