'use server'

import { createClient } from '@/lib/supabase/server'

export type ValidateCodeResult = {
  valid: boolean
  error?: string
  promoCode?: {
    id: string
    code: string
    name: string
    type: string
    value: number
    maxUses: number | null
    usedCount: number
  }
}

export async function validateCode(code: string): Promise<ValidateCodeResult> {
  const supabase = await createClient()

  const { data: promoCode } = await supabase
    .from('promo_codes')
    .select('id, code, name, type, value, max_uses, used_count')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single() as any

  if (!promoCode) {
    return { valid: false, error: 'Código no válido' }
  }

  if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
    return { valid: false, error: 'Este código ha expirado' }
  }

  if (promoCode.valid_until && new Date(promoCode.valid_until) < new Date()) {
    return { valid: false, error: 'Este código no está vigente' }
  }

  if (promoCode.max_uses && promoCode.used_count >= promoCode.max_uses) {
    return { valid: false, error: 'Este código ya fue usado' }
  }

  return {
    valid: true,
    promoCode: {
      id: promoCode.id,
      code: promoCode.code,
      name: promoCode.name,
      type: promoCode.type,
      value: promoCode.value,
      maxUses: promoCode.max_uses,
      usedCount: promoCode.used_count,
    },
  }
}