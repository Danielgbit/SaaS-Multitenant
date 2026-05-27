# Fase 2 — `/mi` V2 (Dashboard Empleado)

## Objetivo

Transformar `/mi` de pantalla informativa a producto de engagement: métricas personales, historial de servicios, KPIs operativos. Sin convertirlo en mini-admin-dashboard.

## Principios de diseño

- **KPIs que valen:** próximas citas, ingresos generados, completion rate, streak, no-show rate personal, deuda pendiente
- **KPIs que NO valen:** charts gigantes, analytics complejos, comparaciones organizacionales, vanity metrics
- **Foco:** "qué necesita ver el empleado para operar mejor"
- **Tipado fuerte:** eliminar `Record<string, any>` y `any` en todo el módulo `/mi`
- **Sin `any` nuevos:** el módulo `/mi V2` debe salir con cero casts

## Estado actual

```
mi/page.tsx
├── auth + org check
├── fetch employee, availability, services, appointments (inline, tipado débil)
└── MiDashboard (client component, Props con Record<string, any>)
    ├── MiProfileCard      ← edita nombre/teléfono
    ├── MiAvailabilityCard ← edita disponibilidad
    ├── MiAgendaCard       ← lista textual próximos 7 días
    ├── MiServicesCard     ← lista servicios asignados
    └── MiPayrollLink      ← link a /payroll/mi
```

**Problemas identificados:**
- Sin métricas personales (ingresos, comisiones, ocupación)
- Sin historial (solo muestra 7 días)
- Sin streak / no-show rate personal
- Queries inline en page.tsx con `any[]`
- Props del dashboard tipadas como `Record<string, any>`
- MiAgendaCard solo textual, sin indicadores de rendimiento

## Diseño de archivos

### Nuevos Server Actions

| Archivo | Queries | Propósito |
|---------|---------|-----------|
| `src/actions/employee/getMyMetrics.ts` | `appointments` (completed/cancelled/no_show COUNT), `services` (SUM price), `employee_loans` (remaining SUM) | KPIs acumulados del empleado |
| `src/actions/employee/getMyHistory.ts` | `appointments` + `appointment_services` + `services` + `clients` (últimos 30 servicios) | Historial de servicios realizados |
| `src/actions/employee/getMyUpcoming.ts` | `appointments` próx 7 días (reemplazar query inline actual) | Próximas citas |

### Nuevos Componentes

| Archivo | Props | Descripción |
|---------|-------|-------------|
| `src/components/employee/MiMetricsCards.tsx` | `metrics: EmployeeMetrics` | 4 tarjetas KPI: completadas este mes, ingresos generados, completion rate %, streak |
| `src/components/employee/MiHistoryCard.tsx` | `history: ServiceHistory[]` | Timeline últimos 30 servicios con fecha, cliente, servicio, monto |
| `src/components/employee/MiMiniStat.tsx` | `label, value, icon, trend?` | Primitiva de mini-kpi reutilizable |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/app/(dashboard)/mi/page.tsx` | Migrar queries inline a Server Actions, tipado fuerte, agregar metrics + history, SIN transforms inline |
| `src/components/employee/MiDashboard.tsx` | Props tipadas (`EmployeeMetrics`, `ServiceHistory[]`), layout con métricas arriba |
| `src/components/employee/MiAgendaCard.tsx` | Props tipadas (`UpcomingAppointment[]`), indicador de citas hoy |

### Interfaces (`src/types/employee-metrics.ts`)

```ts
type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export interface EmployeeMetrics {
  completedThisMonth: number
  revenueThisMonth: number
  completionRate: number       // % citas completadas / total asignadas (antes occupancyRate)
  streak: number               // días consecutivos desde el último día trabajado (last-active, no strict)
  noShowRate: number           // % no_show / total
  pendingLoans: number         // deuda pendiente total
  cancelledThisMonth: number
}

export interface ServiceHistory {
  id: string
  date: string
  clientName: string
  serviceName: string
  servicePrice: number
  status: AppointmentStatus
  appointmentId: string
}

export interface UpcomingAppointment {
  id: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  clientName: string | null
}
```

## Queries SQL

### `getMyMetrics.ts`

```sql
-- Appointment stats (30 días)
SELECT status FROM appointments
WHERE employee_id = $1 AND start_time >= now() - interval '30 days'

-- Revenue (30 días, solo completed)
SELECT COALESCE(SUM(s.price), 0)
FROM appointments a
JOIN appointment_services aps ON aps.appointment_id = a.id
JOIN services s ON s.id = aps.service_id
WHERE a.employee_id = $1 AND a.status = 'completed' AND a.start_time >= now() - interval '30 days'

-- Streak (60 días, last-active: contar desde último día con trabajo)
SELECT DISTINCT start_time::date as service_date
FROM appointments
WHERE employee_id = $1 AND status = 'completed' AND start_time >= now() - interval '60 days'
ORDER BY service_date DESC

-- Pending loans
SELECT COALESCE(SUM(remaining_amount), 0)
FROM employee_loans
WHERE employee_id = $1 AND status IN ('pending', 'partial')
```

### `getMyHistory.ts`

```sql
SELECT
  a.id, a.start_time, a.status, c.name as client_name,
  s.name as service_name, s.price as service_price
FROM appointments a
JOIN clients c ON c.id = a.client_id
LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
LEFT JOIN services s ON s.id = aps.service_id
WHERE a.employee_id = $1 AND a.start_time >= now() - interval '30 days'
ORDER BY a.start_time DESC
LIMIT 50
```

## Layout de `/mi` (post-migración)

```
┌──────────────────────────────────────┐
│  Mi espacio — Bienvenido, {name}     │  ← header existente
├────────────────────┬─────────────────┤
│  MiProfileCard     │  MiMetricsCards │  ← NUEVO: 4 mini-KPIs
│  (edit nombre/tel) │  (completadas,  │
│                    │   ingresos,     │
│                    │   completion,   │
│                    │   streak)       │
├────────────────────┼─────────────────┤
│  MiAvailabilityCard│  MiHistoryCard  │  ← NUEVO: timeline 30 servicios
│  (toggle días)     │  (lista con     │
│                    │   fecha,cliente,│
│                    │   servicio,$)   │
├────────────────────┴─────────────────┤
│  MiAgendaCard (mejorada)             │  ← existente + indicador citas hoy
│  próximos 7 días con indicadores     │
├──────────────────────────────────────┤
│  MiPayrollLink                       │
│  MiServicesCard                      │
└──────────────────────────────────────┘
```

**Regla de layout:** metrics arriba (lo que necesita ver rápido), historial y agenda abajo (lo que necesita consultar).

## Orden de implementación

```
Paso 1: src/types/employee-metrics.ts        ← tipos puros
Paso 2: src/actions/employee/getMyMetrics.ts  ← sin any, appLog, last-active streak
Paso 3: src/actions/employee/getMyHistory.ts  ← LIMIT 50, tipado
Paso 4: src/actions/employee/getMyUpcoming.ts ← AppointmentStatus tipado
Paso 5: npm run build + test
Paso 6: src/components/employee/MiMiniStat.tsx
Paso 7: src/components/employee/MiMetricsCards.tsx
Paso 8: src/components/employee/MiHistoryCard.tsx
Paso 9: npm run build
Paso 10: Modificar MiAgendaCard (props UpcomingAppointment[])
Paso 11: Modificar MiDashboard (props tipadas + layout metrics arriba)
Paso 12: Modificar mi/page.tsx (Promise.all 3 Server Actions, page ultra-fina)
Paso 13: npm run build + test
Paso 14: Commit + tag (mi-v2-2026-06)
```

## Decisiones de diseño explícitas

| Decisión | Opción elegida | Por qué |
|----------|---------------|---------|
| `completionRate` vs `occupancyRate` | `completionRate` | El cálculo es `completed / total`, no horas reservadas / disponibles |
| Streak | Last-active | Cuenta desde el último día trabajado. Si hoy no trabajó pero ayer sí, el streak se mantiene. No penaliza mornings. |
| Revenue source | `appointments` + `services.price` (no payroll) | Payroll es financial snapshot. Para analytics operacionales, appointments es la fuente correcta. |
| `status` en tipos | Union type `AppointmentStatus` | Previene `string` débil. Alineado con eliminar `Record<string, any>`. |
| Historial limit | `.limit(50)` | Previene explosion de rows en empleados activos. Suficiente para vista rápida. |
| `page.tsx` | Server Component ultra-fino | Solo `Promise.all` de Server Actions + render. Sin transforms, sin reducers, sin lógica visual. |

## Zero `any` policy

El módulo `/mi V2` debe tener cero casts `as any`. Los tipos mínimos necesarios:

```ts
// Para calculateStreak
type AppointmentDateRow = { start_time: string }

// Para revenue en getMyMetrics
type RevenueRow = {
  appointment_services: Array<{
    services: { price: number | null } | null
  } | null> | null
}
```

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Queries lentas sin índice por employee_id | `appointments.employee_id` y `payroll_items.employee_id` son FK → indexed por Supabase |
| Streak calculation pesado en DB grande | Limitar a 60 días hacia atrás. Si >1000 rows, early exit |
| Revenue desde appointments duplica payroll | Usar appointments para revenue operacional mensual; payroll_items para nómina histórica — son dominios distintos |
| Tipado de Supabase conflictivo | Usar `Database["public"]["Tables"]["appointments"]["Row"]` como source of truth |

## Criterio de done

- `/mi` muestra KPIs personales sin recargar datos del admin dashboard
- `Record<string, any>` eliminado del módulo `/mi`
- Cero `as any` en archivos nuevos del módulo
- Build pasa (60 pages, 0 errors)
- Tests pasan (150+ tests)
- Layout responsivo (1 col mobile, 2 col desktop)
- Streak visible pero no intrusivo

## Tags propuestos

```
mi-v2-2026-06
```
