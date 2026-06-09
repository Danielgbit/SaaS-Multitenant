# Sprint 3: Calidad y UX

**Depende de:** Sprint 1 (recomendado, no blocking)
**Duración estimada:** 5-10 días hábiles

## Tareas planificadas

| ID | Tarea | Archivos | SP |
|----|-------|----------|----|
| FIX-011 | Refactor completo de SaleModal (design system + dark mode) | `SaleModal.tsx` | 5 |
| FIX-012 | Accesibilidad: focus trap en modales, aria-labels | `InventoryFormModal`, `DeleteInventoryModal`, `InventoryMovementModal` | 5 |
| FIX-013 | Migrar InventoryFormModal a `useActionState` | `InventoryFormModal.tsx` | 3 |
| FIX-014 | Auditoría de dark mode en componentes de inventario | Todos los componentes | 3 |
| FIX-015 | Eliminar carga artificial (spinner falso en InventoryClient) | `InventoryClient.tsx` | 2 |
| FIX-016 | Confirmación al descartar formularios con datos | `InventoryFormModal.tsx` | 2 |
| FIX-017 | Reemplazar `window.location.reload()` en MetricsClient | `MetricsClient.tsx` | 1 |
| FIX-018 | Limpieza técnica: `as any`, console.log, tipos duplicados | Múltiples archivos | 3 |
| FIX-019 | Paginación en historial de movimientos | `InventoryMovementModal.tsx` | 3 |
| FIX-020 | Refactor de tooltips para soporte táctil | `InventoryFormModal.tsx` | 1 |
| FIX-021 | Loading.tsx para página de métricas | `metrics/loading.tsx` | 1 |
| FIX-022 | Extraer useDebounce a hook compartido | `CashTimeline.tsx` → `src/hooks/useDebounce.ts` | 1 |

## Notas

- FIX-011 y FIX-012 pueden ejecutarse en paralelo
- FIX-015 y FIX-017 son quick wins (< 30 min cada uno)
- FIX-018 aplica Boy Scout Rule en todos los archivos tocados
