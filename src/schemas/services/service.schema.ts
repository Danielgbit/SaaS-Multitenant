import { z } from 'zod'
import { colombianNameSchema } from '@/schemas/common'

export const CreateServiceSchema = z.object({
  name: colombianNameSchema,
  duration: z.number().finite().int().min(5, 'Mínimo 5 minutos').max(480, 'Máximo 8 horas'),
  price: z.number().finite().int().min(0, 'Precio inválido').max(999999999),
})

export const UpdateServiceSchema = CreateServiceSchema.extend({
  id: z.string().uuid('ID inválido'),
})
