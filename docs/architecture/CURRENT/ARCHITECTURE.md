# Arquitectura del Sistema — Prügressy

> STATUS: CURRENT IMPLEMENTATION
> Source of truth: `src/app/`, `src/actions/`, `src/lib/`, `src/components/`
> Last updated: 2026-05-27

---

## Visión General

Plataforma SaaS B2B para gestión de citas, empleados, nómina y confirmaciones para negocios de bienestar y salud (barberías, spas, clínicas, centros estéticos) en Colombia.

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 16 | App Router, Server Components, Server Actions |
| React | 19 | UI library |
| TypeScript | 5 | Tipado estático |
| Tailwind CSS | 4 | Estilos + design tokens via `useThemeColors()` |
| Supabase | — | Auth, PostgreSQL, Row Level Security, Realtime |
| Stripe | — | Pagos y suscripciones |
| Resend | — | Emails transaccionales |
| N8N | — | Automatizaciones WhatsApp (middleware) |
| Recharts | — | Gráficos de analytics |
| Framer Motion | — | Animaciones |
| Vitest | — | Tests unitarios |

---

## Principios Arquitectónicos

1. **PostgreSQL es la fuente de verdad** — No hay cache ni read model autoritativo
2. **Server Actions para mutaciones** — Toda escritura pasa por Server Actions con validación Zod
3. **Service Role para operaciones internas** — Cron, webhooks y shadow mode usan service role (bypass RLS)
4. **Theme-only colors** — Todos los colores via hook `useThemeColors()`, sin hex hardcodeados
5. **Shadow Mode** — Validación offline de nueva arquitectura sin impacto en producción
6. **Notificaciones multicanal** — Arquitectura de adaptadores (channel pattern) para WhatsApp, Email, In-App

---

## Estructura del Proyecto

```
src/
├── actions/              # Server Actions (mutaciones — 21 módulos)
├── app/                  # Next.js App Router
│   ├── (auth)/           # login, register, forgot-password, reset-password
│   ├── (dashboard)/      # calendar, clients, employees, payroll, confirmations, etc.
│   ├── (public)/         # reservar, invite, help, confirmar
│   ├── api/              # API Routes (cron, webhooks, slots, appointments)
│   └── admin/            # Rutas administrativas
├── components/
│   ├── ui/               # Primitivas canónicas (Card, Badge, Skeleton, Spinner, EmptyState)
│   └── dashboard/        # Componentes de dominio
├── lib/                  # Utilidades compartidas + notificaciones + shadow
├── hooks/                # Custom hooks (useThemeColors, useRealtimeInvalidation, etc.)
├── services/             # Data fetching
└── types/                # TypeScript types
```

---

## Base de Datos

44 migraciones en `supabase/migrations/`. Esquema multi-tenant con RLS.

### Entidades Core

| Tabla | Propósito |
|-------|-----------|
| `organizations` | Tenant raíz |
| `organization_members` | RBAC pivot (roles: owner, admin, staff, empleado) |
| `employees` | Empleados (user_id nullable — invitación) |
| `clients` | Clientes con cuenta de crédito |
| `services` | Servicios ofrecidos (precio COP × 1000) |
| `appointments` | Citas con `status` + `confirmation_status` |

### Módulos

Payroll (V2 activo), Notificaciones (V2 multicanal), Confirmaciones (flujo A+B), Facturación (Stripe), Inventario, Cuentas por Cobrar, Invitaciones, Promo Codes, Shadow Mode.

Ver `docs/architecture/CURRENT/DATABASE.md` para detalle completo.

---

## Sistema de Confirmaciones

Dos flujos paralelos:

**Flujo A (por cita):** `scheduled → [empleado marca Listo] → completed → [asistente cobra] → confirmed`

**Flujo B (por servicio):** `pending_employee → [empleado confirma] → pending_reception → [asistente cobra] → completed`

Ver `docs/modules/CONFIRMATIONS.md`.

---

## Sistema de Notificaciones (V2)

Arquitectura multicanal con channel adapters:

```
Appointment Event → NotificationOrchestrator → Automation Rules
                                                     ↓
                                            Channel Factory
                                           /        |        \
                                       WhatsApp    Email     In-App
                                       (N8N)     (Resend)  (Realtime)
```

Ver `docs/modules/WHATSAPP.md`.

---

## Shadow Mode

Validación en paralelo V1 vs V2 sin impacto en producción. Detecta 6 tipos de drift. Modos: `observe_only`, `dual_write`, `soft_enforce`.

Ver `docs/modules/SHADOW-MODE.md`.

---

## Cron Jobs

| Endpoint | Intervalo | Propósito |
|----------|-----------|-----------|
| `/api/cron/check-reminders` | 3 min | Recordatorios + auto-completado |
| `/api/cron/process-notifications` | 5 min | Procesar cola de notificaciones |
| `/api/cron/purge-appointments` | Diario | Purga de citas antiguas |
| `/api/cron/shadow-notifications` | 5 min | Validación shadow mode |

Ver `docs/architecture/CURRENT/CRON-JOBS.md`.

---

## UI / Design System

- **Primitivas:** `Card`, `Badge`, `Skeleton`, `Spinner`, `EmptyState`, `MetricCard`, `ConfirmModal` en `src/components/ui/`
- **Colors:** `useThemeColors()` como única fuente
- **Tipografía:** Cormorant Garamond (headings) + Plus Jakarta Sans (body)
- **Architecture Guard:** `scripts/architecture-guard.ts` — drift detection automatizado

Ver `docs/governance/ARCHITECTURE_GOVERNANCE.md`.

---

## Integraciones Externas

| Servicio | Estado | Propósito |
|----------|--------|-----------|
| Stripe | ⚠️ Parcial | Suscripciones, checkout, webhooks parciales |
| Resend | ✅ | Emails transaccionales |
| N8N | ⚠️ Setup | Middleware WhatsApp |
| WhatsApp Cloud API | 📅 Pendiente | Envío real de mensajes |

---

## Documentación Relacionada

- Setup: `docs/setup/SETUP.md`
- Variables: `docs/architecture/CURRENT/ENVIRONMENT.md`
- Base de datos: `docs/architecture/CURRENT/DATABASE.md`
- Cron: `docs/architecture/CURRENT/CRON-JOBS.md`
- Módulos: `docs/modules/`
- Governance: `docs/governance/`
- Arquitectura futura: `docs/architecture/FUTURE/`
