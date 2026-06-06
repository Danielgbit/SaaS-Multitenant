# FIX-INV-003: Filtro de stock bajo no funciona

| Campo | Valor |
|-------|-------|
| **Prioridad** | 🔴 Crítica |
| **Sprint** | 1 |
| **Estimación** | 2-3 h • 3 SP |
| **Riesgo** | 🟡 Medio |
| **Archivos** | `src/actions/inventory/getInventoryItems.ts`<br>`supabase/migrations/20260611000001_fix_low_stock_rpc.sql` |
| **Test file** | `src/actions/inventory/__tests__/getInventoryItems.test.ts` |
| **Dependencias** | Ninguna |
| **Paralelo con** | FIX-001, FIX-002, FIX-004 |

## Descripción

```typescript
// Línea 51 de getInventoryItems.ts
query.filter('quantity', '<=', 'min_quantity')
```

El tercer parámetro `'min_quantity'` es un **string literal**, no una referencia a la columna. Supabase lo traduce como:

```sql
WHERE quantity <= 'min_quantity'  -- comparación número vs texto
```

en vez de:

```sql
WHERE quantity <= min_quantity    -- columna vs columna
```

La API `.filter()` de Supabase no soporta comparación columna-a-columna.

## Solución

### 1. Crear RPC `get_low_stock_items`

```sql
CREATE OR REPLACE FUNCTION get_low_stock_items(
  p_organization_id UUID,
  p_include_zero_min BOOLEAN DEFAULT false
)
RETURNS SETOF inventory_items
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM inventory_items
  WHERE organization_id = p_organization_id
    AND active = true
    AND quantity <= min_quantity
    AND (p_include_zero_min OR min_quantity > 0)
  ORDER BY (quantity::float / NULLIF(min_quantity, 1)::float) ASC;
$$;
```

**Comportamiento documentado:**
- `p_include_zero_min = false` (default): items con `min_quantity = 0` NO aparecen como low stock. Se asume que 0 = sin alerta configurada.
- `p_include_zero_min = true`: items con `min_quantity = 0` SÍ aparecen si `quantity = 0`.
- La división usa `NULLIF(min_quantity, 1)` para evitar división por cero con `min_quantity = 0` (se usa 1 como denominador seguro, el ratio es indicativo, no absoluto).

### 2. Modificar `getInventoryItems`

```typescript
if (filters?.lowStock) {
  const { data } = await supabase.rpc('get_low_stock_items', {
    p_organization_id: organizationId,
    p_include_zero_min: false,
  })
  return (data as InventoryItem[]) || []
}
```

### 3. Simplificar `getLowStockItems`

```typescript
export async function getLowStockItems(organizationId: string): Promise<InventoryItem[]> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_low_stock_items', {
    p_organization_id: organizationId,
    p_include_zero_min: false,
  })
  return (data as InventoryItem[]) || []
}
```

### 4. Regenerar tipos Supabase

```bash
npx supabase gen types typescript --linked > types/supabase.ts
```

## Casos de prueba (archivo: `getInventoryItems.test.ts`)

- Item con `quantity=2, min_quantity=5` → low stock `true`
- Item con `quantity=5, min_quantity=5` → low stock `true` (borde exacto)
- Item con `quantity=0, min_quantity=0` → low stock `false` (default, min_quantity=0 se excluye)
- Item con `quantity=0, min_quantity=0, includeZeroMin=true` → low stock `true`
- Item con `quantity=10, min_quantity=5` → low stock `false`
- Filtro sin `lowStock: true` → retorna todos los items activos
- Organización sin items → array vacío

## Criterios de aceptación

- [ ] RPC retorna solo items donde `quantity <= min_quantity` y `active = true`
- [ ] `min_quantity = 0` excluido por defecto (comportamiento documentado)
- [ ] `getInventoryItems(orgId, { lowStock: true })` funciona correctamente
- [ ] `getLowStockItems(orgId)` funciona correctamente
- [ ] `LowStockAlertCard` en dashboard muestra items correctos
- [ ] Migración SQL es idempotente
- [ ] Tipos regenerados sin errores

## Orden de commits

```
1. feat(db): create get_low_stock_items RPC with edge case handling
2. fix: use RPC in getInventoryItems and getLowStockItems
3. chore: regenerate supabase types
4. test: add getInventoryItems tests
```
