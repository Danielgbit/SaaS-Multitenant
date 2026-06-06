# FIX-INV-004: Acciones invisibles en dispositivos táctiles

| Campo | Valor |
|-------|-------|
| **Prioridad** | 🟠 Alta |
| **Sprint** | 1 |
| **Estimación** | 1-2 h • 2 SP |
| **Riesgo** | 🟢 Bajo |
| **Archivos** | `src/app/(dashboard)/inventario/InventoryListItem.tsx` |
| **Test file** | `src/app/(dashboard)/inventario/__tests__/InventoryListItem.test.tsx` |
| **Dependencias** | Ninguna |
| **Paralelo con** | FIX-001, FIX-002, FIX-003 |

## Descripción

```typescript
// Línea 105 de InventoryListItem.tsx
style={{ opacity: isHovered ? 1 : 0 }}
```

En dispositivos sin hover (touch: tablets, móviles, pantallas táctiles Windows), `isHovered` nunca es `true`, por lo que los botones de **Editar, Historial y Eliminar** quedan permanentemente invisibles (opacity: 0).

El usuario no puede realizar ninguna acción sobre los productos en la vista de lista.

## Solución

Reemplazar la opacidad condicional con un enfoque responsive usando Tailwind:

```tsx
// En el contenedor de acciones (reemplazar línea 104-105)
className="flex items-center gap-1 shrink-0 transition-opacity duration-200
           opacity-100 md:opacity-0 md:group-hover:opacity-100
           max-md:opacity-100 focus-within:opacity-100"
```

Y asegurar que el `<li>` padre tenga `className="group"` (ya está presente como clase `cursor-default`, verificar que `group` esté incluida).

**Explicación de clases:**
- `opacity-100`: siempre visible por defecto (mobile-first)
- `md:opacity-0`: en desktop (>768px), oculto por defecto
- `md:group-hover:opacity-100`: en desktop, visible al hover sobre la fila
- `max-md:opacity-100`: explícitamente visible en mobile (redundante con mobile-first, pero clarifica intención)
- `focus-within:opacity-100`: visible cuando un botón hijo recibe foco por teclado

## Casos de prueba (archivo: `InventoryListItem.test.tsx`)

- Viewport < 768px: botones visibles (computed `opacity = 1`)
- Viewport ≥ 768px sin hover: botones `opacity = 0`
- Viewport ≥ 768px con hover (mouse): botones `opacity = 1`
- Viewport ≥ 768px con teclado (Tab): botón focalizado visible (`focus-within`)
- Botón "Editar" tiene `aria-label` presente
- Botón "Historial" tiene `aria-label` presente
- Botón "Eliminar" tiene `aria-label` presente

## Criterios de aceptación

- [ ] En mobile/tablet (<768px), los botones de acción son visibles siempre
- [ ] En desktop, los botones aparecen al hacer hover sobre la fila
- [ ] Los botones son accesibles por teclado (Tab) y visibles al recibir foco
- [ ] No hay regresión en la vista de lista para desktop con mouse
- [ ] `aria-label` presente en los 3 botones de acción

## Orden de commits

```
1. fix: show action buttons on touch devices and keyboard focus
2. test: add InventoryListItem tests for touch visibility
```
