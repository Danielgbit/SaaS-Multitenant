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
Si hay automation rules activas → Encolar en notification_queue
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
notification_queue (si hay automation rules activas)
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
Se inserta confirmation_log (acción: created)
↓
Se notifica vía notification_queue / Realtime según automation rules
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

### confirmation_logs - Tabla de Confirmación (historial completo)

Ver schema en la tabla descrita arriba. Cada confirmación tiene `confirmation_logs` con trazabilidad completa.

### Sistema de Notificaciones In-App (V2)

Las alertas en tiempo real se manejan via `notification_queue` + Supabase Realtime. Ver módulo de Notificaciones V2 para arquitectura completa.

**Legacy:** La tabla `notifications` (V1) todavía existe pero está siendo reemplazada por el sistema V2.

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

### Tablas de Payroll (V2 — Activo)

```
organization_payroll_settings
├── period (weekly|biweekly|monthly)
├── day_of_month (1-28)
└── cutoff_day

payroll_periods                          ← Modelo V2 (activo)
├── organization_id (fk)
├── period (YYYY-MM)
├── status (draft|approved|paid)
├── total_revenue, total_commission
├── total_employee_deductions
├── net_pay_total
├── paid_at

payroll_items                            ← Por empleado por período
├── payroll_period_id (fk)
├── employee_id (fk)
├── payment_type (commission|fixed_salary|mixed)
├── contract_type
├── base_salary, commission_total
├── total_loans_deducted
├── net_pay
├── has_transport_subsidy
├── status (draft|approved|paid)

period_commissions                       ← Detalle por servicio
├── payroll_item_id (fk)
├── appointment_id (fk)
├── service_id (fk)
├── revenue, commission_rate
├── commission_amount
├── service_date

payroll_item_loans                       ← Deducciones de préstamos
├── payroll_item_id (fk)
├── loan_id (fk)
└── amount_deducted

employee_loans                           ← Préstamos a empleados
├── employee_id (fk)
├── amount, interest_rate
├── status (active|paid|cancelled)
├── payments (jsonb)
```

**Legacy (V1 — en migración):** `payroll_receipts`, `payroll_receipt_services`, `payroll_receipt_loans` — coexisten pero no son el modelo activo.

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

# 14. Automatización de Notificaciones (V2 — Multicanal)

Las notificaciones usan una **arquitectura de canales** (channel adapter pattern) con cola unificada.

### Arquitectura

```
Appointment Event → Automation Rules (trigger → canal → template)
                              ↓
                    NotificationOrchestrator
                              ↓
                     Channel Factory
                    /        |        \
              WhatsApp    Email     In-App
           (Wasender/   (Resend)  (Realtime)
              n8n)
```

### Notification Queue (V2 activo)

La cola unificada `notification_queue` reemplaza a `whatsapp_messages` y `email_logs` (V1 legacy).

```
Appointment creada/actualizada
↓
Automation rules matching (trigger_event, is_enabled)
↓
INSERT into notification_queue:
  organization_id, appointment_id
  channel (whatsapp|email|in_app)
  template_id (fk → message_templates)
  template_variables (jsonb)
  recipient (phone/email)
  status: 'pending'
  scheduled_at
↓
Cron process-notifications claims batch vía SKIP LOCKED
↓
Channel factory resuelve provider activo por canal
↓
Provider envía (Wasender API / Resend API / Realtime)
↓
Status actualizado: sent | failed
↓
Si failed → retry 5min → 20min → 45min → dead_letter
```

### Tablas V2 activas

```
notification_queue          → Cola unificada con claim atómico
notification_providers      → Credenciales por canal por org
message_templates           → Templates versionables por canal y tipo
automation_rules            → Reglas trigger → canal → template
notification_messages       → Historial de mensajes (inbound/outbound)
notification_events         → Timeline de eventos (observabilidad)
notification_conversations  → Hilos por cliente
dead_letter_notifications   → Fallos permanentes (replayable)
notification_inbound_events → Eventos entrantes (replay-safe)
```

### Proveedores de WhatsApp

| Provider | Estado |
|----------|--------|
| Wasender | Configurable |
| n8n | Configurable |
| Mock | Dev/testing |

### Tipos de Mensajes (definidos en automation_rules)

Los triggers y timings se configuran por organización via automation_rules. No hay tipos fijos.

### Legacy

Las tablas `whatsapp_messages`, `email_logs`, `whatsapp_settings`, `email_settings` son V1 legacy. El código activo usa V2 exclusivamente para nuevas funcionalidades.

---

# 15. Email (Resend)

Sistema de emails transaccionales con templates HTML premium.

Los emails se envían a través del canal `email` de la arquitectura V2.

### Canales V2

| Componente | Descripción |
|-----------|-------------|
| `notification_providers` | Configuración Resend por org (channel = 'email') |
| `message_templates` | Templates HTML premium (confirmación, recordatorio, etc.) |
| `notification_queue` | Cola de envío, procesada por cron |
| Provider | `src/lib/notifications/channels/email-resend.channel.ts` |

### Configuración por Organización

```
notification_providers (channel = 'email'):
  config: { resend_api_key, from_email, from_name }
```

### Legacy

La tabla `email_logs` (V1) coexiste pero no es el mecanismo activo para nuevos envíos.

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

# 23. API Routes (25 endpoints)

| Ruta | Método | Propósito |
|------|--------|-----------|
| `/api/slots` | GET | Calcular slots disponibles (bypassNotice query param) |
| `/api/appointments` | POST | Crear cita |
| `/api/appointments/check-completed` | GET | Verificar citas completadas |
| `/api/confirmations/respond` | POST | Responder confirmación vía token |
| `/api/email/scheduler` | POST | Scheduler de emails |
| `/api/whatsapp/scheduler` | POST | Scheduler de WhatsApp |
| `/api/notifications` | GET/POST | CRUD notificaciones in-app |
| `/api/notifications/mark-read` | POST | Marcar notificación leída |
| `/api/notifications/mark-all-read` | POST | Marcar todas leídas |
| `/api/notifications/stats` | GET | Estadísticas de notificaciones |
| `/api/notifications/health` | GET | Health check del sistema |
| `/api/notifications/cutover-checklist` | GET | Checklist de migración V1→V2 |
| `/api/notifications/seed-v2` | POST | Sembrar datos V2 |
| `/api/notifications/messages` | GET | Historial de mensajes |
| `/api/notifications/messages/[id]` | GET | Detalle de mensaje |
| `/api/notifications/messages/[id]/replay` | POST | Replay de mensaje |
| `/api/notifications/dead-letter/discard` | POST | Descartar dead letter |
| `/api/notifications/dead-letter/replay` | POST | Replay dead letter |
| `/api/notifications/stuck/requeue` | POST | Re-encolar stuck |
| `/api/webhooks/notifications` | POST | Webhook entrante de notificaciones |
| `/api/webhooks/stripe` | POST | Webhook de Stripe |
| **CRON** | | |
| `/api/cron/check-reminders` | POST | Recordatorios + auto-completado |
| `/api/cron/process-notifications` | POST | Procesar cola de notificaciones |
| `/api/cron/purge-appointments` | POST | Purga de citas antiguas |
| `/api/cron/shadow-notifications` | POST | Validación shadow mode |

---

# 24. Server Actions (26 módulos, ~150 archivos)

```
src/actions/
├── admin/                  # Discard dead letter, health, org status, promo codes, requeue
├── analytics/              # Trends, performance, insights, stats, alerts, today pulse
├── appointments/           # createAppointment, updateAppointment, deleteAppointment, purge
├── auth/                   # index, resetPassword, sendPasswordResetEmail
├── availability/           # deleteAvailability, overrideActions, setAvailability, spaOverrides
├── billing/                # cancelSubscription, createCheckoutSession, createPortalSession
├── cash-sessions/          # openSession, closeSession, auditPayments, createEntryFromSource
├── clientAccounts/         # getAccounts, recordTransaction, recordAdjustment, voidTransaction
├── clients/                # createClient, updateClient, deleteClient
├── confirmations/          # markCompleted, confirmService, confirmByReception, adjustPrice, etc.
├── cron/                   # runCheckReminders
├── email/                  # getEmailLogs, getEmailSettings, queueEmailMessage, updateSettings
├── employee/               # getMyHistory, getMyMetrics, getMyUpcoming, setMyAvailability
├── employees/              # create, update, archive, reactivate, toggleStatus, payroll, service
├── financial/              # getAppointmentFinancialStatus, recordPayment, recordCommission
├── inventory/              # createItem, updateItem, adjustStock, consumeInventory, etc.
├── invitations/            # create, accept, resend, revoke, setupPassword, updateMemberRole
├── notifications/          # automations, providers, queue, templates, v2-feature-flag
├── onboarding/             # getOnboardingState
├── operation-entries/      # createManualEntry, payEmployee, voidEntry
├── payroll/                # 15 archivos: createPeriod, calculatePayroll, generateReceipt, etc.
├── promoCodes/             # applyCode, validateCode
├── public/                 # createPublicBooking, cancelPublicBooking
├── services/               # createService, updateService, toggleServiceStatus, updateCommission
├── settings/               # updateOrganization, updateBookingSettings, checkSlugAvailability
└── whatsapp/               # getWhatsAppSettings, sendReminder, testWebhook, etc. (V1 legacy)
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

| Job | Endpoint | Frecuencia | Propósito |
|-----|----------|------------|-----------|
| Reminders | `POST /api/cron/check-reminders` | 3 min | Recordatorios, auto-completado, needs_review |
| Notifications | `POST /api/cron/process-notifications` | 5 min | Procesar notification_queue (batch 50, SKIP LOCKED) |
| Purge data | `POST /api/cron/purge-appointments` | Diario 2 AM | Purga según política de retención |
| Shadow validation | `POST /api/cron/shadow-notifications` | 5 min | Procesar semillas shadow mode |

Endpoint de email y WhatsApp scheduler se ejecutan via los cron check-reminders y process-notifications.

---

# 27. Variables de Entorno Requeridas (20 activas)

```env
# Supabase (3)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (3)
STRIPE_SECRET_KEY=
STRIPE_PRICE_BASIC_MONTHLY=
STRIPE_PRICE_PRO_MONTHLY=

# Resend (2)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Cron (1)
CRON_SECRET=

# App (1)
NEXT_PUBLIC_BASE_URL=

# Dev bypass (2 — solo local)
BYPASS_SUBSCRIPTION_CHECK=true
BYPASS_ADMIN_AUTH=true

# Shadow mode (7)
SHADOW_MODE_ENABLED=true
SHADOW_MODE_FLOWS=service:complete,appointment:cancel
SHADOW_MODE=observe_only
SHADOW_NOTIFICATION_ENABLED=true
SHADOW_NOTIFICATION_MODE=observe_only
SHADOW_BATCH_SIZE=20
SHADOW_PROCESSING_TIMEOUT_MIN=5
SHADOW_SCHEDULING_TOLERANCE_SEC=60
```

Ver `docs/architecture/CURRENT/ENVIRONMENT.md` y `.env.example` para detalle completo.

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

**Última actualización:** Junio 2026
**Versión:** 2.1
**Proyecto:** SaaS Prügressy - Wellness & Health