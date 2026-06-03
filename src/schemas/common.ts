import { z } from 'zod'

export const colombianNameSchema = z.string()
  .min(2, 'Mínimo 2 caracteres')
  .max(100, 'Máximo 100 caracteres')
  .trim()
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']+$/, 'Solo letras y espacios')

export const emailSchema = z.string()
  .trim()
  .toLowerCase()
  .email('Email inválido')

export const passwordSchema = z.string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener una mayúscula')
  .regex(/[a-z]/, 'Debe contener una minúscula')
  .regex(/[0-9]/, 'Debe contener un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener un carácter especial')

export const colombianPhoneSchema = z.string()
  .refine((val) => !val || /^[\d\s\+\-\(\)]{7,20}$/.test(val.trim()), 'Teléfono inválido')

export function sanitizeText(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
