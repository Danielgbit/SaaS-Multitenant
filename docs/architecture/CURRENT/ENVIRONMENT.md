# Variables de Entorno

> STATUS: CURRENT IMPLEMENTATION
> Source of truth: `.env.local`, `.env.example`
> Last updated: 2026-05-27

---

## Grupo 1: Supabase

| Variable | Dev | Prod | Descripción | Dónde obtenerla |
|----------|-----|------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | URL del proyecto | Supabase Dashboard → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | Anon key pública | Supabase Dashboard → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | Service role (bypass RLS) | Supabase Dashboard → API |

## Grupo 2: Stripe

| Variable | Dev | Prod | Descripción |
|----------|-----|------|-------------|
| `STRIPE_SECRET_KEY` | test | live | Clave secreta |
| `STRIPE_PRICE_BASIC_MONTHLY` | ✅ | ✅ | Price ID Basic |
| `STRIPE_PRICE_PRO_MONTHLY` | ✅ | ✅ | Price ID Professional |

## Grupo 3: Resend

| Variable | Dev | Prod | Descripción |
|----------|-----|------|-------------|
| `RESEND_API_KEY` | ✅ | ✅ | API key para emails |
| `RESEND_FROM_EMAIL` | ✅ | ✅ | Remitente verificado |

## Grupo 4: Cron

| Variable | Dev | Prod | Descripción |
|----------|-----|------|-------------|
| `CRON_SECRET` | ✅ | ✅ | Token auth para schedulers externos |

## Grupo 5: Entorno

| Variable | Dev | Prod | Descripción |
|----------|-----|------|-------------|
| `NEXT_PUBLIC_BASE_URL` | ✅ | ❌ | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | opcional | ✅ | URL pública para webhooks/links |

## Grupo 6: Feature Flags (solo dev)

| Variable | Descripción |
|----------|-------------|
| `BYPASS_SUBSCRIPTION_CHECK` | Saltar verificación de suscripción |
| `BYPASS_ADMIN_AUTH` | Saltar verificación de permisos admin |

NUNCA activar en producción.

## Grupo 7: Shadow Mode

| Variable | Default | Descripción |
|----------|---------|-------------|
| `SHADOW_MODE_ENABLED` | `true` | Activar shadow validation general |
| `SHADOW_MODE_FLOWS` | `service:complete,appointment:cancel` | Flujos en shadow |
| `SHADOW_MODE` | `observe_only` | observe_only / dual_write / soft_enforce |
| `SHADOW_NOTIFICATION_ENABLED` | `true` | Activar shadow notificaciones |
| `SHADOW_NOTIFICATION_MODE` | `observe_only` | Modo shadow notificaciones |
| `SHADOW_BATCH_SIZE` | `20` | Items por batch |
| `SHADOW_PROCESSING_TIMEOUT_MIN` | `5` | Timeout seeds stuck |
| `SHADOW_SCHEDULING_TOLERANCE_SEC` | `60` | Tolerancia scheduling |

---

## Dev vs Producción

| Variable | Dev | Prod |
|----------|-----|------|
| Supabase | Proyecto dev | Proyecto prod |
| Stripe | `sk_test_*` | `sk_live_*` |
| `CRON_SECRET` | Valor local | UUID seguro |
| `BYPASS_*` | `true` | `false` |
| `SHADOW_*` | `true, observe_only` | Según decisión |

---

## Buenas Prácticas

- `.env.local` en `.gitignore` — nunca se commitea
- Variables en Vercel configuradas por environment (Production, Preview, Development)
- Stripe keys `test` vs `live` NUNCA mezclar entre entornos
- `CRON_SECRET` único por entorno
