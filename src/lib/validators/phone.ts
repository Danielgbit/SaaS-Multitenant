const COLOMBIAN_PHONE_REGEX = /^(?:\+57)?3[0-9]{9}$/
const US_PHONE_REGEX = /^(?:\+1)?[2-9][0-9]{9}$/

export function isValidColombianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '').replace(/^\+57/, '')
  return COLOMBIAN_PHONE_REGEX.test(cleaned)
}

export function isValidUSPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '').replace(/^\+1/, '')
  return US_PHONE_REGEX.test(cleaned)
}

export function isValidPhone(phone: string): boolean {
  return isValidColombianPhone(phone) || isValidUSPhone(phone)
}

export function getPhoneCountry(phone: string): 'CO' | 'US' | null {
  const cleaned = phone.replace(/\s/g, '')
  if (cleaned.startsWith('+57') || /^[3][0-9]{9}$/.test(cleaned)) {
    return 'CO'
  }
  if (cleaned.startsWith('+1') || /^[2-9][0-9]{9}$/.test(cleaned)) {
    return 'US'
  }
  return null
}

export function formatColombianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  return phone
}

export function formatUSPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

export function formatPhone(phone: string): string {
  const country = getPhoneCountry(phone)
  if (country === 'CO') {
    return formatColombianPhone(phone)
  }
  if (country === 'US') {
    return formatUSPhone(phone)
  }
  return phone
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\s/g, '').replace(/^0+/, '')
}

export function getPhoneErrorMessage(phone: string): string | null {
  if (!phone || phone.trim() === '') {
    return null
  }
  
  const cleaned = phone.replace(/\s/g, '')
  
  if (cleaned.length < 10) {
    return 'El número debe tener al menos 10 dígitos'
  }
  
  if (cleaned.length > 20) {
    return 'El número es muy largo'
  }
  
  const country = getPhoneCountry(phone)
  if (!country) {
    return 'Formato no reconocido. Usa: 300 123 4567 o +1 234 567 8900'
  }
  
  return null
}
