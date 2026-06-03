import { z } from 'zod'
import { emailSchema, passwordSchema, colombianNameSchema } from '@/schemas/common'

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña requerida'),
  redirect_to: z.string().optional(),
})

export const RegisterSchema = z.object({
  businessName: z.string().min(2, 'Mínimo 2 caracteres').max(100).trim()
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s'&.\-]+$/, 'Caracteres inválidos en el nombre del negocio'),
  fullName: colombianNameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})
