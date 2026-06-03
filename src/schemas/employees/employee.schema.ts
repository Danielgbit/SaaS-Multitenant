import { z } from 'zod'
import { colombianNameSchema, emailSchema } from '@/schemas/common'

export const CreateEmployeeSchema = z.object({
  name: colombianNameSchema,
  phone: z.string().optional().refine(
    (val) => !val || val.trim() === '' || /^[\d\s\+\-\(\)]{7,20}$/.test(val.trim()),
    'Teléfono inválido'
  ),
  email: emailSchema.optional().or(z.literal('')),
})

export const UpdateEmployeeSchema = CreateEmployeeSchema.extend({
  id: z.string().uuid('ID inválido'),
})
