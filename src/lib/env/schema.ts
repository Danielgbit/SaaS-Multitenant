import { z } from 'zod'

export const SERVER_ENV_KEYS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_BASIC_MONTHLY',
  'STRIPE_PRICE_PRO_MONTHLY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'WASENDER_WEBHOOK_TOKEN',
  'WEBHOOK_SECRET',
  'CRON_SECRET',
  'SHADOW_NOTIFICATION_ENABLED',
  'SHADOW_NOTIFICATION_MODE',
  'SHADOW_BATCH_SIZE',
  'SHADOW_PROCESSING_TIMEOUT_MIN',
  'SHADOW_SCHEDULING_TOLERANCE_SEC',
  'BYPASS_SUBSCRIPTION_CHECK',
  'BYPASS_ADMIN_AUTH',
  'SHADOW_MODE_ENABLED',
  'SHADOW_MODE_FLOWS',
  'SHADOW_MODE',
  'PROCESS_NOTIFICATIONS_DRY_RUN',
] as const

export const CLIENT_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_FLAG_NEW_WIDGETS',
  'NEXT_PUBLIC_FLAG_STAFF_UTIL',
] as const

export const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_PRICE_BASIC_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  WASENDER_WEBHOOK_TOKEN: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  CRON_SECRET: z.string().min(1),
  SHADOW_NOTIFICATION_ENABLED: z.enum(['true', 'false']).default('false'),
  SHADOW_NOTIFICATION_MODE: z.enum(['observe_only', 'enforce']).default('observe_only'),
  SHADOW_BATCH_SIZE: z.coerce.number().int().positive().default(20),
  SHADOW_PROCESSING_TIMEOUT_MIN: z.coerce.number().int().positive().default(5),
  SHADOW_SCHEDULING_TOLERANCE_SEC: z.coerce.number().int().positive().default(60),
  BYPASS_SUBSCRIPTION_CHECK: z.enum(['true', 'false']).default('false'),
  BYPASS_ADMIN_AUTH: z.enum(['true', 'false']).default('false'),
  SHADOW_MODE_ENABLED: z.enum(['true', 'false']).default('false'),
  SHADOW_MODE_FLOWS: z.string().optional(),
  SHADOW_MODE: z.enum(['observe_only', 'enforce']).default('observe_only'),
  PROCESS_NOTIFICATIONS_DRY_RUN: z.enum(['true', 'false']).default('false'),
}).strict()

export const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_FLAG_NEW_WIDGETS: z.enum(['true', 'false']).default('false'),
  NEXT_PUBLIC_FLAG_STAFF_UTIL: z.enum(['true', 'false']).default('false'),
}).strict()

export type ServerEnv = z.infer<typeof serverSchema>
export type ClientEnv = z.infer<typeof clientSchema>
