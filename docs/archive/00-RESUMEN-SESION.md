> **STATUS: LEGACY / ARCHIVED**
> Este documento se mantiene como referencia hist�rica.
> Su contenido puede estar desactualizado. Ver docs/INDEX.md para la documentaci�n vigente.
> ---

# Resumen de Sesión — Arquitectura del Dominio de Citas v2.0

**Fecha:** 2026-05-16  
**Sesión:** Formal Appointment Domain State Machine Specification  
**Archivos generados:** 4 documentos en `docs/architecture/`  
**Total:** ~153 KB de especificación técnica  

---

## Documentos Generados

```
docs/architecture/
│
├── 00-RESUMEN-SESION.md              ← Este archivo
├── 01-DOMAIN-MODEL.md                (31.8 KB)
├── 02-DOMAIN-EVENTS.md               (24.2 KB)
├── 03-ORCHESTRATOR-ARCHITECTURE.md   (38.0 KB)
└── 09-MIGRATION.md                   (58.9 KB)
```

---

## 01-DOMAIN-MODEL.md — Modelo de Dominio

### Dominios Delimitados

| Dominio | State Fields | Commands | Eventos |
|---------|-------------|----------|---------|
| **Booking** | `booking_status`, `scheduled_start`, `scheduled_end`, `client_id`, `employee_id` | `create_appointment`, `cancel_appointment`, `reschedule_appointment` | `APPOINTMENT_CREATED`, `APPOINTMENT_CANCELLED`, `APPOINTMENT_RESCHEDULED` |
| **Service Execution** | `execution_status`, `completion_source`, `client_confirmation_source` | `complete_service`, `mark_manually`, `mark_no_show` | `SERVICE_COMPLETED`, `SERVICE_COMPLETED_MANUALLY`, `NO_SHOW_MARKED`, `NEEDS_REVIEW_TRIGGERED`, `AUTO_COMPLETION_TRIGGERED` |
| **Payment** | `payment_status`, `deposit_status`, `payment_method`, `amount` | `collect_payment`, `refund_payment`, `request_deposit` | `PAYMENT_CONFIRMED`, `PAYMENT_REFUNDED`, `DEPOSIT_REQUESTED`, `DEPOSIT_PAID`, `DEPOSIT_FORFEITED` |
| **Payroll** | `payroll_locked`, `payroll_item_id` | `lock_for_payroll`, `reverse_payroll` | `ADDED_TO_PAYROLL`, `PAYROLL_REVERSED` |
| **Orchestrator** | `workflow_flags` | (todas las transiciones pasan por orchestrator) | (todos los eventos) |

### Estados por Dominio

**Booking:** `ACTIVE` → `CANCELLED` | `NO_SHOW` (terminales)  
**Execution:** `SCHEDULED` → `MARKED_COMPLETE` | `MARKED_COMPLETE_MANUALLY` | `AUTO_COMPLETED` → `CONFIRMED`  
**Payment:** `PENDING` → `COLLECTED` | `REFUNDED` | `PARTIAL_REFUND` (PLANNED)  
**Deposit:** `PENDING` → `HELD` → `APPLIED` | `FORFEITED` | `FULL_REFUND` | `PARTIAL_REFUND` (PLANNED)

### Transiciones Críticas Prohibidas

| Estado Actual | Evento Intentado | Razón |
|--------------|-----------------|-------|
| CONFIRMED | `service_completed` | Ya completado |
| CANCELLED | `payment_confirmed` | No se puede cobrar una cita cancelada |
| NO_SHOW | `service_completed` | El cliente no asistió |

### Extension Points Definidos

| Capacidad | Estado | Documentación |
|-----------|--------|---------------|
| Multi-Service Line Items | PLANNED | Service lines independientes con estados propios |
| Employee Reassignment | PLANNED | Evento + auditoría + impacto payroll |
| Deposits | PLANNED | Policy engine, forfeiture, refunds |
| Rescheduling | PLANNED | Preservación de confirmaciones, transferencia de deposits |

---

## 02-DOMAIN-EVENTS.md — Catálogo de Eventos

### Resumen

| Estado | Cantidad |
|--------|----------|
| **IMPLEMENTED** | 10 eventos |
| **PLANNED** | 7 eventos |
| **Total** | 17 eventos |

### Eventos Implementados

| Evento | Propósito | Producido Por | Consumido Por |
|--------|-----------|---------------|---------------|
| `APPOINTMENT_CREATED` | Cita creada | `createAppointment` | Notification Orchestrator, Calendar Service |
| `SERVICE_COMPLETED` | Empleado marcó "Listo" | `markCompleted` | Notification Orchestrator, Payroll Service |
| `SERVICE_COMPLETED_MANUALLY` | Staff marcó manualmente | Orchestrator | Notification Orchestrator, Audit Logger, Payroll Service |
| `PAYMENT_CONFIRMED` | Pago cobrado | `confirmService` | Notification Orchestrator, Payroll Service, Realtime |
| `CLIENT_CONFIRMED` | Cliente confirmó vía token | Token confirm route | Orchestrator, Notification Orchestrator |
| `CLIENT_CONFIRMED_MANUALLY` | Staff confirmó cliente manualmente | Orchestrator | Notification Orchestrator, Audit Logger |
| `NEEDS_REVIEW_TRIGGERED` | 60min sin marcar | Cron Detector | Orchestrator, Notification Orchestrator |
| `AUTO_COMPLETION_TRIGGERED` | 120min auto-completado | Cron Detector | Orchestrator, Notification Orchestrator, Payroll Service |
| `NO_SHOW_MARKED` | No-show marcado | Orchestrator | Notification Orchestrator, Payroll Service, Audit Logger |
| `APPOINTMENT_CANCELLED` | Cita cancelada | `cancelAppointment` | Notification Orchestrator, Payroll Service, Calendar Service |

### Evento Envelope

```typescript
interface DomainEventEnvelope<T = unknown> {
  eventId: UUID;              // Unique
  eventType: EventType;       // "SERVICE_COMPLETED"
  correlationId: UUID;        // Agrupa eventos relacionados
  causationId: UUID | null;   // Causa directa
  timestamp: ISO8601;
  source: EventSource;        // 'employee_self' | 'manual_staff_override' | 'system_auto'
  version: string;            // Schema versioning
  payload: T;
  metadata: EventMetadata;    // Actor, IP, organizationId, appointmentId
}
```

### Table storage

```sql
CREATE TABLE domain_events (
  event_id UUID PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  correlation_id UUID NOT NULL,
  causation_id UUID,
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB NOT NULL,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
) PARTITION BY RANGE (created_at);
```

---

## 03-ORCHESTRATOR-ARCHITECTURE.md — Arquitectura del Orquestador

### Responsabilidades

| Responsabilidad | Descripción |
|----------------|-------------|
| **Command Validation** | Validar permisos, estado actual, campos requeridos |
| **Transition Enforcement** | Solo transiciones válidas del state machine |
| **Event Emission** | Emitir eventos inmutables en cada cambio |
| **Idempotency** | Prevenir procesamiento duplicado |
| **Locking** | Prevenir modificaciones concurrentes (advisory locks) |
| **Error Handling** | Errores estructurados con códigos y recovery hints |
| **Audit Trail** | Contexto completo de cada transición |

### Pipeline de Validación

```
Command → Idempotency Check → Existence Check → Permission Check
→ State Validation → Business Rule Check → Acquire Lock → Execute Transition
```

### 8 Comandos Definidos

| Comando | Transición | Actor | Razón Requerida |
|---------|-----------|-------|-----------------|
| `CompleteServiceCommand` | SCHEDULED → MARKED_COMPLETE | Employee (own) | No |
| `ManualCompletionCommand` | SCHEDULED/NEEDS_REVIEW → MARKED_COMPLETE_MANUALLY | Staff/Admin/Owner | Sí (≥10 chars) |
| `ConfirmPaymentCommand` | MARKED_COMPLETE → CONFIRMED | Staff/Admin/Owner | No |
| `ManualClientConfirmCommand` | null → MANUAL_OVERRIDE | Staff/Admin/Owner | Sí |
| `MarkNoShowCommand` | NEEDS_REVIEW/AUTO_COMPLETED → NO_SHOW | Staff/Admin/Owner | Sí |
| `CancelAppointmentCommand` | ACTIVE → CANCELLED | Client/Staff/Admin/Owner | Sí (staff) |
| `RescheduleCommand` | ACTIVE → ACTIVE (time change) | Client/Staff (future) | Sí |
| `ReassignEmployeeCommand` | (employee change) | Staff/Admin/Owner (future) | Sí |

### 10 Códigos de Error

| Código | HTTP | Significado | Recovery |
|--------|------|-------------|----------|
| INVALID_TRANSITION | 409 | Estado no permite transición | check_state |
| FORBIDDEN | 403 | Actor no autorizado | contact_support |
| RESOURCE_LOCKED | 423 | Modificación concurrente | retry (1s backoff) |
| APPOINTMENT_NOT_FOUND | 404 | Cita no existe | none |
| REASON_REQUIRED | 400 | Falta razón obligatoria | none |
| WARNING_NOT_ACKNOWLEDGED | 400 | No se confirmó advertencia | none |
| ALREADY_COMPLETED | 409 | Ya en estado terminal | none |
| INVALID_STATE | 409 | Validación de estado falló | check_state |
| CONFLICTING_TRANSITION | 409 | Otra transición en progreso | retry |
| VALIDATION_FAILED | 400 | Regla de negocio violada | none |

### Idempotency Pattern

```typescript
async function checkIdempotency(command: Command): Promise<CommandResult | null> {
  const existing = await db.query(`
    SELECT event_id, new_state, error_code
    FROM command_results WHERE command_id = $1
  `, [command.commandId]);

  if (existing.rows.length > 0) {
    return cachedResult; // Misma respuesta que la primera ejecución
  }
  return null; // Nuevo comando
}
```

---

## 09-MIGRATION.md — Estrategia de Migración

### Las 6 Fases

#### Fase 1: Foundation (Semanas 1-8)
- Nuevas columnas añadidas a `appointments` (nullable)
- Tabla `domain_events` creada con particionado por fecha
- `AppointmentOrchestrator` construido pero deshabilitado
- Backfill de todos los appointments existentes
- **Riesgo: Bajo | Rollback: <5 min**

#### Fase 2: Shadow Mode (Semanas 9-14)
- Legacy actions emiten eventos vía adapter (después de completar)
- Orchestrator valida en shadow (logs, no persiste)
- Reconciliation job compara columnas old vs new
- Dashboard de divergencias
- **Riesgo: Bajo | Rollback: <1 min**

#### Fase 3: Dual Write (Semanas 15-20)
- Feature flag: `NEW_ORCHESTRATOR_ENABLED = true`
- Orchestrator escribe columnas nuevas, legacy sigue siendo primario
- Sincronización bidireccional (new ↔ old)
- Reconciliation job cada 5 minutos
- **Riesgo: Bajo | Rollback: Feature flag flip (<1 min)**

#### Fase 4: Read Prefix (Semanas 21-24)
- UI y API leen de columnas nuevas con fallback a legacy
- `COALESCE(booking_status, map_to_booking_status(status))`
- Legacy columns siguen actualizadas para backup
- **Riesgo: Bajo | Rollback: Feature flag flip (<1 min)**

#### Fase 5: Write Cutover (Semanas 25-28)
- Orchestrator se convierte en el único writer
- Legacy actions se convierten en thin wrappers sobre el orchestrator
- Cron emite eventos (nunca muta estado directamente)
- Fallback de emergencia: `LEGACY_FALLBACK_ENABLED`
- **Riesgo: Medio | Rollback: 5-15 min (sync catch-up)**

#### Fase 6: Legacy Retirement (Semanas 29-32)
- Columnas legacy eliminadas (`DROP COLUMN status`, etc.)
- Adapter layer archivado
- Código de migración archivado a `/archive/`
- **Riesgo: Alto | Rollback: DB restore desde backup**

### Cron Migration (específicamente)

| Antes (Fase 0-4) | Después (Fase 5+) |
|------------------|-------------------|
| `UPDATE appointments SET confirmation_status='needs_review'` | Emitir `NEEDS_REVIEW_TRIGGERED` → orchestrator maneja |
| `UPDATE appointments SET status='completed'` | Emitir `AUTO_COMPLETION_TRIGGERED` → orchestrator maneja |
| Notificaciones inline | Side effect delegation |
| Sin idempotencia | Built-in dedup via eventId |

### Legacy State Mapper

```typescript
function mapBookingStatus(legacyStatus: string): BookingStatus {
  // 'pending' | 'confirmed' | 'completed' → 'active'
  // 'canceled' → 'cancelled'
  // 'no_show'  → 'no_show'
}

function mapExecutionStatus(legacyStatus, legacyConfirmationStatus): ServiceExecutionStatus {
  // confirmation_status='scheduled' → 'scheduled'
  // confirmation_status='completed' → 'marked_complete'
  // confirmation_status='confirmed' → 'confirmed'
  // status='completed', no confirmation → 'auto_completed'
}
```

### Legacy State Reverse Mapper (sync bidireccional)

```typescript
function mapNewToLegacyBooking(bookingStatus): string {
  // 'active'    → 'confirmed'
  // 'cancelled'  → 'canceled'
  // 'no_show'   → 'no_show'
}

function mapNewToLegacyExecution(executionStatus, completionSource): string {
  // 'scheduled'            → 'scheduled'
  // 'marked_complete'      → 'completed'
  // 'marked_complete_manually' → 'completed'
  // 'auto_completed'       → 'completed'
  // 'confirmed'            → 'confirmed'
}
```

---

## Principios Arquitectónicos Fundamentales

1. **Separación de concerns**: Booking lifecycle ≠ Service Execution lifecycle
2. **State ownership**: Cada dominio controla sus propias transiciones
3. **Cron detector, no mutador**: Cron solo emite eventos, nunca escribe estado directo
4. **Overrides auditables**: Overrides manuales se modelan como eventos de dominio formales con razón y warning acknowledgment
5. **Strangler Fig**: Migración incremental, no reescritura masiva
6. **Feature flags**: Cada fase se controla por flag, rollback instantáneo
7. **Zero downtime**: Operaciones humanas nunca se interrumpen durante la migración

---

## Prioridad de Implementación

```
FASE 1: Domain Foundation
  ├── 1. State Model Separation (bounded states, ownership, transitions, invariants)
  ├── 2. Domain Event Catalog (contratos estables)
  └── 3. Transition Rules / State Machine (transiciones permitidas/prohibidas)

FASE 2: Orchestration
  └── 4. Orchestrator (validaciones, workflow, idempotencia, side effects)

FASE 3: Side Effect Extraction
  └── 5. Extraer side effects de actions (notifications, payroll, realtime, logs)

FASE 4: Cron Refactor
  └── 6. Cron solo emite eventos (orchestrator maneja transiciones)

FASE 5: Resilience
  ├── 7. Payroll durable
  ├── 8. Retry queues
  ├── 9. DLQ
  └── 10. Distributed locking
```

---

**Fin del resumen**

