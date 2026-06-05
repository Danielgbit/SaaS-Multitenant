# Component Inventory — Sprint 0

**Proyecto:** SaaS (Next.js 16, Supabase, Tailwind v4)
**Fecha:** 2026-06-05
**Método:** Análisis estático de archivos .tsx en `src/`

---

## Resumen

| Componente | Estado | Usos | Prioridad Fase B |
|-----------|:------:|:----:|:----------------:|
| Button | ❌ No existe | 545 raw | Alta |
| Input | ❌ No existe | 175 raw | Media |
| Select | ❌ No existe | 27 raw | Baja |
| DatePicker | ❌ No existe | 10 raw | Baja |
| Tooltip | ✅ Existe (uso mínimo) | 6 comp / 88 manual | Baja |
| Modal genérico | ❌ No existe (solo ConfirmModal) | 53 inline | Alta |
| ConfirmModal | ✅ Existe | 11 usos | — |
| Card | ✅ Existe | 30 usos | — |
| Badge | ✅ Existe | 29 usos | — |
| Spinner | ✅ Existe | 111 usos | — |
| Skeleton | ✅ Existe | 40 usos | — |
| EmptyState | ✅ Existe | 12 usos | — |
| ErrorFallback | ✅ Existe | 13 usos | — |
| MetricCard | ✅ Existe | 25 usos | — |
| PageContainer | ✅ Existe | 5 usos | — |
| PasswordInput | ✅ Wrapper existe | 7 usos | — |
| SearchInput | ✅ Wrapper existe | 3 usos | — |

---

## 1. Buttons

### Conteo total

| Tipo | Cantidad | % del total |
|------|:--------:|:-----------:|
| Raw `<button>` | 545 | 100% |
| Component `<Button />` | 0 | 0% |
| Component `<IconButton />` | 0 | 0% |
| Component `<ActionButton />` | 0 | 0% |

### Variantes detectadas

| Variante | Cantidad | Complejidad migración | Criterio de detección |
|----------|:--------:|:---------------------:|-----------------------|
| primary | 5 | 🟢 Baja | `bg-primary`, `bg-blue-*`, `bg-teal-*`, `className` con primary |
| secondary | 530 | 🟢 Baja | Default: cualquier button sin variante específica |
| danger | 6 | 🟢 Baja | `bg-red`, `bg-error`, `text-red`, `danger` |
| link | 1 | 🟢 Baja | `underline` |
| custom | 3 | 🔴 Alta | `cn()`, `cva()`, `variant` prop (lógica condicional) |

### Accesibilidad

| Métrica | Valor | 
|---------|:-----:|
| icon-only (solo icono, sin texto) | **273** |
| icon-only sin `aria-label` | **255** |

> ⚠️ **255 botones icon-only sin `aria-label`** es el hallazgo de accesibilidad más grande del proyecto.

### Distribución

El 97% de los botones son "secondary" — sin variante específica detectable por clase. Esto sugiere que la mayoría usa estilos genéricos (borde, fondo sutil) y pocos tienen variantes explícitas como `primary` o `danger`.

---

## 2. Inputs

### Conteo total

| Tipo | Cantidad |
|------|:--------:|
| Raw `<input>` | 175 |
| Component `<Input />` | 0 |
| `<SearchInput />` (wrapper) | 3 |
| `<PasswordInput />` (wrapper) | 7 |
| `type="date"` | 10 |

### Accesibilidad

| Métrica | Valor |
|---------|:-----:|
| Inputs sin `<label>` asociado detectable | **158** |

> ⚠️ 158 inputs donde no se detectó `htmlFor` o `label for` en los 200 caracteres anteriores. Muchos pueden estar envueltos en un `<label>` (patrón común), pero la mayoría probablemente sí necesitan revisión.

---

## 3. Modals

### Conteo total

| Tipo | Cantidad |
|------|:--------:|
| Inline modals (`fixed inset-0`) | 53 |
| `role="dialog"` presente | 18 |
| Sin `role="dialog"` | **34** |
| Focus trap / keyboard handling | **0** |
| `<ConfirmModal />` usos | 11 |

### Clasificación por propósito (estimada)

| Tipo | % estimado | Reemplazable por |
|------|:----------:|:----------------:|
| Confirmación | ~60% | `ConfirmModal` existente |
| Formulario | ~25% | Nuevo `Modal` base |
| Detalle/info | ~15% | Nuevo `Modal` base |

---

## 4. Selects

| Tipo | Cantidad |
|------|:--------:|
| Raw `<select>` | 27 |
| Component `<Select />` | 0 |

---

## 5. Tooltips

| Tipo | Cantidad |
|------|:--------:|
| Manual (`title`, `onMouseEnter`) | 88 |
| Component `<Tooltip />` | **6** |

> ✅ **Tooltip component EXISTS** con 6 usos. No es un componente faltante, solo tiene baja adopción (6 vs 88 manuales).

---

## 6. Librerías UI instaladas

| Librería | Estado | Uso |
|----------|:------:|-----|
| `framer-motion` | ✅ Instalada | Animaciones en sidebar, modales, notificaciones |
| `sonner` | ✅ Instalada | Sistema de toasts |
| `@radix-ui/*` | ❌ No instalada | — |
| `@react-aria/*` | ❌ No instalada | — |
| `shadcn/ui` | ❌ No instalada | — |

---

## 7. Priorización para Fase B

| Prioridad | Componente | Razón |
|:---------:|-----------|-------|
| 🔴 Alta | **Button** | 545 usos, 0 adopción, 255 icon-only sin `aria-label` |
| 🔴 Alta | **Modal** | 53 modales inline, 34 sin `role="dialog"`, 0 focus trap |
| 🟡 Media | **Input** | 175 usos, wrappers parciales existen (SearchInput, PasswordInput) |
| 🟢 Baja | **Tooltip** | Componente ya existe (6 usos), migrar 88 manuales |
| 🟢 Baja | **Select** | 27 usos, variante única |
| 🟢 Baja | **DatePicker** | 10 usos, `type="date"` nativo |

---

## 8. Quick Wins de Accesibilidad (pre-Fase B)

| ID | Problema | Instancias | Esfuerzo |
|:--|----------|:----------:|:--------:|
| A11Y-01 | Icon-only buttons sin `aria-label` | **255** | 🔴 Alto (pero mecánico) |
| A11Y-02 | Modales sin `role="dialog"` | **34** | 🟢 Bajo (agregar atributo) |
| A11Y-03 | Modales sin focus trap | **53** | 🟡 Medio |
| A11Y-04 | Inputs sin `<label>` visible | **158** | 🟡 Medio (revisar cada caso) |

---

## 9. Decisión para Fase B

Basado en los datos:

1. **Button** es la prioridad más clara: 545 usos, 0% adopción, 255 problemas de accesibilidad
2. **Modal** es la segunda prioridad: 53 modales inline, 0% con focus trap, 64% sin `role="dialog"`
3. **Input** tiene wrappers parciales que pueden servir como base
4. **Tooltip, Select, DatePicker** tienen bajo volumen y pueden esperar

### Recomendación

**Fase B** debería construir únicamente:
1. `Button` con variantes (primary, secondary, ghost, danger) + manejo de icon-only
2. `Modal` con overlay, focus trap, escape-to-close

Y **diferir** Input, Select, Tooltip, DatePicker para sprints posteriores si el volumen lo justifica.
