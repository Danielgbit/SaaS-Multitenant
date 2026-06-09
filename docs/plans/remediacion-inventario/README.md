# Plan de Remediación — Módulo de Inventario

## Resumen Ejecutivo

Auditoría completa del módulo de Inventario realizada el 2026-06-06.
**34 hallazgos** distribuidos en 3 Críticos, 5 Altos, 10 Medios y 16 Bajos.

Este plan organiza la remediación en 3 sprints, priorizando bloqueantes y riesgos operativos.

## Priorización

| Prioridad | Descripción |
|-----------|-------------|
| 🔴 Crítica | Bugs que bloquean la app o inutilizan funcionalidad core |
| 🟠 Alta | Riesgo operativo (inconsistencia de datos, UX inaccesible) |
| 🟡 Media | Deuda técnica, calidad, testing |
| 🔵 Baja | Mejora continua, código limpio |

## Dependencias entre Sprints

```mermaid
graph LR
    Sprint1 --> Sprint2
    Sprint2 --> Sprint3
    Sprint1 -.-> Sprint3
```

| Sprint | Depende de | Puede ejecutarse en paralelo con |
|--------|------------|----------------------------------|
| **Sprint 1** Bloqueantes | — | — |
| **Sprint 2** Integridad | Sprint 1 (FIX-005 depende de FIX-002) | — |
| **Sprint 3** Calidad | Sprint 1 (recomendado) | Sprint 2 (parcial) |

## Estado de Tareas

| ID | Tarea | Sprint | Estado | Responsable |
|----|-------|--------|--------|-------------|
| FIX-001 | PurgeModal syntax error | 1 | ✅ Completado | — |
| FIX-002 | Formulario edición no carga datos | 1 | ✅ Completado | — |
| FIX-003 | Filtro lowStock roto | 1 | ✅ Completado | — |
| FIX-004 | Acciones invisibles en touch | 1 | ✅ Completado | — |
| FIX-005 | Venta sin validar stock (atómico) | 1 | ✅ Completado | — |
| FIX-006 | Rollback transaccional recordInventoryPurchase/consumeInventory | 2 | ⬜ Pendiente | — |
| FIX-007 | Regenerar tipos Supabase | 2 | ⬜ Pendiente | — |
| FIX-008 | Tests Server Actions de inventario | 2 | ⬜ Pendiente | — |
| FIX-009 | router.refresh() → actualizaciones optimistas | 2 | ⬜ Pendiente | — |
| FIX-010 | Pipeline CI | 2 | ✅ Completado | — |

## Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Race condition en ventas simultáneas | Media | Alto | RPC atómico con UPDATE + WHERE guard |
| Inconsistencia stock vs caja | Media | Alto | Transacción/compensación en recordPurchase/consume |
| Error al regenerar tipos Supabase | Baja | Medio | Validar con `npm run typecheck` |

## Convenios

- Todo PR debe incluir test que reproduzca el bug antes de la fix
- Toda transformación InventoryItem → FormData debe vivir en `mapItemToFormData`
- No reintroducir `as any` en código modificado (Boy Scout Rule)
- Regenerar `types/supabase.ts` después de migraciones SQL
