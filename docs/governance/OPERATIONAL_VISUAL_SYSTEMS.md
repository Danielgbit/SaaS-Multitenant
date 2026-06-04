# Operational Visual Systems (OVS) — Prügressy

> STATUS: CURRENT IMPLEMENTATION
> Source of truth: `src/app/api/cron/`, `src/lib/notifications/`, `src/lib/shadow/`
> Last updated: 2026-06-04

---

## 1. Cron Jobs

4 endpoints operativos, todos autenticados con `Authorization: Bearer CRON_SECRET`:

| Endpoint | Intervalo | Idempotente | Side effects |
|----------|-----------|-------------|--------------|
| `POST /api/cron/check-reminders` | 3 min | Sí | Notificaciones reminder, auto-completado, needs_review |
| `POST /api/cron/process-notifications` | 5 min | Parcial (claim atómico) | Procesa notification_queue (batch 50, SKIP LOCKED) |
| `POST /api/cron/purge-appointments` | Diario 2 AM | Sí | Elimina citas terminales >= auto_retention_days |
| `POST /api/cron/shadow-notifications` | 5 min | Sí | Procesa semillas shadow validation |

Todos los endpoints reportan heartbeat via `upsert_worker_heartbeat()`.

---

## 2. Shadow Mode

Validación offline V1 vs V2 sin impacto en producción.

### Componentes

| Componente | Archivo | Rol |
|-----------|---------|-----|
| Seeder | `src/lib/notifications/shadow/seeder.ts` | Fire-and-forget snapshot (100ms timeout) |
| Runner | `src/lib/notifications/shadow/runner.ts` | Batch consumer, claims seeds, ejecuta comparación |
| Comparator | `src/lib/notifications/shadow/comparator.ts` | Comparador V1 vs V2 con drift scoring |
| Config | `src/lib/notifications/shadow/config.ts` | Feature flags desde environment |
| Types | `src/lib/notifications/shadow/types.ts` | DriftType, DriftSeverity, etc. |

### Tablas

| Tabla | Propósito |
|-------|-----------|
| `shadow_notification_seeds` | Semillas de validación (snapshot V1) |
| `shadow_notification_logs` | Resultados de comparación |
| `shadow_validation_logs` | Phase 2A — **deprecada** (sin código activo) |

### Modos

| Modo | Comportamiento |
|------|----------------|
| `observe_only` | (Default) Solo registra comparaciones |
| `dual_write` | Ejecuta V2 en paralelo (configurado, runner pendiente) |
| `soft_enforce` | Alerta si drift excede umbrales (configurado, runner pendiente) |

---

## 3. Notifications V2 — Arquitectura de Canales

### Core (orquestación)

| Archivo | Rol |
|---------|-----|
| `orchestrator.ts` | Orquestador principal, resuelve automation rules |
| `processor.ts` | Procesador de cola, claim atómico |
| `template-engine.ts` | Renderizado de templates por canal |
| `retry-strategy.ts` | Reintentos: 5 min → 20 min → 45 min → dead_letter |
| `state-machine.ts` | Máquina de estados de cola |

### Canales (channel adapter pattern)

```
Channel Factory
├── WhatsApp (Wasender / n8n / mock providers)
├── Email (Resend)
└── In-App (Supabase Realtime)
```

### Tablas

| Tabla | Propósito |
|-------|-----------|
| `notification_queue` | Cola unificada con SKIP LOCKED |
| `notification_providers` | Credenciales por org por canal |
| `message_templates` | Templates versionables |
| `automation_rules` | Reglas trigger → canal → template |
| `notification_conversations` | Hilos por cliente |
| `notification_messages` | Historial de mensajes |
| `notification_events` | Timeline de eventos |
| `notification_inbound_events` | Eventos entrantes (replay-safe) |
| `dead_letter_notifications` | Fallos permanentes (replayable) |
| `notification_worker_heartbeats` | Heartbeat de workers |

---

## 4. Financial Events — Capa Append-Only

`financial_events` es la capa canónica para eventos financieros. Se alimenta desde:

| Origen | Trigger |
|--------|---------|
| `confirmation_logs` | `trg_financial_event_from_confirmation_log` |
| `client_account_transactions` | `trg_financial_event_from_client_transaction` |
| `payroll_periods` (UPDATE status) | `trg_financial_events_from_paid_period` |

Protegida contra DELETE por `trg_prevent_financial_events_mutation`.

---

## 5. Retry Strategy

| Sistema | Patrón | Límite |
|---------|--------|--------|
| Notification queue | 5 min → 20 min → 45 min | 3 intentos → dead_letter |
| Shadow seed | Fire-and-forget, 100ms timeout | Sin retry |
| Invitaciones | 10 resends/hora | Rate limit por invitation_id |
| WhatsApp scheduler | Diario (runDailyReminderScheduler) | Sin retry automático |

---

## 6. Heartbeat y Monitoreo

| Componente | Mecanismo | Frecuencia |
|-----------|-----------|------------|
| Cron workers | `upsert_worker_heartbeat()` RPC | En cada ejecución |
| Notification worker | `notification_worker_heartbeats` | En cada batch |
| System logs | `system_logs` con nivel info/warn/error/ | En eventos relevantes |
