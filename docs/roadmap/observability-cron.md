# observability-cron

## Objetivo
Cerrar los gaps de monitoreo en workers del pipeline de notificaciones y exponer el estado en el admin panel.

## Estado actual

### ✅ Ya existe
- `notification_worker_heartbeats` table
- `upsert_worker_heartbeat()` RPC (delta-accumulate)
- `evaluate_worker_alerts()` RPC (5 condiciones: stale, backlog, dlq, error_rate, timeout)
- `notification_alert_events` table + `processCriticalNotificationAlerts()`
- `/api/notifications/health` endpoint
- Tracing con `correlation_id` / `trace_id`
- Heartbeats en: `cron-dispatch`, `cron-reminders`, `provider-*`

### ❌ Gaps
| Gap | Impacto |
|-----|---------|
| `shadow-notifications` sin heartbeat | Fallo silencioso indetectable |
| `purge-appointments` sin heartbeat | Fallo silencioso indetectable |
| `cron-reminders` no está en seed inicial | Puede perderse en DB nueva |
| Admin no muestra health de workers | Datos existen, nadie los ve |

---

## Sprint 1 — Heartbeats faltantes (~2h)

### 1.1 Migración: seed workers faltantes
- Archivo: `supabase/migrations/YYYYMMDDHHMMSS_seed_worker_heartbeats.sql`
- Agregar seed para: `cron-reminders`, `cron-shadow`, `cron-purge`

```sql
INSERT INTO notification_worker_heartbeats (worker_name, status) VALUES
    ('cron-reminders', 'healthy'),
    ('cron-shadow', 'healthy'),
    ('cron-purge', 'healthy')
ON CONFLICT (worker_name) DO NOTHING;
```

### 1.2 Heartbeat en shadow-notifications
- Archivo: `src/app/api/cron/shadow-notifications/route.ts`
- Agregar `sendHeartbeat()` al inicio (healthy), en éxito (healthy + processed_count + duration_ms), en error (error + lastError)

### 1.3 Heartbeat en purge-appointments
- Archivo: `src/app/api/cron/purge-appointments/route.ts`
- Mismo patrón que shadow-notifications

## Sprint 2 — Admin dashboard de workers (~3h)

### 2.1 Workers dashboard en admin page
- Archivo: `src/app/admin/page.tsx`
- Query `notification_worker_heartbeats` ordenado por severidad:

```
🔴 stale/error primero
🟡 warning después
🟢 healthy al final
```

- Columnas: Worker | Status | Last seen | Queue depth | Errors
- Al click: tooltip con last_error, duration_ms, processed_count, last_success_at

### 2.2 Panel de alertas (opcional)
- Query `notification_alert_events WHERE status IN ('new', 'acknowledged')`
- Lista compacta debajo de workers

---

## Reglas del sprint
- No mezclar con lógica funcional
- Commits pequeños por bloque
- Resolver TS inmediatamente

## Definition of Done
- [ ] `cron-shadow` aparece en `notification_worker_heartbeats`
- [ ] `cron-purge` aparece en `notification_worker_heartbeats`
- [ ] `cron-reminders` seeded correctamente
- [ ] Admin muestra todos los workers (ordenados por severidad)
- [ ] Admin muestra alertas `new`/`acknowledged`
- [ ] Simular fallo en shadow crea alert event visible
- [ ] Build verde
- [ ] TypeScript 0 errores

## Cierre
```bash
git rm docs/roadmap/observability-cron.md
git commit -m "chore(observability): complete cron worker monitoring"
```
