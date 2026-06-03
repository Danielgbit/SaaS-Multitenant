import { colombianNameSchema } from '@/schemas/common'
import { isValidPhone, getPhoneErrorMessage, normalizePhone } from '@/lib/validators/phone'

export function validateEmployeeFields(
  name: string,
  phone: string
): Record<string, string> {
  const errors: Record<string, string> = {}

  const nameResult = colombianNameSchema.safeParse(name)
  if (!nameResult.success) {
    errors.name = nameResult.error.issues[0]?.message || 'Nombre inválido'
  }

  const rawPhone = phone.trim()
  if (rawPhone) {
    const normalizedPhone = normalizePhone(rawPhone)
    if (!isValidPhone(normalizedPhone)) {
      errors.phone = getPhoneErrorMessage(normalizedPhone) || 'Teléfono inválido'
    }
  }

  return errors
}
