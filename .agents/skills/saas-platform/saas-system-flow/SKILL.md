---
name: saas-system-flow
description: Documents the complete end-to-end system logic, database table interactions, and entity lifecycles for the SaaS platform. Includes the updated employee invitation flow (employees.user_id nullable), organization_members, integrations, and booking_settings. Use this skill when designing database schemas, writing Supabase triggers, creating backend Server Actions, or debugging data flow and authentication access.
---

# SaaS Prügressy — System Flow v2.0

## Visión General del Sistema

El sistema es una plataforma SaaS multitenant para negocios de servicios como barberías, spas, clínicas dentales y centros de bienestar.

Permite gestionar empleados, servicios, clientes, citas, reservas públicas, automatización de mensajes, nóminas, inventario, cuentas por cobrar y suscripciones.

Cada negocio se representa como una **organization**, y todos los datos están aislados mediante **organization_id**.

---

# 1. Registro del Negocio

Flujo inicial cuando un usuario crea una cuenta.

```
Usuario se registra (email/password)
↓
Supabase Auth crea usuario (auth.users)
↓
Trigger de base de datos ejecuta handle_new_user
↓
Se crean automáticamente:

- organization (con slug único)
- organization_member (role: owner)
- subscription (status: trial, plan: default)
- booking_settings (valores default)
- integrations (whatsapp disabled)
- organization_payroll_settings (period: monthly)
↓
Usuario completa onboarding
↓
Accede al dashboard
```

**Tablas involucradas:**

```
auth.users
organizations
organization_members
subscriptions
booking_settings
integrations
organization_payroll_settings
```

---

# 2. Onboarding del Negocio

El owner configura su negocio por primera vez.

```
Crear empleados (pueden tener o no usuario)
↓
Crear servicios
↓
Configurar disponibilidad por empleado
↓
Asignar servicios a empleados
```

**Tablas involucradas:**

```
employees
employee_availability
services
employee_services
```

### Empleados sin cuenta de usuario

Los empleados pueden existir **sin cuenta de usuario**:

```
employees.user_id = NULL
```

Esto permite registrar empleados que no usan el sistema (ej: empleados externos que solo reciben citas asignadas).

---

# 3. Invitación de Empleados al Sistema

Cuando el negocio desea que un empleado acceda al SaaS.

```
Owner crea empleado (sin user_id)
↓
Owner envía invitación
↓
Se crea employee_invitation (token único, expira en 7 días)
↓
Empleado accede a /invite/[token]
↓
Empleado completa registro (password)
↓
Se crea auth.users
↓
Se vincula employees.user_id
↓
Se crea organization_member (role: empleado)
↓
Empleado accede al dashboard
↓
Ve su agenda personal
```

**Tablas involucradas:**

```
employees
employee_invitations
auth.users
organization_members
```

**Estados de invitation:**

```
pending → accepted (cuando empleado completa registro)
          expired (cuando pasan 7 días sin usar)
```

---

# 4. Acceso al Sistema (Auth Flow)

Cuando un usuario inicia sesión.

```
Usuario accede a /login
↓
Ingresa email + password
↓
Supabase Auth valida credenciales
↓
Buscar organization_members por user_id
↓
Determinar organization_id
↓
Determinar rol (owner|admin|staff|empleado)
↓
Cargar dashboard según rol
```

**Roles disponibles:**

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `owner` | Propietario del negocio | Todo |
| `admin` | Administrador | Todo excepto eliminar organization |
| `staff` | Recepcionista | Gestión de citas, clientes, confirmación |
| `empleado` | Empleado con acceso | Solo ver su agenda y marcar completados |

**Diferencia entre organization_members y employees:**

```
organization_members: Define QUién tiene acceso al SaaS y su rol
employees: Define la información laboral del personal (con o sin acceso)

Un empleado puede:
- Existir en employees SIN estar en organization_members (no tiene acceso al sistema)
- Existir en ambos si tiene user_id vinculado
```

---

# 5. Agenda Interna y Citas

Gestión de citas desde el dashboard.

```
Staff abre calendario
↓
Selecciona cliente (o crea nuevo)
↓
Selecciona uno o más servicios
↓
Selecciona empleado
↓
Sistema calcula slots disponibles
↓
Staff selecciona slot
↓
Se crea appointment (status: confirmed)
↓
Se crean appointment_services
↓
Si integración WhatsApp activa → Crear mensaje en cola
↓
Actualizar UI del calendario
```

**Tablas involucradas:**

```
clients
appointments
appointment_services
employees
services
whatsapp_messages (si está activa la integración)
```

### Estados de Appointment

| Estado | Descripción |
|--------|-------------|
| `pending` | Esperando confirmación inicial |
| `confirmed` | Confirmada, esperando atención |
| `completed` | Servicio completado, esperando confirmación de pago |
| `cancelled` | Cancelada por cliente o negocio |
| `no_show` | Cliente no asistió |
| `scheduled` | Reservada (para booking público inicial) |
| `needs_review` | Esperando confirmación de recepción (post-servicio) |

### Campos importantes de appointments

```
id, organization_id, client_id, employee_id
date, start_time, end_time
status (pending|confirmed|completed|cancelled|no_show|scheduled|needs_review)
confirmation_status (scheduled|completed|confirmed|needs_review)
total_price (integer, en miles COP, puede variar del original)
payment_method (cash|nequi|daviplata|pse|qr|card|nequi_qr|daviplata_qr|transfer)
source (internal|public)
is_walk_in (boolean)
created_by (user_id del staff que creó)
notes, internal_notes
```

### Source: internal vs public

| Source | Descripción | bypassNotice |
|--------|-------------|---------------|
| `internal` | Creada desde dashboard por staff | siempre true |
| `public` | Creada desde página pública /reservar/[slug] | false (respeta min_notice_hours) |

---

# 6. Motor de Disponibilidad (Slots)

Los horarios disponibles se calculan dinámicamente en tiempo real.

```
Solicitar slots para empleado X en fecha Y
↓
Obtener employee_availability del empleado para el día
↓
Obtener appointments existentes del empleado en esa fecha
↓
Generar slots según slot_interval_minutes de booking_settings
↓
Eliminar slots que:
  - Caen fuera del rango availability (start_time - end_time)
  - Se superponen con appointments existentes
  - Son anteriores a ahora + min_notice_hours (solo si source=public)
↓
Retornar slots disponibles
```

**Los slots NO se almacenan en la base de datos** - se calculan en tiempo real.

### Sistema de Bypass de min_notice_hours

| Contexto | bypassNotice | Comportamiento |
|----------|--------------|----------------|
| Admin/Owner (Calendario interno) | `true` | Sin restricción, puede crear walk-ins |
| Público (Booking online) | `false` | Respeta min_notice_hours |

```
Si bypassNotice = true:
  minBookingTime = 0 (sin restricción)

Si bypassNotice = false:
  minBookingTime = Date.now() + settings.min_notice_hours * 60 * 60 * 1000
```

**Archivos involucrados:**

- `src/services/slots/generateSlots.ts` - Genera slots con parámetro `bypassNotice`
- `src/app/api/slots/route.ts` - Extrae `bypassNotice` de query params
- `src/components/dashboard/CalendarView.tsx` - Pasa `bypassNotice=true`
- `src/components/public/BookingWizard.tsx` - No pasa bypass (usa valor por defecto)

---

# 7. Drag & Drop de Citas

Reprogramación de citas arrastrando en el calendario.

```
Usuario arrastra cita a nuevo horario
↓
Frontend valida localmente (snaps to valid positions)
↓
Server Action recibe nueva fecha/hora
↓
Server valida:
  - Disponibilidad del empleado en el nuevo horario
  - No hay conflictos con otras citas
  - Employee_availability existe para ese día
↓
Si validación pasa:
  → UPDATE appointments SET date, start_time, end_time
  → Revalidate calendar
↓
Si validación falla:
  → Devolver error
  → UI restaura posición original
```

**Validaciones:**

```sql
-- No overlapping con otras citas del mismo empleado
SELECT COUNT(*) FROM appointments
WHERE employee_id = :employee_id
AND date = :new_date
AND status NOT IN ('cancelled', 'no_show')
AND id != :appointment_id
AND (
  (start_time < :new_end_time AND end_time > :new_start_time)
)
-- Si count > 0 → conflicto
```

---

# 8. Reservas Públicas

Clientes pueden reservar sin tener cuenta.

**Ruta:** `/reservar/[organization_slug]`

```
Cliente entra a la página pública
↓
Sistema busca organization por slug
↓
Mostrar servicios disponibles
↓
Cliente selecciona servicio(s)
↓
Cliente selecciona empleado (o "cualquier disponible")
↓
Sistema calcula slots disponibles (source=public, bypassNotice=false)
↓
Cliente selecciona horario
↓
Cliente ingresa datos:
  - Nombre
  - Email
  - Teléfono
  - Notas (opcional)
↓
Si cliente existe por email/phone → usar cliente existente
↓
Si no existe → crear nuevo cliente (sin account)
↓
Crear appointment (source: public, status: confirmed)
↓
Crear appointment_services
↓
Enviar confirmación por email/WhatsApp según preferencia del cliente
↓
Mostrar confirmación
```

**Tablas utilizadas:**

```
organizations
services
employees
employee_services
clients
appointments
appointment_services
```

---

# 9. Sistema de Confirmation (Employee → Reception) ★

Flujo de confirmación de servicios completados.

```
EMPLEADO completa el servicio
↓
EMPLEADO marca "Listo" en la UI
↓
(Opcional) Empleado ajusta precio (por ejemplo: descuento aplicado)
↓
Sistema actualiza:
  → appointments.status = 'completed'
  → appointments.confirmation_status = 'needs_review'
  → appointments.internal_notes = 'Precio ajustado: $X' (si aplicare)
↓
SUPABASE REALTIME dispara evento
↓
Se crea notification en la tabla notifications
↓
PANEL DE RECEPCIÓN recibe actualización en tiempo real
↓
Se muestra indicador de urgencia
↓
Se reproduce sonido de alerta
↓
Badge en header muestra count de pendientes
↓
RECEPCIÓN selecciona método de pago (8 opciones)
↓
RECEPCIÓN confirma la cita
↓
Sistema actualiza:
  → appointments.confirmation_status = 'confirmed'
  → appointments.status = 'confirmed'
  → appointments.payment_method = 'cash|nequi|daviplata|pse|qr|card|nequi_qr|daviplata_qr|transfer'
↓
Se crea confirmation_log para auditoría
↓
(Opcional) Si cliente tiene client_account → Crear transaction
↓
Fin del flujo
```

### Indicadores de Urgencia

| Tiempo transcurrido desde "Listo" | Color | Indicador |
|-----------------------------------|-------|-----------|
| 0-15 minutos | Verde | Listo para confirmar |
| 15-25 minutos | Ámbar | Confirmar pronto |
| 25-40 minutos | Naranja | Urgente |
| 40+ minutos | Rojo | Crítico |

### Métodos de Pago (8 opciones)

```
cash
nequi
daviplata
pse
qr (QR transferencia genérico)
card (tarjeta débito/crédito)
nequi_qr
daviplata_qr
transfer
```

### confirmation_logs - Auditoría

Tabla que registra todos los cambios de estado:

```
id, appointment_id (fk)
action (created|confirmed|adjusted|cancelled)
previous_state (jsonb)
new_state (jsonb)
performed_by (user_id)
notes
created_at
```

### notifications - Alertas en Tiempo Real

```
id, organization_id (fk)
type (confirmation_reminder|confirmation_needed|appointment_created|etc)
appointment_id (fk, nullable)
payload (jsonb) - { appointment_id, action, urgency, tiempo_transcurrido }
read_at
created_at
```

Supabase Realtime subscribe a `notifications` para organization.

---

# 10. Sistema de Payroll (Nómina) ★

Gestión de comisiones, préstamos y generación de recibos de pago.

### Configuración Global

`organization_payroll_settings` define el período:

```
organization_id (pk, fk)
period (weekly|biweekly|monthly)
day_of_month (1-28, para monthly)
cutoff_day (día de corte para el período)
```

### Tipos de Pago de Empleados

| Tipo | Descripción | Cálculo |
|------|-------------|---------|
| `commission` | Solo comisiones | revenue × commission_rate |
| `fixed_salary` | Solo salario fijo | fixed_salary_amount |
| `mixed` | Salario fijo + comisiones | fixed_salary + (revenue × commission_rate) |

### Rate de Comisión

- Default: 60% (0.60)
- Override por servicio en `employee_services.commission_rate_override`
- Si override existe, tiene prioridad sobre el default del employee

### employee_loans - Préstamos a Empleados

```
id, employee_id (fk), organization_id (fk)
amount (integer, en miles COP)
interest_rate (decimal, ej: 0.02 = 2% mensual)
status (active|paid|cancelled)
start_date, end_date_expected
payments (jsonb) - historial de abonos
```

**Ejemplo payments:**
```json
[
  { "date": "2026-01-15", "amount": 200 },
  { "date": "2026-02-15", "amount": 200 }
]
```

### Flujo de Generación de Payroll

```
1. ADMIN abre sección Payroll
2. Selecciona empleado
3. Selecciona período (automático según configuración)
4. Sistema fetch appointments completados en el período
5. Para cada appointment_services:
   → service_name, appointment_date
   → revenue = price del servicio
   → commission_rate_used = employee_services override ó employee.commission_rate
   → commission_amount = revenue × commission_rate_used
6. Se calcula:
   - total_services (cantidad)
   - total_revenue (suma de revenues)
   - total_commission (suma de commissions)
7. Se calculan deducciones de préstamos activos
8. net_pay = total_commission - total_loans_deducted + fixed_salary (si mixed)
9. Se crea payroll_receipt (status: draft)
10. ADMIN puede generar PDF del receipt
11. ADMIN marca "finalized" y "paid"
    → status: paid
    → paid_at: NOW()
```

### Tablas de Payroll

```
organization_payroll_settings
├── period (weekly|biweekly|monthly)
├── day_of_month (1-28)
└── cutoff_day

payroll_receipts
├── id, organization_id (fk), employee_id (fk)
├── period_start, period_end
├── total_services (cantidad de servicios)
├── total_revenue (suma de revenues)
├── total_commission (suma de comisiones)
├── total_loans_deducted (suma de deducciones)
├── net_pay (total_commission - total_loans_deducted + fixed_salary)
├── status (draft|finalized|paid)
├── generated_at, paid_at

payroll_receipt_services
├── receipt_id (fk)
├── service_name
├── appointment_date
├── revenue
├── commission_rate_used
└── commission_amount

payroll_receipt_loans
├── receipt_id (fk)
├── loan_id (fk)
└── amount_deducted
```

### Página "Mi Nómina" del Empleado

Ruta: `/payroll/mi`

Empleado puede ver:
- Sus recibos de nómina
- Historial de pagos
- Préstamos pendientes
- Servicios completados por período

---

# 11. Cuentas por Cobrar (Client Accounts) ★

Seguimiento de saldos y transacciones de clientes.

### client_accounts

```
id, organization_id (fk), client_id (fk, nullable)
balance (integer, en miles COP, puede ser negativo si hay deuda)
created_at, updated_at
```

Un cliente puede tener o no una cuenta.

### client_transactions

```
id, client_account_id (fk)
type (charge|payment)
amount (integer, positivo siempre)
description
appointment_id (fk, nullable)
created_at
```

**Lógica:**
- `charge` → balance += amount (aumenta deuda)
- `payment` → balance -= amount (reduce deuda)

### Ejemplo de Uso

```
1. Cliente tiene tratamiento de $300.000
   → CREATE client_transaction (type: charge, amount: 300)
   → client_account.balance = 300

2. Cliente paga $100.000 en efectivo
   → CREATE client_transaction (type: payment, amount: 100)
   → client_account.balance = 200

3. Cliente paga restante $200.000 con tarjeta
   → CREATE client_transaction (type: payment, amount: 200)
   → client_account.balance = 0
```

---

# 12. Gestión de Inventario ★

Control de stock de productos/materiales.

### inventory_items

```
id, organization_id (fk)
name, description
sku (código único)
category
quantity (integer)
min_quantity (para alertas)
price (integer, en miles COP)
cost (integer, para cálculo de margen)
supplier
status (active|inactive)
created_at, updated_at
```

### Alertas de Stock

Cuando `quantity <= min_quantity`:

```
1. CREATE system_log (level: warn, message: "Item {name} below min quantity")
2. UI muestra alerta en sección de inventario
3. (Futuro) Notificación por email a admin
```

### Flujo de Consumo (Futuro)

```
Appointment completado
↓
Consumir inventory_items asociados al servicio
↓
UPDATE inventory_items SET quantity = quantity - consumed
↓
Si quantity <= min_quantity → Trigger alerta
```

---

# 13. Sistema de Autenticación y Multi-tenancy

### Supabase Auth

- Email/password authentication
- Session management via cookies
- JWT tokens

### Row Level Security (RLS)

Todas las tablas tienen `organization_id`. Las políticas filtran por:

```sql
auth.jwt() -> organization_id
```

**Excepciones:**
- `auth.users` - Manejado por Supabase Auth
- `organizations` - Lectura pública por slug (para booking público)
- `public_booking` - Sin auth, solo lectura de org por slug y servicios activos

### Estructura de Permisos

```
organization
├── owner → Todo (incluye delete organization)
├── admin → Todo excepto delete organization
├── staff → Appointments, clients, confirmation, view payroll
└── empleado → Solo agenda personal y marcar completados
```

---

# 14. Automatización de WhatsApp (N8N)

WhatsApp es una integración **opcional**.

### Estados de Integración

```
integrations.status = disabled (default al crear org)
                 = pending (durante configuración)
                 = active (cuando N8N está conectado)
                 = suspended (si hay problemas)
```

### Flujo de Mensajes

```
Appointment creada/actualizada
↓
Verificar si integrations.whatsapp status = 'active'
↓
Si activo → INSERT into whatsapp_messages:
  organization_id, appointment_id
  phone (del cliente)
  message (template con variables)
  status: 'pending'
  scheduled_at (para recordatorios)
↓
N8N polls: SELECT * FROM whatsapp_messages WHERE status = 'pending'
↓
N8N envía mensaje vía WhatsApp Business API
↓
N8N webhook actualiza status: 'sent' o 'failed'
↓
Si failed → error_message registrado
```

### Tabla whatsapp_messages

```
id, organization_id (fk), appointment_id (fk, nullable)
phone, message
status (pending|processing|sent|failed)
scheduled_at, sent_at
error_message (si falló)
created_at
```

### Tipos de Mensajes

| Tipo | Trigger | Timing |
|------|---------|--------|
| Confirmación | Appointment creada (público) | Inmediato |
| Recordatorio | Appointment confirmada | 24h antes |
| Recordatorio | Appointment confirmada | 2h antes |
| Cambio | Appointment modificada/cancelada | Inmediato |

---

# 15. Email (Resend)

Sistema de emails transaccionales con templates HTML premium.

### email_logs

```
id, organization_id (fk), appointment_id (fk, nullable)
to, subject
status (sent|failed|delivered|opened)
provider_message_id (de Resend)
error_message (si falló)
created_at
```

### Templates de Email

| Template | Trigger | Contenido |
|----------|---------|-----------|
| Confirmación inicial | Booking público completado | Detalle de cita, instrucciones |
| Confirmación interna | Cita creada desde dashboard | Para staff/recepción |
| Recordatorio | 24h antes de cita | Fecha, hora, servicio |
| Cancellation | Cita cancelada | Información de cancelación |

### Configuración por Organización

```
integrations.config: { resend_api_key, from_email, from_name }
```

---

# 16. Sistema de Billing (Stripe)

Gestión de suscripciones y pagos.

### Planes

```
plans
├── id, name, price, interval (month|year)
├── max_employees, max_services
├── features (jsonb) - { whatsapp: true, advanced_reports: false, etc }
└── is_active
```

### Suscripción

```
subscriptions
├── organization_id (fk)
├── plan_id (fk)
├── status (trial|active|cancelled|past_due)
├── stripe_customer_id
├── stripe_subscription_id
├── current_period_start, current_period_end
└── created_at
```

### Flujo de Checkout

```
1. Owner selecciona plan
2. POST /api/stripe/create-checkout
   → Crear Stripe Checkout Session
   → Guardar organization_id en metadata
3. Redirect a Stripe Checkout
4. Usuario completa pago
5. Stripe webhook: checkout.session.completed
   → UPDATE subscription (status: active)
   → Guardar stripe_subscription_id
```

### Customer Portal

```
1. Owner accede a Settings → Billing
2. Click "Manage Subscription"
3. Redirect a Stripe Customer Portal
4. Owner puede: upgrade, downgrade, cancel
5. Stripe webhook actualiza subscription
```

### Webhooks de Stripe

| Evento | Acción |
|--------|--------|
| `checkout.session.completed` | Activar suscripción |
| `customer.subscription.updated` | Actualizar plan/período |
| `customer.subscription.deleted` | Marcar como cancelled |
| `invoice.payment_failed` | Marcar como past_due |

---

# 17. Sistema de Integraciones

Tabla madre para todas las integraciones externas.

### Tabla integrations

```
id, organization_id (fk)
type (whatsapp|google_calendar|email_resend|stripe|sms)
status (disabled|pending|active|suspended)
config (jsonb) - credenciales y settings específicos
created_at, updated_at
```

### Integraciones Soportadas

| Integración | Tipo | Estado | Config |
|-------------|------|--------|--------|
| WhatsApp | whatsapp | Opcional, requiere N8N | webhook_url, api_key |
| Google Calendar | google_calendar | Parcial | client_id, client_secret |
| Email Resend | email_resend | Activo | api_key, from_email |
| Stripe Billing | stripe | Activo | (manejado por sistema) |
| SMS | sms | Futuro | (pendiente) |

---

# 18. Observabilidad del Sistema (Logging)

Tabla para todos los eventos importantes.

### system_logs

```
id, organization_id (fk, nullable)
level (info|warn|error)
message
context (jsonb) - datos adicionales
created_at
```

### Eventos Registrados

| Level | Mensaje ejemplo |
|-------|-----------------|
| info | "Nueva cita {id} creada para cliente {name}" |
| info | "Payroll receipt {id} generado para {employee}" |
| warn | "Cita {id} esperando confirmación hace {min} minutos" |
| warn | "Item {name} stock below min_quantity" |
| warn | "Employee loan {id} past due date" |
| error | "Stripe payment failed for subscription {id}" |
| error | "WhatsApp message {id} failed: {error}" |
| error | "Email to {email} failed: {error}" |

---

# 19. Estados por Entidad (Resumen)

| Entidad | Campo | Estados Posibles |
|---------|-------|------------------|
| `organizations` | status | active, suspended, cancelled |
| `organization_members` | role | owner, admin, staff, empleado |
| `employees` | status | active, inactive |
| `employee_invitations` | status | pending, accepted, expired |
| `employee_loans` | status | active, paid, cancelled |
| `services` | status | active, inactive |
| `clients` | confirmation_method | whatsapp, email, sms, none |
| `appointments` | status | pending, confirmed, completed, cancelled, no_show, scheduled, needs_review |
| `appointments` | confirmation_status | scheduled, completed, confirmed, needs_review |
| `appointments` | source | internal, public |
| `appointments` | payment_method | cash, nequi, daviplata, pse, qr, card, nequi_qr, daviplata_qr, transfer |
| `integrations` | status | disabled, pending, active, suspended |
| `subscriptions` | status | trial, active, cancelled, past_due |
| `payroll_receipts` | status | draft, finalized, paid |
| `whatsapp_messages` | status | pending, processing, sent, failed |
| `email_logs` | status | sent, failed, delivered, opened |
| `system_logs` | level | info, warn, error |

---

# 20. Validaciones Clave

| Contexto | Validación |
|----------|------------|
| Crear cita | `employee_availability` debe existir para día/hora seleccionados |
| Crear cita | No overlapping con otras appointments del empleado |
| Crear cita (público) | Respetar `min_notice_hours` (bypassNotice=false) |
| Drag & drop | Validar disponibilidad en nueva posición |
| Marcar "Listo" | Solo si status=confirmed, empleado asignado |
| Confirmar cita | Solo si confirmation_status=needs_review, user con rol staff/admin/owner |
| Generar payroll | Solo appointments con status=completed en el período |
| Crear préstamo | `interest_rate` entre 0 y 1 (0% a 100%) |
| Inventario | `quantity >= 0`, `min_quantity >= 0` |
| Checkout | Organization no debe haber excedido `max_employees` o `max_services` del plan |

---

# 21. Arquitectura Conceptual (ERD Simplificado)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ORGANIZATION                                │
│  (Multitenant - organization_id en TODAS las tablas)               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ name, slug, logo_url, timezone, currency, status            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────┬────────────────────────────────────────────┘
                        │
        ┌───────────────┼────────────────┬─────────────────┬──────────┐
        ▼               ▼                ▼                 ▼          ▼
┌───────────────┐ ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐
│Organization   │ │Employees  │  │ Services  │  │ Clients  │  │Booking   │
│Members        │ │           │  │           │  │          │  │Settings  │
│• role         │ │• name     │  │• name     │  │• name    │  │• slot_int│
│• user_id      │ │• user_id* │  │• duration │  │• email   │  │• max_days│
└───────────────┘ │• commission│  │• price    │  │• phone   │  │• min_not │
        │         │• pay_type │  │• category │  │• confirm │  └──────────┘
        │         └─────┬─────┘  └───────────┘  │method    │          │
        │               │                      └─────┬────┘          │
        │       ┌───────┴───────┐                  │          ┌──────┴─────┐
        │       ▼               ▼                  │          │Integrations │
        │ ┌───────────┐ ┌─────────────┐            │          │• whatsapp  │
        │ │Availability│ │Employee     │            │          │• google    │
        │ │• day_of_wk │ │Services     │            │          │• email     │
        │ │• start/end │ │• commission │            │          └─────────────┘
        │ └───────────┘ │  _override  │            │                  │
        │               └─────────────┘            │          ┌────────┴────────┐
        │                      │                   │          ▼                 ▼
        │               ┌───────┴───────┐   ┌──────┴──────┐ ┌────────────┐ ┌─────────┐
        │               ▼               ▼   ▼            │ │ Subscript- │ │Payroll  │
        │         ┌───────────┐  ┌───────────┐  ┌─────┴────┐ │ ions       │ │Settings │
        │         │Invitations│  │ Loans     │  │Appoint-  │ │• plan_id   │ │• period  │
        │         │• token    │  │• amount   │  │ments     │ │• status    │ │• cutoff │
        │         │• status   │  │• interest │  │• status  │ └────────────┘ └─────────┘
        │         └───────────┘  └───────────┘  │• confirm_ │                  │
        │                                     │  status   │          ┌───────┴───────┐
        │                             ┌───────┴──────┐    │          ▼               ▼
        │                             ▼              ▼    │    ┌──────────┐  ┌───────────┐
        │                    ┌────────────────┐  ┌─────────┐│    │ Plans    │  │Payroll    │
        │                    │Appointment    │  │Confirm- │    │• price   │  │Receipts   │
        │                    │Services       │  │ationLogs│    │• max_emp │  │• net_pay  │
        │                    │• price_over   │  │• action │    │• features│  │• status   │
        │                    │• commission   │  │• before │    └──────────┘  └───────────┘
        │                    └────────────────┘  │• after  │                    │
        │                                        └─────────┘           ┌────┴────┐
        │                                                     ┌──────────────┐│
        │                                        ┌────────────┴─────┐    ┌────┴──────────┐
        │                                        ▼                  ▼    ▼               ▼
        │                                 ┌───────────┐    ┌────────────┐ ┌─────────┐ ┌─────────┐
        │                                 │ Clients   │    │WhatsApp    │ │ Email   │ │ Client  │
        │                                 │ Accounts  │    │Messages    │ │ Logs    │ │Accts    │
        │                                 │• balance  │    │• status    │ │• status │ │• balance│
        │                                 └───────────┘    └────────────┘ └─────────┘ └─────────┘
        │                                        │                                             ▲
        │                                        ▼                                             │
        │                                 ┌─────────────┐                                      │
        │                                 │Transactions │                                      │
        │                                 │• type       │                                      │
        │                                 │• amount     │                                      │
        │                                 └─────────────┘                                      │
        │                                                                           ┌─────────────┐
        │       ┌───────────────────────────────────────────────────────────────────┘           │
        │       │                                                                           ▼
        │       ▼                                                            ┌────────────────────┐
        │ ┌───────────┐                                          ┌─────────┴────┐           │
        │ │Inventory  │                                          │Notifications │           │
        │ │Items      │                                          │• type        │           │
        │ │• quantity │                                          │• payload     │           │
        │ │• min_qty  │                                          │• read_at     │           │
        │ └───────────┘                                          └──────────────┘           │
        │                                                                                     │
        │                                                                      ┌─────────────┴──┐
        │                                                                      ▼                ▼
        └─────────────────────────────────────────────────────────────────┐  ┌───────────┐  ┌──────────┐
                                                                         │  │System     │  │Stripe    │
                                                                         │  │Logs       │  │Webhooks  │
                                                                         └──│• level    │  └──────────┘
                                                                            │• message  │
                                                                            │• context  │
                                                                            └───────────┘
```

---

# 22. Flujo Completo del SaaS (End-to-End)

```
═══ REGISTRO Y ONBOARDING ════════════════════════════════════════════════

1. USUARIO REGISTRA
   └→ auth.users creado
   └→ Trigger handle_new_user ejecuta
       ├→ CREATE organization
       ├→ CREATE organization_member (owner)
       ├→ CREATE subscription (trial)
       ├→ CREATE booking_settings
       ├→ CREATE integrations (whatsapp disabled)
       └→ CREATE organization_payroll_settings (monthly)

2. OWNER COMPLETA ONBOARDING
   ├→ Crear empleados (con o sin acceso)
   ├→ Crear servicios
   ├→ Configurar disponibilidad empleados
   ├→ Asignar servicios a empleados
   └→ Invitar empleados que necesiten acceso

═══ OPERACIÓN DIARIA ════════════════════════════════════════════════════════

3. CREAR CITA (desde dashboard)
   ├→ SELECT cliente o crear nuevo
   ├→ SELECT servicios
   ├→ SELECT empleado
   ├→ Fetch slots disponibles (bypassNotice=true)
   ├→ SELECT slot
   ├→ CREATE appointment (status: confirmed)
   ├→ CREATE appointment_services
   ├→ Si whatsapp active → INSERT whatsapp_messages
   └→ Revalidate calendar

4. RESERVA PÚBLICA (desde página /reservar/[slug])
   ├→ Cliente selecciona servicios
   ├→ Cliente selecciona empleado/disponibilidad
   ├→ Fetch slots disponibles (bypassNotice=false)
   ├→ Cliente ingresa datos
   ├→ CREATE/GET client
   ├→ CREATE appointment (source: public, status: confirmed)
   ├→ CREATE appointment_services
   ├→ Enviar email/WhatsApp confirmación
   └→ Mostrar página de confirmación

5. DRAG & DROP (reprogramar cita)
   ├→ Usuario arrastra a nuevo horario
   ├→ Validar disponibilidad y conflictos
   ├→ UPDATE appointment
   └→ Notificar si era recordatorio programado

═══ CONFIRMACIÓN POST-SERVICIO ══════════════════════════════════════════════

6. EMPLEADO COMPLETA SERVICIO
   └→ Marca "Listo" en UI

7. REAL TIME NOTIFICATION
   ├→ Supabase Realtime detecta cambio
   ├→ Notification creada
   └→ Panel recepción recibe alerta

8. RECEPCIÓN CONFIRMA
   ├→ Selecciona método de pago
   ├→ UPDATE appointment (confirmation_status: confirmed)
   ├→ CREATE confirmation_log
   └→ Si aplica → CREATE client_transaction

═══ PAYROLL ══════════════════════════════════════════════════════════════════

9. GENERAR NÓMINA (por período)
   ├→ Fetch appointments completados en período
   ├→ Calcular comisiones por servicio
   ├→ Calcular deducciones de préstamos activos
   ├→ Calcular net_pay
   ├→ CREATE payroll_receipt
   ├→ Generar PDF
   └→ Marcar como finalized y paid

═══ GESTIÓN DE CLIENTES ══════════════════════════════════════════════════════

10. CUENTAS POR COBRAR
    ├→ Charge a cliente (servicio no pagado)
    ├→ Payment de cliente (abono)
    └→ Ver historial y balance

11. INVENTARIO
    ├→ Crear/actualizar items
    ├→ Alertas cuando quantity <= min_quantity
    └→ (Futuro) Consumir en cada appointment

═══ FACTURACIÓN Y SUBSCRIPCIONES ════════════════════════════════════════════

12. SELECCIÓN DE PLAN
    ├→ Owner ve planes disponibles
    ├→ Click upgrade
    ├→ Stripe Checkout redirect
    └→ Webhook actualiza subscription

13. GESTIÓN DE SUSCRIPCIÓN
    ├→ Acceder a Stripe Customer Portal
    ├→ Upgrade/downgrade/cancel
    └→ Webhooks mantienen estado sincronizado

═══ MONITOREO ════════════════════════════════════════════════════════════════

14. SYSTEM LOGS
    ├→ Errores de integraciones (WhatsApp, email, Stripe)
    ├→ Alertas de negocio (stock bajo, loans vencidos)
    └→ Auditoría de confirmaciones
```

---

# 23. API Routes Principales

| Ruta | Método | Propósito |
|------|--------|-----------|
| `/api/slots` | GET | Calcular slots disponibles (bypassNotice query param) |
| `/api/appointments` | POST | Crear cita (internal) |
| `/api/appointments/[id]` | PATCH | Actualizar cita (drag, status) |
| `/api/appointments/[id]/confirm` | POST | Confirmar con método de pago |
| `/api/employees/[id]/availability` | GET/POST | Gestionar disponibilidad |
| `/api/payroll/generate` | POST | Generar receipt para empleado |
| `/api/stripe/create-checkout` | POST | Iniciar Stripe Checkout |
| `/api/stripe/create-portal` | POST | Crear Stripe Customer Portal session |
| `/api/stripe/webhook` | POST | Manejar eventos de Stripe |
| `/api/integrations/whatsapp/send` | POST | Enviar mensaje WhatsApp manual |
| `/reservar/[slug]` | GET/POST | Página pública de reservas |

---

# 24. Server Actions (Patrón)

```
src/actions/
├── auth/
│   ├── login.ts
│   ├── register.ts
│   └── logout.ts
├── appointments/
│   ├── create.ts
│   ├── update.ts
│   ├── confirm.ts
│   └── delete.ts
├── employees/
│   ├── create.ts
│   ├── update.ts
│   ├── invite.ts
│   └── updateAvailability.ts
├── services/
│   ├── create.ts
│   └── update.ts
├── clients/
│   ├── create.ts
│   └── update.ts
├── payroll/
│   ├── generateReceipt.ts
│   ├── finalizeReceipt.ts
│   └── markAsPaid.ts
├── loans/
│   ├── create.ts
│   └── addPayment.ts
├── inventory/
│   ├── create.ts
│   └── update.ts
├── settings/
│   ├── updateBooking.ts
│   └── updateOrganization.ts
└── integrations/
    └── updateStatus.ts
```

---

# 25. RLS Policies (Resumen)

```sql
-- Ejemplo de política para appointments
CREATE POLICY "Users can view own org appointments"
ON appointments FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Política para employees (empleados ven solo los suyos)
CREATE POLICY "Employees can view own record"
ON employees FOR SELECT
USING (user_id = auth.uid());

-- Política para clients (staff+ pueden ver todos del org)
CREATE POLICY "Staff can view org clients"
ON clients FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'staff')
  )
);
```

---

# 26. Cron Jobs y Workers

| Job | Frecuencia | Propósito |
|-----|------------|-----------|
| WhatsApp message sender | Cada 1 min | Procesar messages con status=pending |
| Appointment reminders | Cada 3 min | Enviar recordatorios 24h y 2h antes |
| Subscription checker | Diario | Verificar suscripciones trial que expiran |
| Data retention purge | Diario | Eliminar datos según política de retención |
| Payroll auto-generate | Fin de período | (Opcional) Generar drafts automáticamente |

---

# 27. Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=

# N8N Webhook (para WhatsApp)
N8N_WEBHOOK_URL=
N8N_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

# 28. Glosario de Términos

| Término | Definición |
|---------|------------|
| `organization_id` | UUID que aísla todos los datos de un negocio |
| `bypassNotice` | Bandera que permite saltarse el min_notice_hours |
| `source` | Origen de la cita: internal (dashboard) o public (booking page) |
| `confirmation_status` | Estado del flujo confirmation: needs_review → confirmed |
| `payment_type` | Cómo se paga al empleado: commission, fixed_salary, mixed |
| `commission_rate` | Porcentaje de comisión (default 0.60 = 60%) |
| `net_pay` | Pago neto al empleado después de deducciones |
| `client_account` | Cuenta corriente del cliente para trackear deudas |
| `min_notice_hours` | Horas mínimas de anticipación para reservas públicas |

---

# 29. Mejoras y Roadmap

## Implementado en v2.0 (este documento)

- Sistema de Confirmation completo con Realtime
- Payroll con loans y receipts
- Client Accounts
- Inventory management
- Indicadores de urgencia para confirmation

## Pendientes

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| `spa_closing_time` | Media | Horario oficial de cierre en booking_settings |
| Google Calendar sync | Baja | Sincronizar citas con Google Calendar |
| SMS integration | Baja | Integración con proveedor SMS |
| Inventory consumption | Baja | Descontar stock al completar appointment |
| Advanced reports | Baja | Reportes de revenue, comisiones, etc. |

---

**Última actualización:** Mayo 2026
**Versión:** 2.0
**Proyecto:** SaaS Prügressy - Wellness & Health