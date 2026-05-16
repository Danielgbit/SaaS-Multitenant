# Shadow Mode Phase 2A

Minimal drift detection system: **Legacy result vs Orchestrator decision**.

## Objetivo

Descubrir si el modelo del orchestrator (documentado en `docs/architecture/`) coincide con el comportamiento real del sistema legacy.

## Qué hace

1. Legacy action ejecuta normalmente (SOURCE OF TRUTH — no se modifica)
2. Shadow captura snapshot del estado resultante
3. Orchestrator simulado evalúa: "¿qué habría hecho el orchestrator?"
4. Compara resultados
5. Detecta drift (diferencias)
6. Loguea a `shadow_validation_logs`

## Qué NO hace

- ❌ No bloquea requests
- ❌ No modifica el dominio
- ❌ No afecta UX
- ❌ No hace retry automático
- ❌ No es el sistema de observabilidad final

## Feature Flags

```env
# Activar/desactivar shadow mode globalmente
SHADOW_MODE_ENABLED=true

# Flows específicos habilitados (CSV)
SHADOW_MODE_FLOWS=service:complete,payment:confirm,appointment:cancel

# Modo de operación
SHADOW_MODE=observe_only  # observe_only | dual_write | soft_enforce
```

## Integración en Legacy Actions

```typescript
// ANTES de la mutación: capturar seed
const shadowSeed = {
  appointmentId,
  observedUpdatedAt: appointment.updated_at,
  correlationId: crypto.randomUUID(),
}

// ... legacy mutation (sin cambios) ...

// DESPUÉS: fire-and-forget
import('@/lib/shadow').then(({ shadowQueue, runShadowValidation }) => {
  shadowQueue.enqueue(async () => {
    await runShadowValidation({
      command: 'service:complete',
      appointmentId,
      organizationId: appointment.organization_id,
      correlationId: shadowSeed.correlationId,
      actorId: user.id,
      actorRole: 'employee',
      timestamp: now,
      payload: { priceAdjustment, notes },
    }, shadowSeed)
  })
})
```

## Tabla: shadow_validation_logs

| Columna | Descripción |
|---|---|
| `command` | Tipo de comando: `service:complete`, `payment:confirm`, etc. |
| `legacy_result` | Lo que el sistema legacy **realmente hizo** (JSONB) |
| `orchestrator_result` | Lo que el orchestrator **habría hecho** (JSONB) |
| `drift_detected` | Boolean: ¿hay diferencia entre legacy y orchestrator? |
| `state_after` | Snapshot del estado después de la mutación |
| `validation_version` | Versión de las reglas de validación usadas |

## Queries útiles

### Ver drifts recientes

```sql
SELECT 
  command,
  legacy_result,
  orchestrator_result,
  drift_detail,
  created_at
FROM shadow_validation_logs
WHERE drift_detected = true
ORDER BY created_at DESC
LIMIT 50;
```

### Contar drifts por comando

```sql
SELECT 
  command,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE drift_detected) as with_drift,
  ROUND(100.0 * COUNT(*) FILTER (WHERE drift_detected) / COUNT(*), 2) as drift_pct
FROM shadow_validation_logs
GROUP BY command
ORDER BY drift_pct DESC;
```

### Ver detalle de un drift específico

```sql
SELECT 
  correlation_id,
  command,
  legacy_result->>'confirmation_status' as legacy_conf,
  orchestrator_result->'targetState'->>'confirmation_status' as orchestrator_conf,
  drift_detail,
  created_at
FROM shadow_validation_logs
WHERE drift_detected = true
  AND command = 'service:complete'
ORDER BY created_at DESC
LIMIT 10;
```

## Comandos soportados

| Comando | Legacy Action | Evento Orchestrator |
|---|---|---|
| `service:complete` | `markCompleted.ts` | `service.completed` |
| `service:complete_manual` | `markManually.ts` | `service.completed_manually` |
| `payment:confirm` | `confirmService.ts` | `payment.confirmed` |
| `appointment:cancel` | `cancelConfirmation.ts` | `appointment.cancelled` |
| `price:adjust` | `adjustPrice.ts` | `price.adjusted` |
| `cron:overdue` | `runCheckReminders.ts` (Phase 1) | `service.overdue` |
| `cron:auto_complete` | `runCheckReminders.ts` (Phase 2) | `auto_completion.triggered` |
| `appointment:create` | `createAppointment.ts` | `appointment.created` |

## State Machine

Basada en `docs/architecture/06-state-machines.md`:

```
(pending,scheduled)
  → service.completed → (completed,completed)
  → appointment.cancelled → (cancelled,cancelled)

(completed,completed)
  → payment.confirmed → (completed,confirmed) [TERMINAL]

(completed,needs_review)
  → payment.confirmed → (completed,confirmed) [TERMINAL]
```

## Criterio de éxito

- **>90%** validaciones con `drift_detected = false`
- **100%** de los drifts investigados (¿es bug del modelo o del legacy?)
- **Baja frecuencia** de `snapshot_drift` (si es alta, hay race conditions reales)

## Próximos pasos (Post-2A)

- [ ] Invariants engine
- [ ] Expected events audit
- [ ] Snapshot hash
- [ ] Timings breakdown
- [ ] Schema versioning
- [ ] Discrepancy taxonomy
- [ ] Shadow dashboard

## Archivos

```
src/lib/shadow/
├── index.ts              # Entry point: runShadowValidation()
├── types.ts              # Types
├── config.ts             # Feature flags
├── queue.ts              # shadowQueue abstraction
├── state-machine.ts      # Pure validation logic
├── capturer.ts           # Snapshot capture + drift check
├── orchestrator.ts       # Orchestrator simulator
└── store.ts              # Persistence
```
