# Shadow Mode — Validación de Arquitectura

> STATUS: CURRENT IMPLEMENTATION
> Source of truth: `src/lib/shadow/`, `src/lib/notifications/shadow/`
> Last updated: 2026-05-27

---

## 1. Visión General

Shadow Mode es un sistema de **validación en paralelo no-bloqueante** que ejecuta la nueva arquitectura (V2) junto a la actual (V1) sin afectar producción. Permite detectar drift entre ambas implementaciones antes de hacer el cutover.

### Objetivos

- Validar que la arquitectura V2 (event-driven/orchestrator) produce los mismos resultados que V1
- Detectar drift en: contenido renderizado, routing de proveedores, scheduling, payload
- Acumular evidencia para decidir cuándo hacer el cutover
- Sin impacto en el hot path de producción (fire-and-forget)

---

## 2. Arquitectura

```
V1 Action (legacy)
    │
    ├── 1. Send notification (real)
    │
    └── 2. enqueueShadowSeed()  ──►  shadow_notification_seeds (async)
              (fire-and-forget, timeout 100ms)       │
                                                     ▼
                                           ┌──────────────────┐
                                           │ Cron:            │
                                           │ runShadowBatch() │
                                           │ (cada 5 min)     │
                                           └────────┬─────────┘
                                                    │
                                           ┌────────▼─────────┐
                                           │ enrichV2Snapshot │
                                           │ (re-query DB)    │
                                           └────────┬─────────┘
                                                    │
                                           ┌────────▼─────────┐
                                           │ compareV1V2()    │
                                           │ drift score 0-100│
                                           └────────┬─────────┘
                                                    │
                                           ┌────────▼─────────┐
                                           │ shadow_notif.    │
                                           │ _logs            │
                                           └──────────────────┘
```

### 2.1 Phase 2A — Shadow Validation (general-purpose)

- Tabla: `shadow_validation_logs`
- Flujos cubiertos: `service:complete`, `appointment:cancel`
- Captura `state_before`, `state_after`, `legacy_result`, `orchestrator_result`
- Campos: `source_path`, `classification`, `shadow_mode`

### 2.2 Phase 2B — Shadow Notifications (V1 vs V2)

- Tablas: `shadow_notification_seeds`, `shadow_notification_logs`
- Enfoque específico en notificaciones (WhatsApp/Email)
- Seeder captura snapshot V1 al enviar
- Runner compara contra lo que V2 habría producido

---

## 3. Tipos de Drift Detectados

| Drift Type | Qué compara | Severidad típica |
|------------|-------------|------------------|
| `render_drift` | Contenido del mensaje renderizado | minor/major |
| `template_drift` | Template body entre V1 y V2 | minor |
| `routing_drift` | Proveedor/canal seleccionado | major |
| `payload_drift` | Variables del template (faltantes/extra) | minor |
| `scheduling_drift` | Timing de envío (±60s tolerancia) | minor |
| `orchestration_drift` | V1 envió pero V2 no habría producido nada | critical |

Cada comparación produce un **drift score** (0–100) y una **severidad** (`none`, `minor`, `major`, `critical`).

---

## 4. Modos de Operación

| Modo | Comportamiento |
|------|----------------|
| `observe_only` | (Default) Solo registra comparaciones. Sin impacto en producción. |
| `dual_write` | Ejecuta V2 en paralelo y registra ambos resultados. (Configurado, no implementado en runner) |
| `soft_enforce` | Loggea alertas cuando el drift excede umbrales. (Configurado, no implementado en runner) |

---

## 5. Configuración

### Variables de entorno

```env
# Feature flag maestro
SHADOW_MODE_ENABLED=true
SHADOW_MODE_FLOWS=service:complete,appointment:cancel
SHADOW_MODE=observe_only

# Notifications
SHADOW_NOTIFICATION_ENABLED=true
SHADOW_NOTIFICATION_MODE=observe_only
SHADOW_BATCH_SIZE=20
SHADOW_PROCESSING_TIMEOUT_MIN=5
SHADOW_SCHEDULING_TOLERANCE_SEC=60
```

### Cron endpoint

```http
POST /api/cron/shadow-notifications
Authorization: Bearer <CRON_SECRET>
```

Programado via cron-job.org o Pipedream (cada 5 min sugerido).

---

## 6. Base de Datos

### `shadow_validation_logs` (Phase 2A)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | Org |
| `appointment_id` | UUID | Cita |
| `command` | TEXT | Comando ejecutado |
| `correlation_id` | UUID | Trazabilidad |
| `legacy_result` | JSONB | Resultado V1 |
| `orchestrator_result` | JSONB | Resultado V2 |
| `drift_detected` | BOOLEAN | ¿Hay drift? |
| `drift_detail` | JSONB | Detalle |
| `state_before` / `state_after` | JSONB | Snapshots de estado |
| `shadow_mode` | TEXT | Modo al ejecutar |
| `source_path` | TEXT | Origen |
| `classification` | TEXT | Clasificación |

### `shadow_notification_seeds` (Phase 2B)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | Org |
| `appointment_id` | UUID | Cita |
| `v1_snapshot` | JSONB | Snapshot del envío V1 |
| `status` | TEXT | pending / processing / completed / failed |
| `claimed_at` | TIMESTAMPTZ | Procesamiento iniciado |
| `attempts` | INT | Reintentos |

### `shadow_notification_logs` (Phase 2B)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `seed_id` | UUID | FK → seeds |
| `v1_normalized` / `v2_normalized` | JSONB | Datos normalizados |
| `drift_types` | TEXT[] | Tipos de drift detectados |
| `drift_score` | INT | 0–100 |
| `severity` | TEXT | none / minor / major / critical |

---

## 7. Archivos del Sistema

| Archivo | Propósito |
|---------|-----------|
| `src/lib/notifications/shadow/seeder.ts` | Fire-and-forget snapshot (100ms timeout) |
| `src/lib/notifications/shadow/runner.ts` | Batch consumer, claims seeds, ejecuta comparación |
| `src/lib/notifications/shadow/comparator.ts` | Comparador V1 vs V2 con drift scoring |
| `src/lib/notifications/shadow/config.ts` | Feature flags desde environment |
| `src/lib/notifications/shadow/types.ts` | Tipos (DriftType, DriftSeverity, etc.) |
| `src/app/api/cron/shadow-notifications/route.ts` | Cron endpoint |
| `src/lib/shadow/index.ts` | Phase 2A entry (deprecated, stub) |

---

## 8. Cómo Interpretar los Resultados

```sql
-- Drift por severidad
SELECT severity, COUNT(*) as count
FROM shadow_notification_logs
GROUP BY severity;

-- Últimos drifts críticos
SELECT * FROM shadow_notification_logs
WHERE severity = 'critical'
ORDER BY created_at DESC
LIMIT 10;

-- Score promedio por drift type
SELECT unnest(drift_types) as drift_type, AVG(drift_score) as avg_score
FROM shadow_notification_logs
GROUP BY drift_type;
```

### Umbrales para acción

| Drift Score | Acción |
|-------------|--------|
| 0 | Sin drift — V1 y V2 equivalentes |
| 1–20 | Drift menor — monitorear |
| 21–50 | Drift significativo — investigar |
| 51–100 | Drift alto — bloqueante para cutover |

---

## 9. Relación con el Flujo Principal

Shadow Mode es **no-bloqueante y cero impacto** en el hot path:

- El **seeder** usa `AbortSignal.timeout(100)` y nunca se await — si el timeout expira, se ignora
- El **runner** corre offline vía cron, nunca toca producción
- Las tablas de shadow tienen RLS que permite SELECT a miembros de org, INSERT solo desde service role

El sistema está diseñado para **des-riesgar la migración V1→V2** validando continuamente que la nueva arquitectura produciría los mismos resultados.

---

## 10. Migración y Futuro

| Fase | Estado | Descripción |
|------|--------|-------------|
| 2A — Shadow general | ✅ Implementado | `shadow_validation_logs` para flujos core |
| 2B — Shadow notifications | ✅ Implementado | `shadow_notification_seeds` + comparator |
| `dual_write` mode | 🔄 Configurado, runner pendiente | Ejecutar V2 en paralelo |
| `soft_enforce` mode | 🔄 Configurado, runner pendiente | Alertas automáticas en drift alto |
| Cutover V2 | 📅 Planificado | Cuando drift sostenido sea 0 por N días |

---

## 11. Migraciones Relacionadas

| Migración | Descripción |
|-----------|-------------|
| `20260516000000_create_shadow_validation_logs.sql` | Phase 2A — tabla general |
| `20260517000000_add_source_path_to_shadow_logs.sql` | Columna source_path |
| `20260517000001_add_classification_to_shadow_logs.sql` | Columna classification |
| `20260523000000_create_shadow_notification_logs.sql` | Phase 2B — seeds + logs |
