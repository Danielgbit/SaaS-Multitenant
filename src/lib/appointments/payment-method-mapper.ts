import type { PaymentMethodCode } from '@/types/confirmations'
import type { PaymentMethod } from '@/types/cash-sessions'

const PAYMENT_METHOD_MAP: Record<PaymentMethodCode, PaymentMethod> = {
  efectivo: 'cash',
  nequi: 'qr',
  daviplata: 'qr',
  pse: 'transfer',
  qr_nequi: 'qr',
  qr_bancolombia: 'qr',
  tarjeta_debito: 'card',
  tarjeta_credito: 'card',
}

export function mapPaymentMethod(code: PaymentMethodCode | string | null | undefined): PaymentMethod {
  if (!code) return 'cash'
  return PAYMENT_METHOD_MAP[code as PaymentMethodCode] || 'cash'
}
