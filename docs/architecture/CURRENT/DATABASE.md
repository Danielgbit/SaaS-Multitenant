# Database Schema

> STATUS: CURRENT IMPLEMENTATION
> Source of truth: `supabase/migrations/` (73 migrations)
> Last updated: 2026-06-04
> System Inventory: `docs/architecture/CURRENT/SYSTEM_INVENTORY.md`

---

## 1. Overview

Base de datos PostgreSQL en Supabase. Esquema multi-tenant con 73 migraciones aplicadas secuencialmente (69 tablas públicas). Toda entidad de negocio está scoped por `organization_id` y aislada via Row Level Security.

### Principios Arquitectónicos

- **PostgreSQL es la fuente de verdad** — No hay cache, read model o realtime channel autoritativo
- **Append-only para finanzas** — `financial_events` es la capa canónica; `payment_status` se deriva de ella
- **RLS como perímetro de seguridad** — Cada tabla tenant-specific filtra por membresía en `organization_members`
- **Migración V1→V2 en progreso** — Payroll, notificaciones y confirmaciones tienen sistemas duales con shadow validation

---

## 2. Multi-Tenant Model

```
organizations ──┬── organization_members ── auth.users
                │
                ├── booking_settings       [1:1]
                ├── integrations           [por tipo]
                 └── ~60 tablas de negocio  [por organization_id]
```

El tenant root es `organizations`. Toda tabla de negocio tiene `organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE` (o accede indirectamente vía FK a una tabla padre que sí lo tiene).

### RLS Pattern

Tres patrones principales:

| Pattern | Ejemplo | Tablas |
|---------|---------|--------|
| Directo por org | `organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())` | ~25 tablas (clients, appointments, services, etc.) |
| Indirecto vía padre | `employee_id IN (SELECT id FROM employees WHERE organization_id IN ...)` | employee_availability, appointment_services, payroll_items |
| Role-scoped (owner/admin) | Misma base + `AND role IN ('owner', 'admin')` | employee_invitations, payroll_periods, notification_providers (INSERT/UPDATE) |

El RLS en `organization_members` usa una función `SECURITY DEFINER` (`get_user_organization_ids()`) para evitar recursión infinita.

---

## 3. Core Entities

### organizations
Raíz del tenant. Una por negocio. Creada automáticamente en registro (`handle_new_user` trigger), excepto para empleados invitados (fix en migración temprana).

### organization_members
Pivote RBAC. `user_id → auth.users`, `organization_id → organizations`. Roles observados en DB: `owner`, `admin`, `staff`, `assistant`, `owner_saas`. Unique: `(organization_id, user_id)`.

### employees
Staff del negocio. `user_id` es nullable (empleados invitados sin cuenta aún). Columnas de payroll: `payment_type` (fijo/porcentaje/mixed), `contract_type` (laboral/prestacion), `employment_type` (full_time/part_time), `base_salary`, `percentage`.

### clients
Clientes con soporte de cuenta de crédito: `credit_limit`, `has_credit_account`, `confirmation_method` (enum), `preferred_contact`.

### services
Catálogo de servicios con precio en `NUMERIC(10,0)` (COP × 1000, migración `services_price_to_integer`). `has_commission BOOLEAN`.

### appointments
Entidad central del sistema. Trackea dos dimensiones de estado:

| Campo | Valores | Propósito |
|-------|---------|-----------|
| `status` | pending, confirmed, completed, canceled, no_show | Ciclo de vida de la cita |
| `confirmation_status` | scheduled, pending_confirmation, completed, confirmed, needs_review | Estado de confirmación post-servicio |

Campos adicionales: `price_adjustment`, `payment_method`, `payment_status` (derivado de `financial_events`), `invoice_id` (protege contra purge).

### appointment_services
Servicios realizados en cada cita. FK a `appointments` y `services`. Unique: `(appointment_id, service_id)`.

---

## 4. Module Entities

### 4.1 Payroll

Sistema dual V1+V2. Ambos coexisten; V2 es el modelo activo.

| Tabla | Dominio | Estado |
|-------|---------|--------|
| `payroll_config` | Config nacional (SMMLV, tasas) | V2 activo |
| `payroll_periods` | Períodos formales (YYYY-MM) | V2 activo |
| `payroll_items` | Items por empleado por período | V2 activo |
| `period_commissions` | Detalle de comisiones por servicio | V2 activo |
| `payroll_item_loans` | Deducciones por préstamo | V2 activo |
| `payroll_receipts` | Recibos V1 | Legacy |
| `payroll_receipt_services` | Detalle V1 | Legacy |
| `payroll_receipt_loans` | Préstamos V1 | Legacy |
| `employee_loans` | Préstamos a empleados | Activo |
| `organization_payroll_settings` | Config por org | Activo |

**Fire-and-forget:** La agregación a payroll ocurre desde `confirmService` y `confirmByReception` vía `addAppointmentToPayroll()` sin esperar resultado. No bloquea el flujo de confirmación.

### 4.2 Notifications (V2)

Arquitectura multicanal con cola, templates y reglas de automatización.

| Tabla | Propósito |
|-------|-----------|
| `notification_providers` | Credenciales por org por canal (wasender, n8n, evolution, resend, etc.) |
| `notification_queue` | Cola unificada con SKIP LOCKED, reintentos, dead-letter |
| `message_templates` | Templates versionables por canal y tipo |
| `automation_rules` | Reglas trigger → canal → template |
| `notification_conversations` | Hilos de conversación por cliente |
| `notification_messages` | Historial de mensajes (inbound/outbound) |
| `notification_events` | Timeline de eventos para observabilidad |
| `notification_inbound_events` | Pipeline de eventos entrantes (replay-safe) |
| `dead_letter_notifications` | Fallos permanentes (replayable) |
| `confirmation_tokens` | Links seguros de confirmación/cancelación |

**Tablas legacy:** `whatsapp_settings`, `whatsapp_logs`, `whatsapp_messages`, `email_settings`, `email_logs` — migradas a V2.

### 4.3 Confirmations

| Tabla | Propósito |
|-------|-----------|
| `appointment_confirmations` | Flujo B: confirmación por servicios (pending_employee → pending_reception → completed/no_show/not_performed) |
| `confirmation_logs` | Auditoría: cada acción (created, confirmed, adjusted, manually_set, cancelled) con actor, rol y precio |
| `notifications` | Notificaciones in-app vía Supabase Realtime |

### 4.4 Billing / Stripe

| Tabla | Propósito |
|-------|-----------|
| `plans` | Planes de suscripción (Basic, Professional, Enterprise) |
| `subscriptions` | Suscripciones por org, vinculadas a Stripe |
| `invoices` | Facturas con `amount_cents INT` y `invoice_pdf_url` |
| `payments` | Transacciones de pago |
| `payment_methods` | Métodos de pago guardados |

### 4.5 Inventory

| Tabla | Propósito |
|-------|-----------|
| `inventory_items` | Productos con stock, precio, categoría. Partial index para low stock |

### 4.6 Client Accounts (Cuentas por Cobrar)

| Tabla | Propósito |
|-------|-----------|
| `client_accounts` | Saldo por cliente, derivado de transacciones |
| `client_account_transactions` | Append-only: sales, payments, refunds, adjustments |
| `client_product_sales` | Productos vendidos por transacción |
| `client_product_discounts` | Descuentos por cliente por producto |
| `client_payment_methods` | Métodos de pago configurables por org |

### 4.7 Financial Events (Canonical Layer)

| Tabla | Propósito |
|-------|-----------|
| `financial_events` | **Append-only.** Registro canónico de todo evento financiero. Con triggers desde `confirmation_logs`, `client_account_transactions` y `payroll_periods`. |

El `payment_status` derivado en `appointments` se materializa via trigger en `financial_events` INSERT.

### 4.8 Employee Invitations

| Tabla | Propósito |
|-------|-----------|
| `employee_invitations` | Invitaciones con token, rol, expiración (7 días). Rate limit: 10 resends/hora |

### 4.9 Promo Codes

| Tabla | Propósito |
|-------|-----------|
| `promo_codes` | Códigos promocionales (trial_extension, free_month, discount) |
| `promo_code_uses` | Tracking de uso por org |

### 4.10 System

| Tabla | Propósito |
|-------|-----------|
| `daily_analytics` | Métricas pre-calculadas por día por org |
| `system_logs` | Logs de aplicación (info, warn, error, critical) |
| `whatsapp_activation_requests` | Solicitudes de activación WhatsApp Business |
| Shadow tables | `shadow_validation_logs`, `shadow_notification_seeds`, `shadow_notification_logs` |

---

## 5. Relationship Map

```
organizations
  ├── organization_members ── auth.users
  ├── booking_settings [1:1]
  ├── integrations
  │
  ├── employees
  │   ├── employee_availability
  │   ├── employee_availability_overrides
  │   ├── employee_services ── services
  │   ├── employee_loans
  │   └── employee_invitations
  │
  ├── services
  │
  ├── clients
  │   ├── client_accounts
  │   │   └── client_account_transactions
  │   │       └── client_product_sales ── inventory_items
  │   └── client_product_discounts ── inventory_items
  │
  ├── appointments
  │   ├── appointment_services ── services
  │   ├── appointment_confirmations
  │   ├── confirmation_logs
  │   ├── confirmation_tokens
  │   └── payroll linkage: period_commissions
  │
  ├── inventory_items
  │
  ├── payroll
  │   ├── payroll_periods ── payroll_items ── period_commissions
  │   │                                    └─ payroll_item_loans ── employee_loans
  │   └── payroll_receipts (legacy)
  │
  ├── notifications (V2)
  │   ├── notification_providers
  │   ├── notification_queue
  │   ├── notification_conversations ── notification_messages
  │   ├── notification_events
  │   └── automation_rules ── message_templates
  │
  ├── billing (Stripe)
  │   ├── subscriptions ── plans
  │   ├── invoices
  │   └── payments
  │
  ├── spa_availability_overrides
  └── daily_analytics

Core system:
  auth.users (Supabase managed)
  ├── organization_members
  └── employees (nullable)
```

---

## 6. Naming Conventions

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Tablas | snake_case, plural | `organization_members`, `employee_availability_overrides` |
| PK | `id UUID DEFAULT gen_random_uuid()` | `id UUID PRIMARY KEY` |
| FK | Columna en singular de la tabla referenciada | `organization_id`, `employee_id`, `client_id` |
| Timestamps | `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ` | En tablas mutables |
| Índices | `idx_{table}_{column}` | `idx_notifications_user_unread` |
| Triggers | `trg_{table}_{event}` | `trg_update_client_account_balance` |
| Funciones | `fn_*` (trigger functions), `calculate_*` (analytics) | `fn_financial_event_from_confirmation_log` |
| RLS Policies | `{table}_{action}` | `notification_providers_select` |
| Montos | V2 usa `NUMERIC(12,2)`. Servicios en `NUMERIC(10,0)` (×1000 COP) | `price NUMERIC(10,0)` |
| Moneda | COP — pesos colombianos sin decimales | `amount NUMERIC(12,2)` |

---

## 7. Data Lifecycle & Retention

- **Purga automática**: Configurable por org via `booking_settings.auto_retention_days` (default 90) y `auto_purge_enabled`
- **Protección**: Citas con `invoice_id IS NOT NULL` no se eliminan
- **Trigger**: Cron diario en `POST /api/cron/purge-appointments`
- **Append-only**: `financial_events` y `client_account_transactions` nunca se eliminan
- **Soft delete vía flag**: `employees.active`, `services.active`, `inventory_items.active`

---

## 8. Triggers Clave

| Trigger | Tabla | Evento | Acción |
|---------|-------|--------|--------|
| `on_auth_user_created` | `auth.users` | INSERT | Crea organización, owner member, booking settings, integration, payroll settings |
| `on_auth_user_created_profile` | `auth.users` | INSERT | Crea `user_profiles` |
| `on_auth_user_email_changed` | `auth.users` | UPDATE | Sincroniza email en `user_profiles` |
| `trg_update_client_account_balance` | `client_account_transactions` | INSERT | Recalcula saldo, is_over_limit, is_at_warning_threshold |
| `trg_financial_event_from_confirmation_log` | `confirmation_logs` | INSERT | Crea `financial_events` desde confirmaciones |
| `trg_financial_event_from_client_transaction` | `client_account_transactions` | INSERT | Crea `financial_events` desde transacciones de clientes |
| `trg_financial_events_from_paid_period` | `payroll_periods` | UPDATE status | Crea `commission_settled` cuando período se paga |
| `trg_commission_accrued_from_confirmation_log` | `confirmation_logs` | INSERT | Accrual de comisión desde confirmación |
| `trg_materialize_appointment_payment_status` | `financial_events` | INSERT | Deriva `appointments.payment_status` |
| `trg_prevent_financial_events_mutation` | `financial_events` | DELETE | Protege append-only de financial_events |
| `handle_void_client_account_transaction` | `client_account_transactions` | AFTER | Reversión de transacción |

---

## 9. Legacy Tables

| Tabla | Reemplazada por | Notas |
|-------|-----------------|-------|
| `whatsapp_settings` | `notification_providers` | Migrada |
| `whatsapp_messages` | `notification_queue` | V1 queue (3 refs en código) |
| `whatsapp_logs` | `notification_messages` | V2 observability |
| `email_settings` | `notification_providers` | Migrada |
| `email_logs` | `notification_messages` | V2 observability |
| `payroll_receipts` | `payroll_periods` + `payroll_items` | V1 payroll (1 ref en código) |
| `payroll_receipt_services` | `period_commissions` | V1 payroll detail |
| `payroll_receipt_loans` | `payroll_item_loans` | V1 payroll loans |
| `notifications` (V1 in-app) | `notification_events` + `notification_queue` | V2 cubre in-app |
| `shadow_validation_logs` | — (Phase 2A deprecada) | Sin referencias en código activo |

---

## 10. Known Technical Debt

- **Dual payroll (V1+V2)** — `payroll_receipts` y `payroll_periods` coexisten. La lógica de negocio debe decidir cuál usar
- **Dual notifications (V1+V2)** — `whatsapp_messages` y `notification_queue` coexisten. Shadow mode valida equivalencia
- **`notifications` table** — Usada por confirmaciones v1 para Realtime. No reemplazada completamente por V2
- **`NUMERIC(10,0)` en servicios** — Precios multiplicados por 1000 (COP). Puede causar confusión en cálculos directos
- **RLS aplicada retroactivamente** — Algunas tablas V1 payroll no tenían RLS hasta migración tardía (`20260527000000`)
- **`financial_events` es reciente** — Los datos históricos no están poblados. Solo eventos posteriores a la creación de la tabla
- **`role_type` enum no incluye `empleado`** — El rol existe solo en TypeScript, no como constraint DB
- **`shadow_validation_logs` sin código activo** — Phase 2A deprecada, tabla huérfana sin lectores

---

## 11. Migration Workflow

```bash
# Migraciones en supabase/migrations/, orden cronológico por nombre de archivo
npx supabase db push          # Aplica pendientes
npx supabase migration list   # Ver estado
```

73 migraciones secuenciales. No saltarse ninguna. Aplicar siempre en orden.

```bash
# Ver inventario completo de migraciones
Get-ChildItem supabase/migrations/ | Sort-Object Name
```

Reglas:
- Migración nueva → si altera entidades core, actualizar este documento
- No eliminar migraciones ya aplicadas en producción
- Usar `COMMENT ON` para documentar tablas y columnas nuevas
- Ver `docs/architecture/CURRENT/SYSTEM_INVENTORY.md` para el inventario completo del sistema
