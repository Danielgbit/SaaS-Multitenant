# FIX-INV-002: Formulario de edición no carga datos del producto

| Campo | Valor |
|-------|-------|
| **Prioridad** | 🔴 Crítica |
| **Sprint** | 1 |
| **Estimación** | 2-4 h • 3 SP |
| **Riesgo** | 🟡 Medio |
| **Archivos** | `src/app/(dashboard)/inventario/InventoryFormModal.tsx` |
| **Test file** | `src/app/(dashboard)/inventario/__tests__/InventoryFormModal.test.tsx` |
| **Dependencias** | Ninguna |
| **Paralelo con** | FIX-001, FIX-003, FIX-004 |

## Descripción

El estado `formData` se inicializa con valores por defecto (`name: ''`, `quantity: '0'`, etc.) pero **nunca se sincroniza con el prop `item`** al abrir el modal para editar.

```typescript
const [formData, setFormData] = useState({
  name: '',       // Siempre vacío
  quantity: '0',  // Siempre 0
  // ...
})
```

No hay `useEffect` que actualice `formData` cuando `item` cambia. El componente recibe `item` como prop pero no lo usa para precargar campos.

## Solución

### 1. Crear `mapItemToFormData` (único punto de transformación)

```typescript
type FormDataState = {
  name: string
  sku: string
  description: string
  category: string
  quantity: string
  min_quantity: string
  price: string
  cost_price: string
  unit: string
}

const defaultFormData = (): FormDataState => ({
  name: '', sku: '', description: '', category: '',
  quantity: '0', min_quantity: '5', price: '', cost_price: '', unit: 'pieza',
})

const mapItemToFormData = (item: InventoryItem): FormDataState => ({
  name: item.name,
  sku: item.sku ?? '',
  description: item.description ?? '',
  category: item.category ?? '',
  quantity: String(item.quantity),
  min_quantity: String(item.min_quantity),
  price: item.price ? String(item.price) : '',
  cost_price: item.cost_price ? String(item.cost_price) : '',
  unit: item.unit,
})
```

**Regla:** Toda transformación InventoryItem → FormData debe pasar exclusivamente por `mapItemToFormData`. No se permiten mapeos dispersos en el componente.

### 2. Agregar `useEffect` sincronizador

```typescript
useEffect(() => {
  setFormData(item ? mapItemToFormData(item) : defaultFormData())
}, [item])
```

### 3. Verificar key prop en InventoryClient

La línea 630 ya tiene `key={editingItem?.id ?? 'new'}` que fuerza remontaje cuando cambia el item editado. El `useEffect` se ejecutará correctamente.

## Casos de prueba (archivo: `InventoryFormModal.test.tsx`)

- Modal en modo creación → todos los campos en blanco/default
- Modal en modo edición con producto → campos precargados
- Modal se cierra y se abre con otro producto → campos del segundo producto
- `mapItemToFormData` es pura: mismo input produce mismo output
- `mapItemToFormData(null)` → objeto con valores default (si se expone)

## Criterios de aceptación

- [ ] Al hacer clic en "Editar" en cualquier producto, el modal muestra todos los campos con los valores actuales
- [ ] El modal de creación muestra campos vacíos (sin contaminación del producto anterior)
- [ ] No hay loops de renderizado ni warnings de React
- [ ] `mapItemToFormData` es la **única función** que transforma datos del modelo al formulario
- [ ] Se puede guardar la edición correctamente
- [ ] Tests nuevos pasan

## Orden de commits

```
1. refactor: extract mapItemToFormData as single source of truth
2. fix: sync form state with item prop via useEffect
3. test: add InventoryFormModal tests
```
