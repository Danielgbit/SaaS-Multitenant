# FIX-INV-005: Venta sin validar stock disponible

| Campo | Valor |
|-------|-------|
| **Prioridad** | 🟠 Alta (sube a 🔴 Alto por riesgo transaccional) |
| **Sprint** | 1 |
| **Estimación** | 6-8 h • 8 SP |
| **Riesgo** | 🔴 Alto |
| **Archivos** | `src/components/dashboard/clients/SaleModal.tsx`<br>`src/actions/clientAccounts/recordTransaction.ts`<br>`src/actions/inventory/recordInventoryPurchase.ts` (referencia) |
| **Test file** | `src/actions/clientAccounts/__tests__/recordTransaction.test.ts` (ampliar existente) |
| **Dependencias** | FIX-002, FIX-004 |
| **Paralelo con** | Ninguna (depende de FIX-002 + FIX-004) |

## Descripción

`SaleModal.tsx` permite:
1. Seleccionar productos con `stock = 0` (no hay validación visual)
2. Incrementar cantidad más allá del stock disponible (botón `+` sin límite)

En el servidor, `recordTransaction.ts` procesa la venta pero el decremento de stock puede fallar (`insufficient_stock`) después de que la venta ya se registró, dejando datos inconsistentes.

**Riesgo real:** La validación pre-vuelo en JS no es suficiente para eliminar race conditions. Se necesita atomicidad a nivel base de datos.

## Solución — Tres capas de defensa

### Capa 1: Frontend (`SaleModal.tsx`)

```typescript
// Deshabilitar productos sin stock
{products.map(product => {
  const hasStock = product.quantity > 0
  return (
    <button
      key={product.id}
      type="button"
      onClick={() => hasStock && addProduct(product)}
      disabled={!hasStock}
      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors
        ${!hasStock ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        borderColor: COLORS.border,
        backgroundColor: !hasStock ? COLORS.surfaceSubtle : COLORS.surface,
      }}
    >
      <div className="text-left">
        <p className="font-medium text-sm" style={{ color: COLORS.textPrimary }}>
          {product.name}
        </p>
        <p className="text-xs" style={{ color: !hasStock ? COLORS.error : COLORS.textMuted }}>
          {!hasStock ? 'Sin stock' : `Stock: ${product.quantity}`}
        </p>
      </div>
      {!hasStock ? (
        <AlertTriangle className="w-4 h-4" style={{ color: COLORS.error }} />
      ) : (
        <Plus className="w-5 h-5" style={{ color: COLORS.primary }} />
      )}
    </button>
  )
})}

// Limitar cantidad (en updateQuantity, línea 39-42)
const updateQuantity = (productId: string, quantity: number) => {
  if (quantity <= 0) { removeProduct(productId); return }
  const product = products.find(p => p.id === productId)
  if (product && quantity > product.quantity) return // no exceder stock
  setSelectedProducts(selectedProducts.map(p =>
    p.productId === productId ? { ...p, quantity } : p
  ))
}
```

### Capa 2: Servidor con atomicidad real

**No crear nueva RPC.** Reutilizar la función existente `decrementMultipleItemsOrRollback` en `src/lib/inventory/batch-decrement.ts`.

Esta función ya implementa:
- Descuento secuencial vía RPC `inventory_decrement_stock`
- **Rollback automático**: si el item N falla, reincrementa los items 1..N-1
- Manejo de errores: retorna `success: false` + resultados parciales

```typescript
// En recordTransaction.ts, antes de registrar la venta:
import { decrementMultipleItemsOrRollback } from '@/lib/inventory/batch-decrement'

const stockResult = await decrementMultipleItemsOrRollback(
  input.products.map(p => ({
    item_id: p.inventory_item_id,
    quantity: p.quantity,
  })),
  organizationId,
  'client_sale'
)

if (!stockResult.success) {
  return {
    success: false,
    error: stockResult.error || 'Error al procesar stock.',
  }
}

// Solo si el descuento fue exitoso, registrar la venta y movimientos
```

### Capa 3: Registro de movimiento de inventario

Después de la venta exitosa, registrar los movimientos:

```typescript
for (const result of stockResult.results) {
  if (result.success) {
    await recordInventoryMovement({
      inventoryItemId: result.item_id,
      organizationId,
      movementType: 'sale',
      quantityChange: -normalizedItems.find(i => i.item_id === result.item_id)?.quantity ?? 0,
      quantityBefore: result.quantity_before!,
      quantityAfter: result.quantity_after!,
      createdBy: userId,
      // referenceType: 'transaction',
      // referenceId: transactionId,
    })
  }
}
```

## Casos de prueba (archivo: `recordTransaction.test.ts` — ampliar)

- Venta con todos los items con stock suficiente → éxito, stock decrementado
- Venta con item sin stock (quantity = 0) → error, ningún item se descuenta
- Venta con item con stock insuficiente (quantity > available) → error + rollback
- Venta con item inexistente → error + rollback
- Venta con 3 items donde el 2do falla → items 1 y 2 reincrementados
- Race condition: agotar stock entre validación y descuento → la RPC lo detecta
- Venta exitosa: movimiento de inventario registrado correctamente

## Criterios de aceptación

- [ ] Frontend: productos sin stock se muestran deshabilitados con indicador visual
- [ ] Frontend: botón `+` no permite exceder stock disponible
- [ ] Servidor: `decrementMultipleItemsOrRollback` se usa antes de registrar la venta
- [ ] Si el descuento falla, la venta NO se registra y se retorna error específico
- [ ] Si el descuento falla a mitad de camino, el stock se restaura (rollback)
- [ ] El mensaje de error identifica qué producto falló y stock disponible
- [ ] Movimientos de inventario se registran para cada producto de la venta
- [ ] Tests existentes de `recordTransaction` no se rompen

## Orden de commits

```
1. feat(ui): add stock validation and visual feedback in SaleModal
2. feat(api): use decrementMultipleItemsOrRollback for atomic stock check
3. feat(api): record inventory movements after successful sale
4. test: add stock validation tests in recordTransaction.test.ts
```
