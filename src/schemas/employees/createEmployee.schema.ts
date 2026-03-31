import { z } from 'zod'

export const createEmployeeSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || /^[\d\s\+\-\(\)]{10,}$/.test(val.trim()),
      'El teléfono no tiene un formato válido'
    ),
})

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
