# Arquitectura del Sistema - SaaS Prügressy

## Visión General

Plataforma SaaS B2B para gestión de citas y horarios para negocios de bienestar y salud (barberías, spas, clínicas, centros estéticos).

---

## Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **Next.js 14** | Framework full-stack (App Router) |
| **Supabase** | Auth, Database, Row Level Security |
| **TypeScript** | Tipado estático |
| **Tailwind CSS** | Estilos (design system tokens) |
| **Stripe** | Pagos y suscripciones |
| **Resend** | Envío de emails transaccionales |
| **N8N** | Automatizaciones (WhatsApp) |
| **Recharts** | Gráficos de analytics |

---

## Estructura del Proyecto

```
src/
├── actions/                    # Server Actions (mutaciones)
│   ├── analytics/
│   ├── appointments/
│   ├── availability/
│   ├── billing/
│   ├── clients/
│   ├── confirmations/
│   ├── email/
│   ├── employees/
│   ├── inventory/
│   ├── invitations/           # ⭐ Nuevo
│   ├── public/
│   ├── services/
│   ├── settings/
│   └── whatsapp/
│
├── app/                       # Next.js App Router
│   ├── (auth)/               # Grupo: autenticación
│   │   ├── login/
│   │   └── register/
│   │
│   ├── (dashboard)/           # Grupo: dashboard autenticado
│   │   ├── calendar/
│   │   ├── clients/
│   │   ├── confirmations/    # ⭐ Nuevo
│   │   ├── dashboard/
│   │   ├── employees/
│   │   │   └── [id]/
│   │   │       ├── page.tsx  # ⭐ Nuevo (detail with tabs)
│   │   │       ├── EmployeeTabs.tsx
│   │   │       ├── EmployeeInfoTab.tsx
│   │   │       ├── EmployeeAvailabilityTab.tsx
│   │   │       ├── EmployeeServicesTab.tsx
│   │   │       └── EmployeeAccessTab.tsx
│   │   ├── inventory/        # ⭐ Nuevo
│   │   ├── services/
│   │   ├── billing/
│   │   ├── whatsapp/
│   │   ├── email/
│   │   └── settings/
│   │
│   ├── (public)/             # Grupo: páginas públicas
│   │   ├── invite/           # ⭐ Nuevo
│   │   │   └── [token]/
│   │   └── reservar/
│   │
│   ├── api/                  # API Routes
│   │   ├── appointments/
│   │   ├── email/
│   │   ├── slots/
│   │   └── whatsapp/
│   │
│   └── auth/
│       └── callback/         # Supabase auth callback
│
├── components/
│   └── dashboard/
│       ├── Sidebar.tsx
│       ├── analytics/
│       ├── billing/
│       ├── email/
│       └── whatsapp/
│
├── lib/                      # Utilidades
│   ├── billing/
│   ├── email/
│   ├── supabase/
│   ├── resend.ts
│   └── stripe.ts
│
├── services/                 # Data fetching
│   ├── analytics/
│   ├── appointments/
│   ├── availability/
│   ├── clients/
│   ├── employees/
│   └── services/
│
└── types/                    # TypeScript types
    ├── availability.ts
    ├── calendar.ts
    ├── employees.ts
    ├── invitations.ts        # ⭐ Nuevo
    └── services.ts
```

---

## Base de Datos

### Esquema Principal

```
organizations
├── id (UUID)
├── name
├── slug (URL pública)
└── created_at

organization_members
├── id (UUID)
├── organization_id (FK)
├── user_id (FK → auth.users)
├── role (owner | admin | staff)
└── created_at

employees
├── id (UUID)
├── organization_id (FK)
├── user_id (FK → auth.users, nullable)
├── name
├── phone
├── active (boolean)
└── created_at

employee_availability
├── id (UUID)
├── employee_id (FK)
├── day_of_week (0-6)
├── start_time
└── end_time

employee_services
├── id (UUID)
├── employee_id (FK)
├── service_id (FK)
├── duration_override (nullable)
└── price_override (nullable)

services
├── id (UUID)
├── organization_id (FK)
├── name
├── duration (minutos)
├── price
├── active
└── created_at

clients
├── id (UUID)
├── organization_id (FK)
├── name
├── phone
├── email
├── notes
└── created_at

appointments
├── id (UUID)
├── organization_id (FK)
├── client_id (FK)
├── employee_id (FK)
├── date
├── start_time
├── end_time
├── status (pending | confirmed | completed | cancelled | no_show)
├── notes
├── total_price
└── created_at

appointment_services
├── id (UUID)
├── appointment_id (FK)
├── service_id (FK)
└── price_at_booking

inventory_items              # ⭐ Nuevo
├── id (UUID)
├── organization_id (FK)
├── name
├── sku
├── quantity
├── min_quantity
├── price
├── category
└── created_at

appointment_confirmations    # ⭐ Nuevo
├── id (UUID)
├── appointment_id (FK)
├── employee_id (FK)
├── status (pending_employee | pending_reception | confirmed | rejected)
├── employee_confirmed_at
├── reception_confirmed_at
├── client_name
├── client_phone
├── payment_method
└── notes

employee_invitations        # ⭐ Nuevo
├── id (UUID)
├── organization_id (FK)
├── employee_id (FK)
├── email (nullable)
├── token (unique)
├── role (staff | admin)
├── status (pending | accepted | expired | cancelled)
├── expires_at
├── accepted_at
├── resend_count
├── last_resend_at
├── created_at
└── created_by

subscriptions
├── id (UUID)
├── organization_id (FK)
├── plan_id (FK → plans)
├── status (active | trialing | canceled | past_due)
├── current_period_start
├── current_period_end
└── created_at

plans
├── id (UUID)
├── name (Basic | Professional | Enterprise)
├── price
├── max_employees
├── max_services
├── whatsapp_enabled
└── features (jsonb)

integrations
├── id (UUID)
├── organization_id (FK)
├── type (whatsapp | email | google_calendar)
├── status (disabled | active)
└── config (jsonb)

whatsapp_messages
├── id (UUID)
├── organization_id (FK)
├── appointment_id (FK)
├── to_phone
├── message
├── status (pending | sent | failed)
└── sent_at

email_logs
├── id (UUID)
├── organization_id (FK)
├── appointment_id (FK)
├── to_email
├── subject
├── status (sent | failed)
└── sent_at
```

---

## Autenticación y Autorización

### Flujo de Auth

1. **Registro/Login**: Supabase Auth (email/password)
2. **Callback**: `/auth/callback` → exchange code por sesión
3. **Middleware**: No implementado (usa Server Components con auth check)
4. **Session**: Cookie-based via `@supabase/ssr`

### Roles

| Rol | Permisos |
|-----|----------|
| **owner** | Todo (facturación, empleados, settings, invitar, revocar) |
| **admin** | Todo excepto facturación y settings de org |
| **staff** | Agenda, citas, clientes, servicios |
| **employee** | Solo confirmaciones (vista limitada) |

### Row Level Security (RLS)

Todas las tablas tenant-specific tienen políticas RLS:
- Filtrado por `organization_id`
- Verificación de membresía en `organization_members`

---

## Flujos de Usuario

### 1. Crear Cita (Dashboard)

```
1. Usuario abre /calendar
2. Clic en "Nueva cita"
3. Selecciona cliente (o crea nuevo)
4. Selecciona servicio(s)
5. Selecciona empleado
6. Selecciona fecha/hora (slots disponibles)
7. Confirma → appointment created
8. Envío automático: WhatsApp + Email (si enabled)
```

### 2. Reserva Pública

```
1. Cliente entra a /reservar/[slug]
2. Selecciona servicio
3. Selecciona empleado (opcional)
4. Selecciona fecha/hora
5. Ingresa datos (nombre, teléfono, email)
6. Confirma → client created + appointment created
7. Recibe confirmación
```

### 3. Confirmación de Servicio

```
1. N8N detecta cita completada → /api/appointments/check-completed
2. Empleado ve servicios completados → confirma
3. Recepción ve cola → confirma + registra cliente + cobra
```

### 4. Invitar Empleado

```
1. Owner va a /employees
2. Clic en "Invitar" en empleado sin acceso
3. Ingresa email (opcional) + rol
4. Genera link universal
5. Comparte por WhatsApp/Email
6. Empleado abre link → se loguea/registra
7. Acepta → se vincula user_id + organization_members
```

---

## API Routes

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/appointments` | POST, GET | CRUD citas |
| `/api/appointments/check-completed` | POST | N8N: detectar citas terminadas |
| `/api/slots` | GET | Generar slots disponibles |
| `/api/whatsapp/scheduler` | POST | N8N: recordatorios |
| `/api/email/scheduler` | POST | N8N: recordatorios |
| `/api/webhooks/stripe` | POST | Payment webhooks |

---

## Server Actions

### Naming Convention

- `src/actions/[module]/[action].ts`
- Funciones: `createXxx`, `updateXxx`, `deleteXxx`, `getXxx`
- Validación con Zod
- Retorno: `{ success?: boolean; error?: string; data?: T }`

---

## Design System

### Colores

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `primary` | #0F4C5C | #38BDF8 | Botones, acentos |
| `background` | #FAFAFA | #0F172A | Fondo |
| `surface` | #FFFFFF | #1E293B | Cards, modals |
| `text` | #0F172A | #F8FAFC | Texto principal |
| `muted` | #64748B | #94A3B8 | Texto secundario |

### Tipografía

- **Headings**: Cormorant Garamond (serif, elegante)
- **Body**: Plus Jakarta Sans (sans, legible)

### Componentes

- Border radius: `xl` (12px), `2xl` (16px), `3xl` (24px)
- Sombras: `shadow-lg`, `shadow-xl`
- Animaciones: `duration-200`, `animate-in`

---

## Integraciones

### Stripe

- Checkout Sessions para suscripciones
- Customer Portal para gestión
- Webhooks para sync de estado
- Planes: Basic (0€), Professional (29.99€), Enterprise (79.99€)

### Resend

- Emails transaccionales
- 3,000 emails/mes gratis
- Templates HTML

### N8N (WhatsApp)

- Webhook para recibir mensajes
- Scheduler para recordatorios
- Autenticación por Bearer token

---

## Sistema de Confirmaciones

El sistema de confirmaciones permite la comunicación síncrona entre empleados y asistentes para el cobro de servicios.

**Documento detallado:** [docs/ARCHITECTURE-CONFIRMATIONS.md](./docs/ARCHITECTURE-CONFIRMATIONS.md)

### Resumen del Flujo

```
Empleado marca "Listo ✓" → Supabase Realtime → Asistente recibe notificación
                                                    ↓
                                          Panel slide-out con pendientes
                                                    ↓
                                          Asistente registra método pago
                                                    ↓
                                          Cita confirmada + log completo
```

### Estados de Cita

| Estado | Descripción |
|--------|-------------|
| `scheduled` | Cita programada |
| `completed` | Empleado marcó "Listo" |
| `confirmed` | Asistente confirmó + cobró |
| `needs_review` | ⚠️ Cita sin marcar 60 min+ |

### Componentes Principales

| Componente | Ubicación |
|------------|-----------|
| Tablas DB | `confirmation_logs`, `notifications` |
| Server Actions | `src/actions/confirmations/` |
| Panel UI | `src/app/(dashboard)/confirmations/` |
| Cron | `/api/cron/check-reminders` |

---

## Pendientes / v2

- Sistema de confirmaciones con cliente (email/WhatsApp) - **Pendiente v1.1**
- Google Calendar Integration
- Tests unitarios y de integración
- PWA support
- Multi-language (i18n)
