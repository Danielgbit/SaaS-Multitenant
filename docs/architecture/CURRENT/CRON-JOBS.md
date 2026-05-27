# Cron Jobs

> STATUS: CURRENT IMPLEMENTATION
> Source of truth: `src/app/api/cron/`
> Last updated: 2026-05-27

---

## 1. Inventario

| Endpoint | Método | Intervalo | Scheduler | Idempotente | Auth |
|----------|--------|-----------|-----------|-------------|------|
| `POST /api/cron/check-reminders` | POST | 3 min | cron-job.org | Sí | `Bearer CRON_SECRET` |
| `POST /api/cron/process-notifications` | POST | 5 min | Pipedream | Parcial (claim atómico) | `Bearer CRON_SECRET` |
| `POST /api/cron/purge-appointments` | POST | Diario 2 AM | cron-job.org | Sí | `Bearer CRON_SECRET` |
| `POST /api/cron/shadow-notifications` | POST | 5 min (sugerido) | cron-job.org / Pipedream | Sí | `Bearer CRON_SECRET` |

---

## 2. Detalle

### check-reminders
**Archivo:** `src/app/api/cron/check-reminders/route.ts` / `src/actions/cron/runCheckReminders.ts`

| Regla | Timing | Acción |
|-------|--------|--------|
| Recordatorio | `hora_fin - 5 min` | Notificación `reminder` al empleado (máx 2, dedup 3 min) |
| Alerta sin marcar | `hora_fin + 60 min` | `confirmation_status = needs_review` + notifica asistentes |
| Auto-completado | `hora_fin + 120 min` | `confirmation_status = completed` + log + notificación |

### process-notifications
**Archivo:** `src/app/api/cron/process-notifications/route.ts`

Procesa `notification_queue` con SKIP LOCKED (batch 50). Recupera jobs stuck, aplica rate limiting, resuelve channel adapter, envía, actualiza status.

**Retry:** 5 min → 20 min → 45 min → `failed_permanently`

### purge-appointments
**Archivo:** `src/app/api/cron/purge-appointments/route.ts`

Recorre orgs con `auto_purge_enabled`. Elimina citas terminales más antiguas que `auto_retention_days`. Protege citas con `invoice_id IS NOT NULL`.

### shadow-notifications
**Archivo:** `src/app/api/cron/shadow-notifications/route.ts`

Procesa semillas de validación V1 vs V2. Sin impacto en producción (offline).

---

## 3. Configuración de Schedulers

### cron-job.org

| Endpoint | Schedule | URL |
|----------|----------|-----|
| check-reminders | `*/3 * * * *` | `https://dominio.com/api/cron/check-reminders` |
| purge-appointments | `0 2 * * *` | `https://dominio.com/api/cron/purge-appointments` |

Headers: `Authorization: Bearer <CRON_SECRET>`

### Pipedream

| Endpoint | Schedule | URL |
|----------|----------|-----|
| process-notifications | Cada 5 min | `https://dominio.com/api/cron/process-notifications` |

---

## 4. Heartbeat

Todos los endpoints reportan heartbeat via `upsert_worker_heartbeat()` RPC para monitoreo de salud.

---

## 5. Reglas de Mantenimiento

- Nuevo cron endpoint → documentar aquí + configurar scheduler externo
- Idempotentes por diseño
- Usar `createServiceRoleClient()` (bypass RLS)
- Implementar heartbeat
