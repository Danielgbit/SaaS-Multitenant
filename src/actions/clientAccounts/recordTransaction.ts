'use server'

import { createClient } from '@/lib/supabase/server'
import type { CreateSaleInput, SalePaymentMethod, RecordPaymentInput } from '@/types/clientAccounts'
import { revalidatePath } from 'next/cache'
import type { PaymentMethod } from '@/types/cash-sessions'
import { createEntryFromSource } from '@/actions/cash-sessions/createEntryFromSource'
import * as inventoryService from '@/lib/inventory/inventory-service'
import { recordInventoryMovementsBatch } from '@/lib/inventory/inventory-movement'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

const CREDIT_METHODS: SalePaymentMethod[] = ['credit']

function toPaymentMethod(method: SalePaymentMethod | undefined): PaymentMethod {
  if (!method || method === 'credit') return 'cash'
  return method as PaymentMethod
}

export async function recordSale(
  organizationId: string,
  input: CreateSaleInput
): Promise<{
  success: boolean
  data?: {
    transaction_id: string
    total_amount: number
    new_balance: number
  }
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', input.client_id)
    .eq('organization_id', organizationId)
    .single()

  if (!client) {
    return { success: false, error: 'Cliente no encontrado' }
  }

  const totalAmount = input.products.reduce((sum, p) => {
    const discount = (p.unit_price * (p.discount_percent || 0)) / 100
    return sum + (p.unit_price - discount) * p.quantity
  }, 0)

  const isCredit = input.payment_method === 'credit'

  // --- Stock decrement (atomic via RPC) ---
  const activeProducts = input.products.filter(p => p.inventory_item_id)

  // TEMPORAL: staff bloqueado para ventas con inventario.
  // El inventario operativo sigue en Excel. Cuando migre al SaaS,
  // se habilitara staff via RPCs SECURITY DEFINER.
  if (activeProducts.length > 0) {
    const access = await requireOrgAccess(organizationId, ['owner', 'admin'])
    if (!access.success) {
      return { success: false, error: 'Sin permiso para vender productos con inventario.' }
    }
  }

  const stockResult = activeProducts.length > 0
    ? await inventoryService.decrementBatch({
        items: activeProducts.map(p => ({ item_id: p.inventory_item_id!, quantity: p.quantity })),
        organization_id: organizationId,
        context: `sale:client=${input.client_id},method=${input.payment_method}`,
      })
    : null

  if (stockResult && !stockResult.success) {
    return { success: false, error: stockResult.error || 'Error al procesar stock.' }
  }

  if (isCredit) {
    // --- FLUJO CRÉDITO: cuenta + transacción + product_sales ---
    let accountId: string

    const { data: existingAccount } = await supabase
      .from('client_accounts')
      .select('id, balance')
      .eq('client_id', input.client_id)
      .eq('organization_id', organizationId)
      .single()

    if (existingAccount) {
      accountId = existingAccount.id

      const newBalance = existingAccount.balance + totalAmount

      if (newBalance > existingAccount.balance && existingAccount.balance > 0) {
        return { success: false, error: 'Cliente tiene cuenta bloqueada por deuda vencida' }
      }
    } else {
      const { data: newAccount, error: createError } = await supabase
        .from('client_accounts')
        .insert({
          client_id: input.client_id,
          organization_id: organizationId,
          balance: 0,
          total_purchased: 0,
          total_paid: 0,
          credit_limit: 0,
        })
        .select('id')
        .single()

      if (createError) {
        return { success: false, error: createError.message }
      }
      accountId = newAccount.id
    }

    const { data: transaction, error: transactionError } = await supabase
      .from('client_account_transactions')
      .insert({
        account_id: accountId,
        organization_id: organizationId,
        transaction_type: 'sale',
        amount: totalAmount,
        balance_after: 0,
        payment_method: input.payment_method || null,
        notes: input.notes || `Venta a crédito - ${client.name}`,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (transactionError) {
      return { success: false, error: transactionError.message }
    }

    // Registrar movimientos de auditoría con source_operation_id = transaction.id
    if (stockResult) {
      const movements = stockResult.results
        .filter(r => r.success)
        .map(r => ({
          inventoryItemId: r.item_id,
          organizationId,
          movementType: 'sale' as const,
          quantityChange: -(r.quantity_before! - r.quantity_after!),
          quantityBefore: r.quantity_before!,
          quantityAfter: r.quantity_after!,
          sourceOperationId: transaction.id,
          referenceType: 'transaction' as const,
          referenceId: transaction.id,
          createdBy: user.id,
        }))
      await recordInventoryMovementsBatch(movements)
    }

    // Resolver nombres de productos en 1 query (evitar N+1)
    const ids = input.products.map(p => p.inventory_item_id).filter(Boolean) as string[]
    const nameById = new Map<string, string>()
    if (ids.length > 0) {
      const { data: inventoryItems } = await supabase
        .from('inventory_items')
        .select('id, name')
        .in('id', ids)
      if (inventoryItems) {
        for (const inv of inventoryItems) {
          nameById.set(inv.id, inv.name)
        }
      }
    }

    for (const product of input.products) {
      const discount = (product.unit_price * (product.discount_percent || 0)) / 100
      const totalPrice = (product.unit_price - discount) * product.quantity

      const { error: saleError } = await supabase
        .from('client_product_sales')
        .insert({
          transaction_id: transaction.id,
          inventory_item_id: product.inventory_item_id,
          product_name: product.inventory_item_id
            ? (nameById.get(product.inventory_item_id) || 'Producto')
            : 'Producto',
          quantity: product.quantity,
          unit_price: product.unit_price,
          discount_percent: product.discount_percent || 0,
          total_price: totalPrice,
        } as any)

      if (saleError) {
        console.error('Error inserting product sale:', saleError)
      }
    }

    const { data: updatedAccount } = await supabase
      .from('client_accounts')
      .select('balance')
      .eq('id', accountId)
      .single()

    revalidatePath(`/clients/${input.client_id}/account`)
    revalidatePath('/clients')

    return {
      success: true,
      data: {
        transaction_id: transaction.id,
        total_amount: totalAmount,
        new_balance: updatedAccount?.balance || 0,
      },
    }
  }

  // --- FLUJO CONTADO: stock ya descontado + auditoría + entrada en caja ---

  // Registrar movimientos de auditoría (sin source_operation_id — no hay transaction)
  if (activeProducts.length > 0 && stockResult) {
    const movements = stockResult.results
      .filter(r => r.success)
      .map(r => ({
        inventoryItemId: r.item_id,
        organizationId,
        movementType: 'sale' as const,
        quantityChange: -(r.quantity_before! - r.quantity_after!),
        quantityBefore: r.quantity_before!,
        quantityAfter: r.quantity_after!,
        metadata: { payment_method: input.payment_method },
        createdBy: user.id,
      }))
    await recordInventoryMovementsBatch(movements)
  }

  const paymentMethod = toPaymentMethod(input.payment_method)

  const entryResult = await createEntryFromSource({
    organization_id: organizationId,
    source_type: 'inventory_sale',
    source_id: null,
    entry_type: 'product_sale',
    direction: 'in',
    amount: totalAmount,
    payment_method: paymentMethod,
    title: `Venta de productos${input.notes ? ' - ' + input.notes : ''}`,
    created_by: user.id,
    created_via: 'product_sale_hook',
  })

  if (!entryResult.success) {
    console.error('[recordSale] Error al crear entry en caja:', entryResult.error)
    return { success: false, error: 'Error al registrar en caja: ' + entryResult.error }
  }

  revalidatePath('/clients')
  revalidatePath('/caja')

  return {
    success: true,
    data: {
      transaction_id: '',
      total_amount: totalAmount,
      new_balance: 0,
    },
  }
}

export async function recordPayment(
  organizationId: string,
  input: RecordPaymentInput
): Promise<{
  success: boolean
  data?: {
    transaction_id: string
    new_balance: number
  }
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: account, error: accountError } = await supabase
    .from('client_accounts')
    .select('id, balance')
    .eq('client_id', input.client_id)
    .eq('organization_id', organizationId)
    .single()

  if (accountError || !account) {
    return { success: false, error: 'Cliente no tiene cuenta abierta' }
  }

  if (input.amount > account.balance) {
    return { success: false, error: 'El monto no puede exceder el saldo pendiente' }
  }

  const { data: client } = await supabase
    .from('clients')
    .select('name')
    .eq('id', input.client_id)
    .single()

  const { data: transaction, error: transactionError } = await supabase
    .from('client_account_transactions')
    .insert({
      account_id: account.id,
      organization_id: organizationId,
      transaction_type: 'payment',
      amount: input.amount,
      balance_after: account.balance - input.amount,
      payment_method: input.payment_method,
      payment_reference: input.payment_reference || null,
      notes: input.notes || `Pago de ${client?.name || 'Cliente'}`,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (transactionError) {
    return { success: false, error: transactionError.message }
  }

  // Registrar ingreso en caja por pago de cuenta
  const entryResult = await createEntryFromSource({
    organization_id: organizationId,
    source_type: 'client_account_payment',
    source_id: transaction.id,
    entry_type: 'account_payment',
    direction: 'in',
    amount: input.amount,
    payment_method: input.payment_method,
    title: `Pago de cuenta - ${client?.name || 'Cliente'}`,
    created_by: user.id,
    created_via: 'record_payment',
  })

  if (!entryResult.success) {
    console.error('[recordPayment] Error al crear entry en caja:', entryResult.error)
    return { success: false, error: 'Error al registrar en caja: ' + entryResult.error }
  }

  revalidatePath(`/clients/${input.client_id}/account`)
  revalidatePath('/clients')
  revalidatePath('/caja')

  return {
    success: true,
    data: {
      transaction_id: transaction.id,
      new_balance: account.balance - input.amount,
    },
  }
}
