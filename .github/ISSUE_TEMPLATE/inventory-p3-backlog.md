---
Estos son borradores de issues P3. Crearlos manualmente en:
https://github.com/Danielgbit/SaaS-Multitenant/issues/new
---

### Issue 1: H5/H6/H12 — Migrar interfaces manuales a Database Row types

**Labels:** `tech-debt`, `inventory`, `P3`

**Descripción:**

Tres interfaces manuales duplican el schema de Supabase y deben migrarse a `Database["public"]["Tables"]["table"]["Row"]`:

| Archivo | Interfaz | Líneas |
|---|---|---|
| `src/actions/inventory/getInventoryItems.ts` | `InventoryItem` | 7-22 |
| `src/actions/inventory/getInventoryMovements.ts` | `InventoryMovement` | 7-22 |
| `src/lib/inventory/inventory-movement.ts` | `InventoryMovementInput` | 6-19 |

**Bloqueador:** Requiere auditoría de consumidores para determinar dependencias y compatibilidad de propiedades.

**Referencia:** Commit `9bcb39e` (Sprint 4, deferred items H5/H6/H12)

---

### Issue 2: O1-O5 — Eliminar console.log en Server Actions de inventario

**Labels:** `tech-debt`, `inventory`, `P3`

**Descripción:**

9 llamadas a `console.log` en producción:

| Archivo | Líneas |
|---|---|
| `src/actions/inventory/createInventoryItem.ts` | 46, 51, 93 |
| `src/actions/inventory/deleteInventoryItem.ts` | 19, 24, 50 |
| `src/actions/inventory/updateInventoryItem.ts` | 28, 33, 67 |

**Nota:** Non-blocking. Aplicar Boy Scout Rule cuando se toquen esos archivos por otra razón.

---

### Issue 3: Investigar fallo preexistente en resolveDivergence.test.ts

**Labels:** `bug`, `inventory`, `P3`

**Descripción:**

El archivo `src/actions/inventory/__tests__/resolveDivergence.test.ts` estaba fallando (preexistente a Sprint 4). Fue resuelto en commit `2c3a3c6` que agregó 5 tests, pero mantener visibility por si hay otros tests frágiles en el módulo.

**Estado actual:** 44/44 test files, 392/392 tests pasando. ✅
