// =========================================================================================
// SCHEMAS: Zod schemas para validación de Server Actions
// =========================================================================================

import { z } from 'zod'

export const PaymentMethodSchema = z.enum([
  'efectivo',
  'nequi',
  'daviplata',
  'pse',
  'qr_nequi',
  'qr_bancolombia',
  'tarjeta_debito',
  'tarjeta_credito',
])

export const ConfirmationActionSchema = z.enum([
  'created',
  'confirmed',
  'adjusted',
  'manually_set',
  'cancelled',
])

export const NotificationTypeSchema = z.enum([
  'reminder',
  'service_ready',
  'unmarked_alert',
  'auto_completed',
  'confirmation_sent',
])

// =========================================================================================
// markCompleted — Empleado marca "Listo"
// =========================================================================================

export const MarkCompletedSchema = z.object({
  appointmentId: z.string().uuid('ID de cita inválido'),
  priceAdjustment: z.number().int().min(0).max(999999999).optional().default(0),
  notes: z.string().max(500).optional(),
})

export type MarkCompletedInput = z.infer<typeof MarkCompletedSchema>

export type MarkCompletedState = {
  success?: boolean
  error?: string
  logId?: string
}

// =========================================================================================
// confirmService — Asistente confirma + cobra
// =========================================================================================

export const ConfirmServiceSchema = z.object({
  appointmentId: z.string().uuid('ID de cita inválido'),
  logId: z.string().uuid('ID de log inválido').optional(),
  paymentMethod: PaymentMethodSchema,
  notes: z.string().max(500).optional(),
})

export type ConfirmServiceInput = z.infer<typeof ConfirmServiceSchema>

export type ConfirmServiceState = {
  success?: boolean
  error?: string
  appointmentId?: string
}

// =========================================================================================
// adjustPrice — Asistente ajusta precio
// =========================================================================================

export const AdjustPriceSchema = z.object({
  appointmentId: z.string().uuid('ID de cita inválido'),
  newPrice: z.number().int().min(0).max(999999999, 'Precio inválido'),
  reason: z.string().min(1).max(200, 'Motivo requerido'),
})

export type AdjustPriceInput = z.infer<typeof AdjustPriceSchema>

export type AdjustPriceState = {
  success?: boolean
  error?: string
  logId?: string
}

// =========================================================================================
// markManually — Asistente marca manualmente
// =========================================================================================

export const MarkManuallySchema = z.object({
  appointmentId: z.string().uuid('ID de cita inválido'),
  reason: z.string().min(1).max(200, 'Motivo requerido'),
})

export type MarkManuallyInput = z.infer<typeof MarkManuallySchema>

export type MarkManuallyState = {
  success?: boolean
  error?: string
  logId?: string
}

// =========================================================================================
// cancelConfirmation — Cancelar confirmación
// =========================================================================================

export const CancelConfirmationSchema = z.object({
  appointmentId: z.string().uuid('ID de cita inválido'),
  reason: z.string().min(1).max(200, 'Motivo requerido'),
})

export type CancelConfirmationInput = z.infer<typeof CancelConfirmationSchema>

export type CancelConfirmationState = {
  success?: boolean
  error?: string
}

// =========================================================================================
// getNotifications — Obtener notificaciones
// =========================================================================================

export const GetNotificationsSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  unreadOnly: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(100).optional().default(50),
})

export type GetNotificationsInput = z.infer<typeof GetNotificationsSchema>

// =========================================================================================
// markNotificationRead — Marcar notificación como leída
// =========================================================================================

export const MarkNotificationReadSchema = z.object({
  notificationId: z.string().uuid('ID de notificación inválido'),
})

export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadSchema>

export type MarkNotificationReadState = {
  success?: boolean
  error?: string
}

// =========================================================================================
// getConfirmationLogs — Historial de logs por cita
// =========================================================================================

export const GetConfirmationLogsSchema = z.object({
  appointmentId: z.string().uuid('ID de cita inválido'),
})

export type GetConfirmationLogsInput = z.infer<typeof GetConfirmationLogsSchema>

// =========================================================================================
// getPendingConfirmations — Lista de pendientes
// =========================================================================================

export const GetPendingConfirmationsSchema = z.object({
  organizationId: z.string().uuid('ID de organización inválido'),
  employeeId: z.string().uuid().optional(),
})

export type GetPendingConfirmationsInput = z.infer<typeof GetPendingConfirmationsSchema>
