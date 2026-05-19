# Confirmations QA — Execution Plan

## Contexto del Agente Ejecutor

### Qué se hizo
Se aplicaron migraciones conservadoras en 7 archivos del módulo Confirmations:
- `ConfirmationsPanel.tsx`: spinners → `<Skeleton>`, empty → `<EmptyState>`
- `NotificationCenter.tsx`: `SkeletonItem` local → `<Skeleton>`, `EmptyState` local → `<EmptyState>`, added `useThemeColors()`
- `WalkinForm.tsx`: empty state → `<EmptyState>`, duration badge → `<Badge>`
- `EmployeeConfirmations.tsx`: decorative hover → Tailwind `hover:shadow-lg hover:-translate-y-0.5`, type badge → `<Badge>`
- `ReceptionConfirmations.tsx`: Walk-in/Programada badge → `<Badge>`, status badge → `<Badge>`
- `MarkCompletedModal.tsx`: 20+ colores Tailwind hardcodeados → `useThemeColors()` tokens
- `AdjustPriceModal.tsx`: 15+ colores Tailwind hardcodeados → `useThemeColors()` tokens

### Archivos de referencia (NO modificar)
- `src/components/ui/Skeleton.tsx` — Skeleton primitive
- `src/components/ui/EmptyState.tsx` — EmptyState primitive
- `src/components/ui/Badge.tsx` — Badge primitive (variants: success/warning/error/info/primary/gold/neutral)
- `src/hooks/useThemeColors.ts` — Theme hook (48 color tokens)
- `src/components/ui/index.ts` — Barrel export

### Reglas de oro
- **READ-ONLY para archivos de la app** durante QA (solo lectura + verificación)
- **NO modificar lógica de negocio**, realtime, orchestration, Server Actions
- **NO crear nuevos componentes**, wrappers, o abstracciones
- El único archivo que SÍ se crea al final es `docs/CONFIRMATIONS_QA_REPORT.md`

---

## FASE 1 — Smoke Test (Verificación de Código)

### Objetivo
Confirmar que los archivos migrados compilan sin errores TypeScript y que las migraciones están presentes.

### Paso 1.1: Verificar imports en cada archivo

**ConfirmationsPanel.tsx** (`src/components/dashboard/ConfirmationsPanel.tsx`):
- [ ] Línea 8: `import { useThemeColors } from '@/hooks/useThemeColors'` presente
- [ ] Línea 9: `import { Skeleton } from '@/components/ui/Skeleton'` presente
- [ ] Línea 10: `import { EmptyState } from '@/components/ui/EmptyState'` presente
- [ ] Línea 130: `const COLORS = useThemeColors()` presente

**NotificationCenter.tsx** (`src/components/dashboard/NotificationCenter.tsx`):
- [ ] Línea 15: `import { Skeleton } from '@/components/ui/Skeleton'` presente
- [ ] Línea 16: `import { EmptyState } from '@/components/ui/EmptyState'` presente
- [ ] Línea 17: `import { useThemeColors } from '@/hooks/useThemeColors'` presente
- [ ] Línea 197: `const COLORS = useThemeColors()` presente
- [ ] NO existe función/componente local llamado `SkeletonItem`
- [ ] NO existe función/componente local llamado `EmptyState` (como función)

**WalkinForm.tsx** (`src/app/(dashboard)/confirmations/walkin/WalkinForm.tsx`):
- [ ] Línea 11: `import { useThemeColors } from '@/hooks/useThemeColors'` presente
- [ ] Línea 15: `import { EmptyState } from '@/components/ui/EmptyState'` presente
- [ ] Línea 16: `import { Badge } from '@/components/ui/Badge'` presente
- [ ] Línea 50: `const COLORS = useThemeColors()` presente

**EmployeeConfirmations.tsx** (`src/app/(dashboard)/confirmations/EmployeeConfirmations.tsx`):
- [ ] Línea 10: `import { useThemeColors } from '@/hooks/useThemeColors'` presente
- [ ] Línea 14: `import { Badge } from '@/components/ui/Badge'` presente
- [ ] Línea 33: `const COLORS = useThemeColors()` presente
- [ ] NO existen handlers `onMouseEnter`/`onMouseLeave` decorativos (solo el guard `!isSuccess` en hover via Tailwind class)
- [ ] Línea 212: `className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"` presente (Tailwind reemplazó handlers)

**ReceptionConfirmations.tsx** (`src/app/(dashboard)/confirmations/ReceptionConfirmations.tsx`):
- [ ] Línea 11: `import { useThemeColors } from '@/hooks/useThemeColors'` presente
- [ ] Línea 14: `import { Badge } from '@/components/ui/Badge'` presente
- [ ] Línea 72: `const COLORS = useThemeColors()` presente
- [ ] Línea 343: `<Badge variant={conf.confirmation_type === 'walkin' ? 'warning' : 'primary'} size="sm">` presente
- [ ] Línea 378-383: `<Badge variant={isPending ? 'primary' : isComplete ? 'success' : isNoShow ? 'error' : 'neutral'} size="md">` presente
- [ ] Línea 38-44: función `getTimeUrgency()` PRESERVADA (NO migrar — es lógica de dominio)
- [ ] Línea 321-330: handlers `onMouseEnter`/`onMouseLeave` PRESERVADOS con guard `!isSuccess` (NO migrar — afecta guard)

**MarkCompletedModal.tsx** (`src/components/dashboard/MarkCompletedModal.tsx`):
- [ ] Línea 8: `import { useThemeColors } from '@/hooks/useThemeColors'` presente
- [ ] Línea 33: `const COLORS = useThemeColors()` presente
- [ ] NO existen colores Tailwind hardcodeados como `bg-white`, `bg-slate-50`, `text-slate-900`, etc. en el JSX
- [ ] Todos los colores usan `style={{ color: COLORS.xxx }}` o `style={{ backgroundColor: COLORS.xxx }}`

**AdjustPriceModal.tsx** (`src/components/dashboard/AdjustPriceModal.tsx`):
- [ ] Línea 8: `import { useThemeColors } from '@/hooks/useThemeColors'` presente
- [ ] Línea 29: `const COLORS = useThemeColors()` presente
- [ ] NO existen colores Tailwind hardcodeados en el JSX
- [ ] Todos los colores usan `style={{ ...COLORS.xxx }}`

### Paso 1.2: Verificar barrel export
- [ ] `src/components/ui/index.ts` exporta: `Card`, `Skeleton`, `Badge`, `EmptyState`, `MetricCard`
- [ ] NO hay errores de import en ningún archivo

### Paso 1.3: TypeScript compilation check
- [ ] Ejecutar: `npx tsc --noEmit --pretty 2>&1 | Select-String -Pattern "ConfirmationsPanel|NotificationCenter|WalkinForm|EmployeeConfirmations|ReceptionConfirmations|MarkCompletedModal|AdjustPriceModal"`
- [ ] Resultado esperado: 0 errores en estos 7 archivos

---

## FASE 2 — UX Regression (Verificación Visual en Código)

### Objetivo
Validar que las migraciones visuales son correctas leyendo el código (no necesita ejecutar el browser).

### Paso 2.1: Loading States — Skeleton

**ConfirmationsPanel.tsx** (líneas 231-236):
- [ ] 3 `<Skeleton variant="rectangular" height="h-24" />` dentro de `loading ? (...)`
- [ ] Skeletons están dentro de `div className="space-y-3 py-4"` — spacing correcto
- [ ] NO hay spinner/Loader2 en la sección de loading

**NotificationCenter.tsx** (líneas 418-423):
- [ ] 3 `<Skeleton variant="text" height="h-4" />` dentro de `loading ? (...)`
- [ ] Skeletons dentro de `div className="p-2 space-y-2"` — spacing correcto
- [ ] NO hay componente `SkeletonItem` local

### Paso 2.2: Empty States

**ConfirmationsPanel.tsx** (líneas 238-242):
- [ ] `<EmptyState icon={<CheckCircle2 ...>} title="Sin servicios pendientes" description="..." />`
- [ ] Icon usa `style={{ color: COLORS.success }}` — color correcto via theme

**NotificationCenter.tsx** (líneas 425-429):
- [ ] `<EmptyState icon={<CheckCircle2 ...>} title="Todo en orden" description="No tienes notificaciones pendientes." />`
- [ ] Icon usa `style={{ color: COLORS.success }}`

**WalkinForm.tsx** (líneas 288-292):
- [ ] `<EmptyState icon={<Package ...>} title="No hay servicios disponibles" description="No se encontraron servicios con ese nombre." />`
- [ ] Icon usa `style={{ color: COLORS.textMuted }}`

**EmployeeConfirmations.tsx** (líneas 188-200):
- [ ] Empty state PRESERVADO como card-style custom (NO migrado a `<EmptyState>`)
- [ ] Verificar que sigue presente con `CheckCircle` icon, `COLORS.successLight`, `COLORS.success`

**ReceptionConfirmations.tsx** (líneas 270-293):
- [ ] Empty state PRESERVADO como card-style custom (NO migrado a `<EmptyState>`)
- [ ] Verificar que cambia texto según `filter` ('pending' → 'Sin pagos pendientes', 'completed' → 'Sin completados hoy', 'all' → 'Sin confirmaciones')

### Paso 2.3: Badges

**WalkinForm.tsx** (línea 309):
- [ ] `<Badge variant={isSelected ? 'primary' : 'neutral'} size="sm">` para duración del servicio
- [ ] Verificar que `formatDuration(service.duration)` se pasa como children

**EmployeeConfirmations.tsx** (línea 234):
- [ ] `<Badge variant={isScheduled ? 'primary' : 'warning'} size="md">` para tipo (Cita agendada / Walk-in)

**ReceptionConfirmations.tsx** (línea 343):
- [ ] `<Badge variant={conf.confirmation_type === 'walkin' ? 'warning' : 'primary'} size="sm">` para Walk-in/Programada
- [ ] Línea 378-383: `<Badge variant={isPending ? 'primary' : isComplete ? 'success' : isNoShow ? 'error' : 'neutral'} size="md">` para estado de pago
- [ ] Verificar los 4 estados: 'Por cobrar' (primary), 'Pagado' (success), 'No asistió' (error), 'No realizado' (neutral)

### Paso 2.4: Hover Behavior

**EmployeeConfirmations.tsx** (línea 212):
- [ ] `className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"` — Tailwind puro
- [ ] NO hay `onMouseEnter`/`onMouseLeave` handlers en este archivo

**ReceptionConfirmations.tsx** (líneas 321-330):
- [ ] `onMouseEnter` con guard `if (!isSuccess)` — PRESERVADO (lógica condicional)
- [ ] `onMouseLeave` — PRESERVADO
- [ ] Verificar que el guard `!isSuccess` sigue intacto

### Paso 2.5: useThemeColors en modales

**MarkCompletedModal.tsx**:
- [ ] Verificar que NO hay clases Tailwind de color hardcodeadas: buscar `bg-white`, `bg-slate-`, `text-slate-`, `border-slate-`, `text-red-`, `text-green-`, `bg-green-`, `bg-red-`
- [ ] Todos los colores usan `COLORS.xxx`: `COLORS.surface`, `COLORS.border`, `COLORS.textPrimary`, `COLORS.textSecondary`, `COLORS.textMuted`, `COLORS.success`, `COLORS.successLight`, `COLORS.error`, `COLORS.errorLight`, `COLORS.primary`, `COLORS.surfaceSubtle`, `COLORS.surfaceHover`, `COLORS.overlay`

**AdjustPriceModal.tsx**:
- [ ] Verificar que NO hay clases Tailwind de color hardcodeadas
- [ ] Todos los colores usan `COLORS.xxx`: `COLORS.surface`, `COLORS.border`, `COLORS.textPrimary`, `COLORS.textSecondary`, `COLORS.textMuted`, `COLORS.warning`, `COLORS.warningLight`, `COLORS.error`, `COLORS.errorLight`, `COLORS.surfaceSubtle`, `COLORS.surfaceHover`, `COLORS.overlay`

---

## FASE 3 — Realtime & Async QA (Verificación Lógica)

### Objetivo
Confirmar que NO se tocó lógica de negocio, realtime, ni coordinación async.

### Paso 3.1: ConfirmationsPanel — Realtime
- [ ] Líneas 173-182: Supabase channel subscription intacto
- [ ] Líneas 132-167: `fetchPending()` function intacta — query, joins, filters sin cambios
- [ ] Líneas 169-171: `useEffect` que llama `fetchPending` al abrir panel — intacto
- [ ] Líneas 158-165: `newItemPulse` logic intacto

### Paso 3.2: NotificationCenter — Realtime
- [ ] Líneas 201-228: `fetchNotifications()` intacta — API call sin cambios
- [ ] Líneas 272-289: `handleMarkRead()` intacta
- [ ] Líneas 291-309: `handleMarkAllRead()` intacta
- [ ] Líneas 311-330: `handleAction()` con switch por tipo de notificación — intacto
- [ ] Líneas 83-101: `getUrgencyLevel()` — lógica de urgencia intacta (NO migrar)

### Paso 3.3: WalkinForm — Submit flow
- [ ] Líneas 80-120: `handleSubmit()` intacta — `createConfirmation()` call sin cambios
- [ ] Líneas 111-119: Success/error handling intacto
- [ ] Líneas 113-116: `router.push('/confirmations')` y `router.refresh()` intactos

### Paso 3.4: EmployeeConfirmations — Confirm flow
- [ ] Líneas 53-78: `handleConfirm()` intacta — `createConfirmation()` call sin cambios
- [ ] Líneas 71-77: Success state con `showSuccess` y `router.refresh()` intacto

### Paso 3.5: ReceptionConfirmations — Payment flow
- [ ] Líneas 90-95: `handleNoShow()` intacta
- [ ] Líneas 97-102: `handleNotPerformed()` intacta
- [ ] Líneas 104-118: `openPayment()` y `handlePaymentConfirm()` intactas
- [ ] Líneas 494-508: `PaymentModal` integration intacta

### Paso 3.6: MarkCompletedModal — Server Action
- [ ] Líneas 37-63: `handleSubmit()` intacta — `markCompleted()` Server Action sin cambios
- [ ] Líneas 48-62: `startTransition` y error handling intactos

### Paso 3.7: AdjustPriceModal — Server Action
- [ ] Líneas 31-64: `handleSubmit()` intacta — `adjustPrice()` Server Action sin cambios
- [ ] Líneas 51-58: `startTransition` y error handling intactos

---

## FASE 4 — Responsive QA (Verificación de Clases)

### Objetivo
Verificar que las clases Tailwind responsivas están presentes y correctas.

### Paso 4.1: ConfirmationsPanel
- [ ] Línea 206: `w-full max-w-md` — panel responsive width
- [ ] Línea 203: `fixed inset-0` — overlay full screen

### Paso 4.2: NotificationCenter
- [ ] Línea 381: `w-[384px]` — dropdown width fijo pero con `max-h-[480px]`
- [ ] Línea 372-378: Positioning con `position` state — responsive via JS

### Paso 4.3: WalkinForm
- [ ] Línea 294: `gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))'` — grid responsive
- [ ] Línea 230-258: Floating preview `fixed bottom-6 right-6` — posición fixed

### Paso 4.4: EmployeeConfirmations
- [ ] Línea 110: `flex flex-col sm:flex-row sm:items-end` — header responsive
- [ ] Línea 134: `grid grid-cols-4` — bento stats 4 columnas

### Paso 4.5: ReceptionConfirmations
- [ ] Línea 160: `grid grid-cols-4 gap-4` — bento stats
- [ ] Línea 163: `col-span-4 sm:col-span-2` — income card responsive span
- [ ] Línea 339: `flex-wrap` — badges wrap en mobile

---

## FASE 5 — Theme QA (Verificación de useThemeColors)

### Objetivo
Verificar que `useThemeColors()` se usa correctamente y cubre todos los casos.

### Paso 5.1: Verificar token coverage en cada archivo

Buscar patrones de colores que DEBERÍAN usar `COLORS.xxx` pero podrían haberse escapado:

**En todos los archivos migrados:**
- [ ] NO hay `bg-white` o `bg-black` hardcodeados
- [ ] NO hay `text-slate-*`, `text-gray-*`, `text-red-*`, `text-green-*`, `text-blue-*`, `text-yellow-*`
- [ ] NO hay `border-slate-*`, `border-gray-*`
- [ ] NO hay `bg-slate-*`, `bg-gray-*`
- [ ] NO hay `#` hex colors inline que NO sean parte de `useThemeColors` tokens

**Excepciones permitidas (colores hex inline que SÍ deben existir):**
- [ ] `ConfirmationsPanel.tsx` línea 52-54: `#FEF3C7` y `#D97706` para `needs_review` state — PRESERVADO (lógica de dominio)
- [ ] `ConfirmationsPanel.tsx` línea 65: `#D97706` para AlertTriangle icon — PRESERVADO
- [ ] `ConfirmationsPanel.tsx` línea 87: `#DC2626` para urgency pulse — PRESERVADO
- [ ] `ConfirmationsPanel.tsx` línea 95: `#0F172A` y `#F8FAFC` para notes background — podría migrarse a `COLORS.surfaceSubtle` pero es menor
- [ ] `NotificationCenter.tsx` líneas 36-63: `TYPE_CONFIG` con hex colors para notification types — PRESERVADO (config de dominio)
- [ ] `NotificationCenter.tsx` líneas 88-100: `getUrgencyLevel()` con hex colors — PRESERVADO (lógica de dominio)
- [ ] `EmployeeConfirmations.tsx` línea 225-226: gradientes condicionales con `#1E293B`, `#0F172A`, `#F1F5F9`, `#E2E8F0` — usa `COLORS.isDark` para decidir, aceptable
- [ ] `ReceptionConfirmations.tsx` línea 28: `getAvatarColor()` con array de hex colors — PRESERVADO (función utilitaria)
- [ ] `ReceptionConfirmations.tsx` líneas 39-43: `getTimeUrgency()` con hex colors — PRESERVADO (lógica de dominio)
- [ ] `ReceptionConfirmations.tsx` línea 131: `COLORS.isDark ? '#0F172A' : '#FAFAF9'` — usa `COLORS.isDark` correctamente

### Paso 5.2: Verificar dark mode coverage
- [ ] En `MarkCompletedModal.tsx` y `AdjustPriceModal.tsx`, todos los colores pasan por `COLORS.xxx` que internamente usa `isDark`
- [ ] En `ConfirmationsPanel.tsx`, el `needs_review` state usa hex fijos — verificar si esto se ve bien en dark mode (es un riesgo conocido)

---

## FASE 6 — Architectural QA (Verificación Final)

### Objetivo
Verificar que no se introdujeron anti-patrones o abstracciones innecesarias.

### Paso 6.1: Buscar anti-patrones

Ejecutar búsquedas en los 7 archivos migrados:

- [ ] NO hay componentes inline definidos dentro de otros componentes
- [ ] NO hay wrappers nuevos como `ConfirmationCardWrapper`, `StatusWrapper`, `RealtimeBadge`, `ProcessingContainer`
- [ ] NO hay `useMemo`/`useCallback` innecesarios añadidos
- [ ] NO hay imports de componentes duplicados (ej. importar Skeleton de dos lugares distintos)
- [ ] NO hay `React.memo` añadido sin razón

### Paso 6.2: Verificar dominio intacto

- [ ] `ConfirmationsPanel.tsx`: `ConfirmationCard` component sigue siendo función separada (línea 33)
- [ ] `NotificationCenter.tsx`: `NotificationItem` component sigue siendo función separada (línea 116)
- [ ] `NotificationCenter.tsx`: `TYPE_CONFIG` record intacto (línea 28)
- [ ] `NotificationCenter.tsx`: `getUrgencyLevel()` intacta (línea 83)
- [ ] `ReceptionConfirmations.tsx`: `getTimeUrgency()` intacta (línea 38)
- [ ] `ReceptionConfirmations.tsx`: `getAvatarColor()` intacta (línea 28)
- [ ] `ReceptionConfirmations.tsx`: `getInitials()` intacta (línea 34)
- [ ] `ReceptionConfirmations.tsx`: `formatCurrencyCOP()` intacta (línea 18)

### Paso 6.3: Verificar que no se expandieron primitivos innecesariamente

- [ ] `Skeleton` solo se usa con `variant` y `height` — props soportadas
- [ ] `EmptyState` solo se usa con `icon`, `title`, `description` — props soportadas
- [ ] `Badge` solo se usa con `variant` y `size` — props soportadas
- [ ] NO se pasaron props no soportadas a ningún primitive

---

## FASE 7 — Generar QA Report

### Objetivo
Crear `docs/CONFIRMATIONS_QA_REPORT.md` con los resultados.

### Template del report

```markdown
# Confirmations QA Report

**Date:** <fecha actual>
**Scope:** 7 files migrated (ConfirmationsPanel, NotificationCenter, WalkinForm, EmployeeConfirmations, ReceptionConfirmations, MarkCompletedModal, AdjustPriceModal)

## Summary

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Smoke Test | ✅/❌ | <detalles> |
| 2. UX Regression | ✅/❌ | <detalles> |
| 3. Realtime & Async | ✅/❌ | <detalles> |
| 4. Responsive | ✅/❌ | <detalles> |
| 5. Theme QA | ✅/❌ | <detalles> |
| 6. Architectural | ✅/❌ | <detalles> |

## Issues Found

### Critical
- <ninguno o descripción>

### Warning
- <ej: needs_review colors hardcoded en ConfirmationsPanel podrían no verse bien en dark mode>

### Info
- <ej: getTimeUrgency() preservada por ser lógica de dominio>

## Preserved Domain Logic

| File | Preserved | Reason |
|------|-----------|--------|
| ConfirmationsPanel | needs_review hex colors | Domain-specific visual state |
| NotificationCenter | TYPE_CONFIG, getUrgencyLevel() | Notification type configuration |
| ReceptionConfirmations | getTimeUrgency(), getAvatarColor(), onMouseEnter guard | Dynamic state-based rendering |
| EmployeeConfirmations | Card-style empty state | Visual quality preservation |

## Decisions

1. <decisión 1>
2. <decisión 2>

## Risks

1. <risk 1>
2. <risk 2>

## Validation Checklist

- [x] TypeScript compilation: 0 errors in migrated files
- [x] Imports: all from correct paths
- [x] Skeleton: correct variants and placement
- [x] EmptyState: correct icons and messages
- [x] Badge: correct variants for each state
- [x] useThemeColors: all modals migrated
- [x] Realtime logic: untouched
- [x] Server Actions: untouched
- [x] Domain components: preserved
- [x] No new wrappers or abstractions
```

---

## Instrucciones de Ejecución

1. **Ejecutar Fases 1-6 en orden** — cada fase depende de la anterior
2. **Marcar cada checkbox** como ✅ (pass) o ❌ (fail) con nota
3. **Si cualquier fase falla**, documentar el issue y continuar con las siguientes
4. **Al terminar las 6 fases**, generar el report en `docs/CONFIRMATIONS_QA_REPORT.md`
5. **NO modificar ningún archivo de la app** — solo lectura y verificación
6. **El único archivo nuevo** es `docs/CONFIRMATIONS_QA_REPORT.md`
