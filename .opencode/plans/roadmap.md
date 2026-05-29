# Roadmap — Prügressy SaaS

## Estado actual

| Fase | Tag | Estado |
|------|-----|--------|
| Fase 1 — env.ts + Zod | `env-zod-2026-06` | ✅ |
| Fase 2 — `/mi` V2 | `mi-v2-2026-06` | ✅ |
| Fase 3B — Context Propagation | `context-propagation-2026-06` | ✅ |
| Fase 3A — Operational Freeze | — | 🔄 **activo** |

---

## Fase 3A — Operational Freeze (48-72h)

### Objetivo

Estabilizar producción post-hardening. Detectar regresiones antes de seguir expandiendo.

### Paso 0 — Snapshot inicial

| Métrica | Dónde verla |
|---------|-------------|
| Error rate actual | Vercel Analytics últimos 60 min |
| Dead letters count | `SELECT COUNT(*) FROM dead_letter_notifications WHERE replay_status = 'pending'` |
| Queue depth | `SELECT COUNT(*) FROM notification_queue WHERE status = 'pending'` |
| Cron heartbeats | `SELECT * FROM notification_worker_heartbeats ORDER BY last_heartbeat DESC` |
| Memory baseline | Vercel Usage Dashboard |

### Reglas

| Permitido | Prohibido |
|-----------|-----------|
| Monitorear logs, métricas, cron jobs, webhooks | Refactors de cualquier tipo |
| Hotfixes SEV-1/SEV-2 | Features nuevas |
| Rollbacks si es necesario | Cambios de schema DB |
| | Nuevas abstracciones |
| | Renovación de dependencias |
| | Rediseños de UI |
| | Merges a `main` salvo hotfix |

### Monitoreo por área

**Context propagation (crítico post-3B):**
- `requestId` ausente en appLogs
- `flow` undefined en logs de cron/actions
- `organizationId` undefined donde debería existir
- `console.warn('[request-context]` en logs
- Contaminación entre requests (`requestId` repetido)
- Async context leaks en long-running jobs (cron + webhooks concurrentes)

**/mi V2:**
- Latencia (>3s p95)
- Errores en Server Actions
- Payload de métricas (completionRate > 100, streak negativo)
- Hydration errors

**env.ts + Zod:**
- Fallos de boot en deploy
- `appLog` startup `flow: system.env` ausente
- Client env parse errors en producción

**Cron jobs (7 endpoints):**
- Heartbeat ausente por >2 ciclos
- `last_error` en `notification_worker_heartbeats`
- Dead letter count creciendo
- Processing time > 2x intervalo

### Hotfix protocol

| Severidad | Descripción | Acción |
|-----------|-------------|--------|
| SEV-1 | Sistema caído, datos corruptos, auth roto | Hotfix inmediato |
| SEV-2 | Feature crítica rota, sin workaround | Hotfix dentro de 4h |
| SEV-3 | Bug menor con workaround | Documentar, posponer |
| SEV-4 | Cosmético, sin impacto | Ignorar |

### Condición de salida

- [ ] 48h sin hotfixes SEV-1/SEV-2
- [ ] Error rate plano o descendente vs snapshot inicial
- [ ] Cron jobs con heartbeats estables
- [ ] Sin `console.warn('[request-context]` en logs
- [ ] Sin `console.warn('[env/client]` en producción
- [ ] Dead letter count estable o decreciente vs snapshot
- [ ] Sin regresiones reportadas de `/mi`
- [ ] Build exitoso en Vercel (último deploy)

---

## Fase 3B — Context Propagation (✅ completa)

28 archivos modificados. Tag: `context-propagation-2026-06`.

### Implementado

- `RequestContext` extendido con `organizationId`, `userId`, `flow`
- `setRequestContext(partial)` con `storage.enterWith` (inmutable)
- `getRequestContext()` helper
- `appLog` auto-hereda `requestId`, `orgId`, `userId`, `flow` del contexto ALS
- 8 cron/webhook routes enriquecidos con `flow: cron.xxx` / `webhook.xxx`
- 12 Server Actions enriquecidos con `flow: booking.*`, `payroll.*`, `notification.*`, `employee.dashboard`
- 6 trace_id gaps cerrados en notification pipeline (processor, inbound-events, dead-letter, event-timeline, messages, in-app.channel)
- `src/lib/auth/authorization.ts` creado (`requireRole`, `requireOrganizationAccess`)

---

## Fase 3C — Notification Tracing (~2 días)

**Dependencia:** Fase 3A completada (freeze exitoso).

| Item | Descripción |
|------|-------------|
| 3C.1 | Verificar `trace_id` en `notification_events` post-3B |
| 3C.2 | Asegurar `orchestrator` pasa `trace_id` desde `getRequestId()` a nuevos queue items |
| 3C.3 | `processor` mantiene `trace_id` al mover a dead letter |
| 3C.4 | Scheduler propaga contexto a cada notificación individual |
| 3C.5 | Webhook correlaciona delivery callback con `trace_id` original |

**Non-goals:** No OpenTelemetry, no cambios de schema, no refactors de pipeline.

---

## Fase 4 — Booking Analytics (~1 semana)

**Dependencia:** Fase 3C completada (tracing consistente antes de métricas).

| Item | Descripción |
|------|-------------|
| 4.1 | `booking_sessions` migration (lightweight) |
| 4.2 | Server Action `trackBookingStep(step, sessionId)` |
| 4.3 | Server Action `getBookingConversionMetrics(period)` |
| 4.4 | Componente `ConversionSummaryCard` (dashboard admin) |

**Non-goals:** No retention cohorts, no LTV, no forecasting, no OpenTelemetry.

---

## Non-goals globales

- ❌ OpenTelemetry (postergado hasta múltiples servicios/workers)
- ❌ Cleanup masivo de legacy V1 (solo oportunista)
- ❌ PWA (postergado hasta confirmación de uso mobile)
- ❌ Rediseño de UI
- ❌ Cambios de schema grandes
- ❌ Refactors arquitectónicos amplios

## Tags

```
context-propagation-2026-06    ✅
notification-tracing-2026-06   ⏳
booking-analytics-2026-06      ⏳
```
