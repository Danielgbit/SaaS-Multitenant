# Sprint 5 — UX/UI Polish + Accesibilidad

**Commit**: `78c9c0a` (pusheado a `gitlab:main`)
**Fixes**: 16
**Archivos**: 24 (+1240/-626)
**Tests nuevos**: 32 (100% pass)
**TS errors**: 0 nuevos (5 pre-existentes)

## Fixes aplicados

| ID | Descripción | Archivos |
|---|---|---|
| FIX-MF003 | Refactor useConfirmClose con ConfirmModal UI | hook + 3 consumers + test |
| FIX-MF004 | Eliminar <style jsx> huérfano | InventoryFormModal |
| FIX-F001+F003 | Form controlado + dirty detection + id/htmlFor | InventoryFormModal + test |
| FIX-F004 | aria-label en input de búsqueda | InventoryClient |
| FIX-MF001+002+006 | aria-pressed filters/toggle + aria-live resultados | InventoryClient |
| FIX-F005 | Hydration-safe view mode persistence | useHydratedValue hook + test |
| FIX-F007 | Dropdown primitive con ARIA + keyboard | Dropdown.tsx + test |
| FIX-F002 | Hex focus-ring → borderFocus token | InventoryFormModal |
| FIX-MF008+009 | Hoist toLowerCase + memoize category counts | InventoryClient |
| FIX-MF007 | Dedupe computeInventoryStats helper | helper + 2 consumers + test |
| FIX-F019 | Cleanup timeouts DeleteInventoryModal | DeleteInventoryModal |
| FIX-F042 | Remove isDeleting state InventoryCard | InventoryCard |
| FINDING-008 | Hex bg-slate-* → COLORS.surfaceHover | InventoryClient + InventoryMovementModal |
| FINDING-036 | prefers-reduced-motion extendido | globals.css |
| COND-001 | z.preprocess emptyToUndefined | createInventoryItem + updateInventoryItem |
| — | Hydration fix ThemeToggle/Header | ThemeToggle, Header |

## Resultados finales

- `npx tsc --noEmit`: 0 errores Sprint 5
- `npx vitest run src/actions/inventory`: 68/68 pass
- Tests nuevos: 32/32 pass (useHydratedValue:4, useConfirmClose:5, inventory-stats:5, Dropdown:14, InventoryFormModal:4)
