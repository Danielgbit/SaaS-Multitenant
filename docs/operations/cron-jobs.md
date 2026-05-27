# Cron Jobs & Schedulers

## Endpoints programados

| Job | Endpoint | Frecuencia | Trigger | Worker Heartbeat |
|-----|----------|-----------|---------|------------------|
| Confirmation reminders | `POST /api/cron/check-reminders` | Cada 3 min | cron-job.org | `cron-reminders` |
| Notification queue | `POST /api/cron/process-notifications` | Cada 5 min | Pipedream | `cron-dispatch` |
| Shadow validation | `POST /api/cron/shadow-notifications` | Cada 5 min | Pipedream | `cron-shadow` |
| Appointment purge | `POST /api/cron/purge-appointments` | Diario 2-3 AM | cron-job.org | `cron-purge` |
| WhatsApp reminders | `POST /api/whatsapp/scheduler` | Cada 3 min | cron-job.org | — |
| Email reminders | `POST /api/email/scheduler` | Cada 3 min | cron-job.org | — |
| Check completed | `POST /api/appointments/check-completed` | Cada 5 min | cron-job.org | — |

## Autenticación

Todos los endpoints requieren `Authorization: Bearer {CRON_SECRET}` excepto
`/api/appointments/check-completed` que usa `?secret={CRON_SECRET}`.

## Runtime

| Endpoint | Runtime | Max Duration |
|----------|---------|-------------|
| `/api/cron/check-reminders` | edge | 10s (default) |
| `/api/cron/process-notifications` | nodejs | 60s |
| `/api/cron/shadow-notifications` | nodejs | 60s |
| `/api/cron/purge-appointments` | edge | 10s (default) |
| `/api/whatsapp/scheduler` | default | 10s (default) |
| `/api/email/scheduler` | default | 10s (default) |
| `/api/appointments/check-completed` | default | 10s (default) |
