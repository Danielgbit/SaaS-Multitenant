export type CashSessionStatus = 'open' | 'closed'
export type EntryType = 'income' | 'product_sale' | 'expense' | 'inventory_purchase' | 'payroll_expense' | 'inventory_out' | 'adjustment' | 'note' | 'break'
export type EntryGroup = 'operational' | 'inventory' | 'payroll' | 'system'
export type EntryStatus = 'active' | 'voided'
export type CreatedVia = 'manual' | 'appointment_auto' | 'payroll_auto' | 'inventory_auto' | 'product_sale_hook' | 'migration'
export type EntryDirection = 'in' | 'out'
export type PaymentMethod = 'cash' | 'qr' | 'transfer' | 'card'
export type SourceType = 'appointment' | 'payroll' | 'inventory' | 'inventory_sale' | 'manual'

export interface CashSession { id: string; organization_id: string; session_date: string; opened_by: string | null; closed_by: string | null; opening_cash: number; status: CashSessionStatus; notes: string | null; opened_at: string | null; closed_at: string | null; created_at: string }
export interface CashSessionSummary extends CashSession { expected_cash: number; expected_cash_detail: Record<PaymentMethod, number> | null; real_cash_detail: Record<PaymentMethod, number> | null; active_entries_count: number; income_count: number; expense_count: number }
export interface OperationEntry { id: string; cash_session_id: string; entry_type: EntryType; entry_group: EntryGroup | null; entry_status: EntryStatus; created_via: CreatedVia; direction: EntryDirection | null; title: string; description: string | null; amount: number; payment_method: PaymentMethod | null; source_type: SourceType | null; source_id: string | null; metadata: Record<string, unknown>; created_by: string | null; voided_by: string | null; voided_at: string | null; void_reason: string | null; created_at: string }
export interface OpenSessionInput { organization_id: string; opening_cash: number; notes?: string }
export interface CloseSessionInput { session_id: string; real_cash_detail: Record<PaymentMethod, number>; notes?: string }
export interface CreateManualEntryInput { cash_session_id: string; entry_type: EntryType; direction: EntryDirection | null; title: string; description?: string; amount: number; payment_method?: PaymentMethod; created_via?: CreatedVia }
export interface VoidEntryInput { entry_id: string; reason: string }
export interface CreateEntryFromSourceInput { organization_id: string; source_type: SourceType; source_id: string; entry_type: EntryType; direction: EntryDirection; amount: number; payment_method: PaymentMethod; title: string; created_by: string; created_via: CreatedVia }

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = { cash: 'Efectivo', qr: 'QR', transfer: 'Transferencia', card: 'Tarjeta' }
export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = { cash: '💵', qr: '📱', transfer: '🏦', card: '💳' }
export const ENTRY_TYPE_LABELS: Record<EntryType, string> = { income: 'Ingreso', product_sale: 'Venta Producto', expense: 'Gasto', inventory_purchase: 'Compra Inventario', payroll_expense: 'Pago Nómina', inventory_out: 'Consumo Interno', adjustment: 'Ajuste', note: 'Nota', break: 'Descanso' }

export const ENTRY_GROUP_MAP: Record<EntryType, EntryGroup> = {
  income: 'operational', product_sale: 'inventory', expense: 'operational',
  inventory_purchase: 'inventory', payroll_expense: 'payroll', inventory_out: 'inventory',
  adjustment: 'system', note: 'system', break: 'system',
}
