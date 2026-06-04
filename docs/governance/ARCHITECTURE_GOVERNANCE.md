# Architecture Governance — Prügressy

> STATUS: CURRENT IMPLEMENTATION
> Source of truth: código fuente en `src/`
> Last updated: 2026-06-04

---

## 1. Frontend — Server Components vs Client Components

| Tipo | Uso | Ubicación |
|------|-----|-----------|
| Server Component | Páginas, layouts, fetching inicial | `src/app/` (page.tsx, layout.tsx) |
| Client Component (`'use client'`) | Interactividad, hooks, context, efectos | `src/components/`, `src/hooks/` |

Server Actions siempre llevan `'use server'` como primera línea del archivo.

---

## 2. Server Actions — Patrón Obligatorio

```typescript
'use server'

const Schema = z.object({ ... })

export async function actionName(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. Validar input con safeParse
  // 2. Verificar auth (supabase.auth.getUser())
  // 3. Verificar permisos (membership + role)
  // 4. Ejecutar mutación
  // 5. revalidatePath() / revalidateTag()
  // 6. return { error?, success?, data? }
}
```

**Prohibido:**
- Lanzar excepciones como mecanismo de control de flujo
- Usar `try/catch` en el hot path (solo para operaciones externas)
- Mutar el estado sin revalidación

---

## 3. Componentes UI — Patrón

```typescript
'use client'  // si usa hooks o interactividad

import { cn } from '@/lib/utils'
import { useThemeColors } from '@/hooks/useThemeColors'  // solo si necesita colores dinámicos

interface Props { ... }

export function ComponentName({ ... }: Props) { ... }
// o
export const ComponentName = React.memo(function ComponentName({ ... }: Props) { ... })
```

**Primitivas canónicas** (en `src/components/ui/`):
- `Card` (con variantes `surface`/`ghost`/`elevated` via `cva`)
- `Badge`, `Skeleton`, `Spinner`, `EmptyState`, `MetricCard`, `PageContainer`
- `ConfirmModal`, `ErrorFallback`, `ChartErrorBoundary`

**Reglas:**
- No usar `forwardRef` a menos que sea necesario para composición con bibliotecas externas
- `cn()` para combinar clases Tailwind (vía `clsx` + `tailwind-merge`)
- `React.memo` en componentes que se renderizan frecuentemente o reciben props estables
- No hardcodear hex colors en inline styles (regla ESLint guardrail)

---

## 4. Providers — Patrón

```typescript
'use client'

import { createContext, useContext, ReactNode } from 'react'

interface ContextType { ... }
const Context = createContext<ContextType | undefined>(undefined)

export function ProviderName({ children, ...props }: { children: ReactNode } & ContextType) {
  return <Context.Provider value={...}>{children}</Context.Provider>
}

export function useProviderName() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useProviderName must be used within ProviderName')
  return ctx
}
```

6 providers activos: `QueryProvider`, `ThemeProvider`, `OrganizationProvider`, `AppointmentModalProvider`, `AppointmentRealtimeProvider`, `PaymentQueueProvider`.

---

## 5. Tipos de Base de Datos — Patrón

```typescript
import type { Database } from '@/../types/supabase'

type Entity = Database['public']['Tables']['table']['Row']
type EntityInsert = Database['public']['Tables']['table']['Insert']
type EntityUpdate = Database['public']['Tables']['table']['Update']
```

**Prohibido:** Crear interfaces TypeScript que dupliquen el schema de BD. Los tipos generados por Supabase son la única fuente de verdad para formas de las tablas.

---

## 6. Clientes Supabase

| Cliente | Archivo | Uso |
|---------|---------|-----|
| Browser | `src/lib/supabase/client.ts` | Componentes client-side |
| Server | `src/lib/supabase/server.ts` | Server Components, Server Actions |
| Service Role | `src/lib/supabase/service-role.ts` | Cron, webhooks, shadow mode (bypass RLS) |

Los cron jobs, webhooks y shadow mode **deben** usar `createServiceRoleClient()` para bypass completo de RLS.

---

## 7. Colores y Tema

- **Única fuente de verdad:** `useThemeColors()` hook
- **Clases Tailwind:** preferir clases semánticas sobre valores literales
- **Prohibido:** hex codes en inline styles (`color: #abc` o `style={{ color: '#abc' }}`)
- Los tokens se definen en `useThemeColors.ts` y cubren light + dark mode

---

## 8. ESLint — Reglas de Visibilidad

Todas son **warning-only** (no bloquean build ni CI):

| Regla | Límite |
|-------|--------|
| `max-lines` | 600 |
| `complexity` | 15 |
| `max-depth` | 4 |
| `max-lines-per-function` | 120 |
| `no-explicit-any` | warn |

---

## 9. Navegación

- Centralizada en `src/lib/navigation.ts` (array `dashboardRoutes: RouteDefinition[]`)
- Cada ruta tiene: `href`, `label`, `icon`, `group`, flags de visibilidad por rol
- `filterRoutesByRole()` filtra según el rol del usuario
- `src/lib/routes.ts` construye `ROUTE_MAP` para lookup programático

---

## 10. Estructura de Archivos

```
src/
├── actions/          # Server Actions (un archivo por acción, un módulo por dominio)
├── app/              # App Router (páginas, layouts, API routes)
├── components/       # Componentes React
│   ├── ui/           # Primitivas canónicas
│   ├── providers/    # Context providers
│   └── .../          # Componentes por feature
├── hooks/            # Custom hooks
├── lib/              # Utilidades, clientes DB, lógica de negocio
├── schemas/          # Esquemas Zod compartidos
├── services/         # Data fetching (read-only)
└── types/            # Tipos TypeScript (dominio + DB generated)
```
