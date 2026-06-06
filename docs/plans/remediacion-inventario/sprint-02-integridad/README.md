# Sprint 2: Integridad y Testing

**Depende de:** Sprint 1 (especialmente FIX-005 que reutiliza `decrementMultipleItemsOrRollback`)
**Duración estimada:** 5-8 días hábiles

## Tareas planificadas

| ID | Tarea | Archivos | SP |
|----|-------|----------|----|
| FIX-006 | Rollback transaccional en recordInventoryPurchase/consumeInventory | `src/actions/inventory/recordInventoryPurchase.ts`, `consumeInventory.ts` | 8 |
| FIX-007 | Regenerar tipos Supabase (8 columnas faltantes en divergences) | `types/supabase.ts` | 1 |
| FIX-008 | Cobertura de tests: Server Actions de inventario | `src/actions/inventory/__tests__/*.test.ts` | 8 |
| FIX-009 | Reemplazar `router.refresh()` con actualizaciones optimistas | `InventoryClient.tsx` | 5 |
| FIX-010 | Pipeline CI con validación de tipos + tests | `.github/workflows/` | 3 |

## Notas

- FIX-006 es la tarea más crítica: crear RPC que envuelva stock + movimiento + caja en una transacción SQL
- FIX-007 debe ejecutarse contra BD en vivo con `--linked`
- FIX-008 priorizar `recordInventoryPurchase` y `consumeInventory` por su impacto en data integrity
