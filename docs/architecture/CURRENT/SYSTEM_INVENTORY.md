# System Inventory — Prügressy

> STATUS: CURRENT IMPLEMENTATION
> Source of truth: código fuente + types generados + migraciones SQL
> Generated: 2026-06-04
> Method: Extracción automatizada + verificación cruzada manual

---

## 1. Métricas Rápidas [VERIFIED]

> Extraído directamente del código. Sin interpretación.

| Métrica | OBSERVED | EXPECTED (docs) | ¿Match? |
|---------|----------|-----------------|---------|
| Migraciones SQL | 73 | 44 | ❌ |
| Tablas públicas | 69 | ~30 (DATABASE.md) | ❌ |
| Pages | 54 | — | — |
| API route files | 26 | — | — |
| Layout files | 5 | — | — |
| Módulos de Server Actions | 26 | 21 (ARCHITECTURE.md) | ❌ |
| Archivos de Action (excl tests) | ~150 | — | — |
| Cron endpoints | 4 | 4 (CRON-JOBS.md) | ✅ |
| Componentes UI primitivos | 10 | — | — |
| Providers | 6 | — | — |
| Hooks | 11 | — | — |
| Variables de entorno (uncommented) | 20 | 82 (INDEX.md) | ❌ |
| Route groups | 3 | — | — |
| Top-level routes (outside groups) | 4 | — | — |
| Archivos TS/TSX en `src/` | 704 | — | — |
| Directorios en `src/lib/` | 23 | — | — |
| Archivos en `src/lib/` | 118 | — | — |
| Archivos en `src/services/` | 18 | — | — |

---

## 2. Stack Tecnológico [VERIFIED]

| Capa | Tecnología | Versión (de package.json) |
|------|-----------|--------------------------|
| Framework | Next.js | ^16.1.6 |
| UI | React | ^19.2.3 (con React Compiler) |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | ^4.x |
| DB/Backend | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth | — |
| ORM | @supabase/ssr + @supabase/supabase-js | — |
| Cache/Estado | TanStack React Query | ^5.x |
| Pagos | Stripe | — |
| Emails | Resend | — |
| UI primitives | shadcn/ui style (propios) | — |
| Animaciones | Framer Motion | — |
| Toasts | Sonner | — |
| Iconos | Lucide | — |
| Validación | Zod | ^4.x |
| Gráficos | Recharts | — |
| Testing | Vitest + Testing Library | — |
| Fuentes heading | **Poppins** (weights 600, 700) | CSS var `--font-heading` |
| Fuentes body | **Manrope** | CSS var `--font-sans` |

> **Drift detectado:** ARCHITECTURE.md documenta "Cormorant Garamond (headings) + Plus Jakarta Sans (body)" — incorrecto.

---

## 3. Mapa de Rutas [VERIFIED]

### Route Groups

```
(auth)/
├── login/page.tsx
├── register/page.tsx
├── forgot-password/page.tsx
└── reset-password/page.tsx

(dashboard)/
├── billing/page.tsx
├── caja/page.tsx
├── calendar/page.tsx
├── clients/page.tsx
├── clients/[id]/page.tsx
├── clients/[id]/account/page.tsx
├── clients/accounts/page.tsx
├── confirmations/page.tsx
├── confirmations/walkin/page.tsx
├── dashboard/page.tsx
├── debts/page.tsx
├── email/page.tsx
├── employees/page.tsx
├── employees/[id]/page.tsx
├── employees/[id]/availability/page.tsx
├── horarios/page.tsx
├── inventory/page.tsx
├── mi/page.tsx
├── notificaciones/page.tsx
├── notificaciones/dead-letter/page.tsx
├── notificaciones/messages/page.tsx
├── notificaciones/messages/[id]/page.tsx
├── notificaciones/validacion/page.tsx
├── payroll/page.tsx
├── payroll/new/page.tsx
├── payroll/[employeeId]/page.tsx
├── payroll/history/page.tsx
├── payroll/mi/page.tsx
├── payroll/period/[periodId]/page.tsx
├── payroll/settings/page.tsx
├── services/page.tsx
├── settings/page.tsx
├── settings/data-retention/page.tsx
├── whatsapp/page.tsx

(public)/
├── confirmar/[token]/page.tsx
├── help/special-days/page.tsx
├── invite/[token]/page.tsx
└── reservar/[slug]/page.tsx
```

### Top-level routes (outside groups)

```
admin/page.tsx
admin/metrics/page.tsx
admin/organizations/page.tsx
admin/organizations/[id]/page.tsx
admin/promo-codes/page.tsx
admin/promo-codes/new/page.tsx
admin/system/notifications/page.tsx
admin/users/page.tsx
dev/typography/page.tsx
onboarding/page.tsx
page.tsx (home)
precios/page.tsx
```

### API Routes

```
api/appointments/route.ts
api/appointments/check-completed/route.ts
api/confirmations/respond/route.ts
api/cron/check-reminders/route.ts
api/cron/process-notifications/route.ts
api/cron/purge-appointments/route.ts
api/cron/shadow-notifications/route.ts
api/email/scheduler/route.ts
api/notifications/route.ts
api/notifications/cutover-checklist/route.ts
api/notifications/dead-letter/discard/route.ts
api/notifications/dead-letter/replay/route.ts
api/notifications/health/route.ts
api/notifications/mark-all-read/route.ts
api/notifications/mark-read/route.ts
api/notifications/messages/route.ts
api/notifications/messages/[id]/route.ts
api/notifications/messages/[id]/replay/route.ts
api/notifications/seed-v2/route.ts
api/notifications/stats/route.ts
api/notifications/stuck/requeue/route.ts
api/slots/route.ts
api/webhooks/notifications/route.ts
api/webhooks/stripe/route.ts
api/whatsapp/scheduler/route.ts
```

### Layouts

```
src/app/layout.tsx                    — Root layout (Poppins+Manrope, ThemeProvider, Toaster)
src/app/(dashboard)/layout.tsx          — Dashboard layout (auth, org, query, providers)
src/app/admin/layout.tsx                — Admin layout
src/app/admin/system/layout.tsx         — Admin system layout
src/app/onboarding/layout.tsx           — Onboarding layout
```

---

## 4. Catálogo de Acciones [VERIFIED]

26 módulos, ~150 archivos de Server Actions:

| Módulo | Archivos clave |
|--------|---------------|
| `admin` | discardDeadLetter, getNotificationSystemHealth, reactivateOrganization, suspendOrganization, createCode, replayDeadLetter, requeueStuckNotifications, processCriticalNotificationAlerts |
| `analytics` | getAppointmentsTrend, getEmployeePerformance, getInsights, getOverviewStats, getRecentActivity, getStaffUtilization, getSystemAlerts, getTodayPulse, getTopServices, getUpcomingAppointments |
| `appointments` | createAppointment, deleteAppointment, purgeAppointments, updateAppointment |
| `auth` | index, resetPassword, sendPasswordResetEmail |
| `availability` | deleteAvailability, overrideActions, setAvailability, spaOverrideActions |
| `billing` | cancelSubscription, createCheckoutSession, createPortalSession, getInvoices, getPlans, getSubscription, reactivateSubscription, requestWhatsAppActivation |
| `cash-sessions` | auditPayments, closeSession, createEntryFromSource, getSessionHistory, getTodaySession, openSession |
| `clientAccounts` | getClientAccountDetail, getClientAccounts, getInventoryProducts, recordAdjustment, recordTransaction, updateAdjustment, voidTransaction |
| `clients` | createClient, deleteClient, updateClient |
| `confirmations` | adjustPrice, cancelConfirmation, confirmByReception, confirmService, createConfirmation, getConfirmationLogs, getConfirmations, getNotifications, markCompleted, markManually, markNotificationRead |
| `cron` | runCheckReminders |
| `email` | getEmailLogs, getEmailSettings, queueEmailMessage, runEmailReminderScheduler, updateEmailSettings |
| `employee` | getMyHistory, getMyMetrics, getMyUpcoming, setMyAvailability, updateMyProfile |
| `employees` | archiveEmployee, countEmployeeRecords, createEmployee, permanentDeleteEmployee, reactivateEmployee, toggleEmployeeStatus, updateEmployee, updateEmployeePayroll, updateEmployeeService, updateEmployeeServiceCommission |
| `financial` | getAppointmentFinancialStatus, recordAppointmentPayment, recordCommissionAccrual |
| `inventory` | adjustStock, consumeInventory, createInventoryItem, deleteInventoryItem, getInventoryItems, recordInventoryPurchase, updateInventoryItem |
| `invitations` | acceptInvitation, cancelInvitation, createInvitation, getInvitations, linkUserToEmployee, resendInvitation, revokeAccess, setupPasswordAndAccept, updateMemberRole, verifyInvitation |
| `notifications` | automations, providers, queue, seedV2, templates, v2-feature-flag |
| `onboarding` | getOnboardingState |
| `operation-entries` | createManualEntry, payEmployee, voidEntry |
| `payroll` | addAppointmentToPayroll, calculateCommission, calculateEmployeePayroll, createEmployeeLoan, createPayrollPeriod, generatePayrollReceipt, getPayrollConfig, getPayrollDashboard, getPayrollItems, getPayrollSettings, getPendingLoans, managePayrollPeriod, recalculatePayrollItem, sendPayrollReceiptEmail, updatePayrollItem |
| `promoCodes` | applyCode, validateCode |
| `public` | cancelPublicBooking, createPublicBooking |
| `services` | createService, toggleServiceStatus, updateService, updateServiceCommission |
| `settings` | checkSlugAvailability, getBookingSettings, updateBookingSettings, updateOrganization |
| `whatsapp` | getWhatsAppLogs, getWhatsAppSettings, resendWhatsAppReminder, runDailyReminderScheduler, sendWhatsAppReminder, testWhatsAppWebhook, updateWhatsAppSettings, whatsApp |

---

## 5. Schema de Base de Datos [DERIVED]

> Calculado a partir de migraciones SQL. 73 migraciones, 69 tablas públicas.

### 5.1 Enumerados (9)

| Nombre | Valores |
|--------|---------|
| `appointment_status` | pending, confirmed, completed, canceled, no_show |
| `confirmation_method` | whatsapp, email, sms, none |
| `integration_status` | disabled, pending, active, suspended |
| `log_level` | info, warn, error, critical |
| `message_status` | pending, processing, sent, failed |
| `organization_status` | active, suspended, maintenance |
| `preferred_contact` | whatsapp, email, call |
| `role_type` | owner, admin, staff |
| `subscription_status` | trial, active, past_due, canceled, unpaid |

> **Nota:** `role_type` en DB solo incluye `owner, admin, staff`. El rol `empleado` existe solo en TypeScript (`src/types/user.ts`) y se maneja a nivel de aplicación, no como constraint de DB.

### 5.2 Tablas por Módulo

**Core (9):** organizations, organization_members, booking_settings, integrations, employees, services, clients, appointments, appointment_services

**Payroll (10):** payroll_config, payroll_periods, payroll_items, period_commissions, payroll_item_loans, employee_loans, organization_payroll_settings, payroll_receipts (legacy), payroll_receipt_services (legacy), payroll_receipt_loans (legacy)

**Notifications V2 (13):** notification_providers, notification_queue, message_templates, automation_rules, notification_conversations, notification_messages, notification_events, notification_inbound_events, dead_letter_notifications, notification_alert_events, notification_worker_heartbeats, confirmation_tokens, notifications (V1 legacy in-app)

**Confirmations (3):** appointment_confirmations, confirmation_logs, confirmation_tokens (shared)

**Financial (8):** financial_events, client_accounts, client_account_transactions, client_product_sales, client_product_discounts, client_payment_methods, cash_sessions, operation_entries

**Billing/Stripe (5):** plans, subscriptions, invoices, payments, payment_methods

**Inventory (1):** inventory_items

**Shadow (3):** shadow_validation_logs, shadow_notification_seeds, shadow_notification_logs

**Admin (2):** platform_admins, admin_audit_logs

**System (3):** daily_analytics, system_logs, user_profiles

**Misc (8):** employee_availability, employee_availability_overrides, employee_services, employee_invitations, spa_availability_overrides, promo_codes, promo_code_usages, whatsapp_activation_requests

**Legacy V1 (6):** whatsapp_settings, whatsapp_messages, whatsapp_logs, email_settings, email_logs, payroll_receipts (+ 2 subtablas)

### 5.3 Vistas (1)

- `cash_session_summary`

### 5.4 Funciones (25)

| Función | Propósito |
|---------|-----------|
| `handle_new_user()` | Trigger: crea org + owner + booking_settings + integrations al registrar |
| `handle_new_user_profile()` | Trigger: crea user_profiles al registrar |
| `sync_user_profile_email()` | Trigger: sincroniza email en user_profiles |
| `slugify(input)` | Genera slug URL-safe |
| `generate_unique_slug(base_slug)` | Slug único con sufijo si existe |
| `get_user_organization_ids(p_user_id)` | SECURITY DEFINER: evita recursión RLS |
| `can_resend_invitation(p_invitation_id)` | Rate limit: max 10 resends/hora |
| `calculate_daily_analytics(p_org_id, p_date)` | Precalcula métricas del día |
| `claim_notification_batch(...)` | SKIP LOCKED: claim atómico de cola |
| `update_client_account_balance()` | Trigger: recalcula balance |
| `decrement_inventory_on_sale()` | Trigger: descuenta stock |
| `fn_financial_event_from_confirmation_log()` | Trigger: crea financial_event desde confirmación |
| `fn_financial_event_from_client_transaction()` | Trigger: crea financial_event desde transacción |
| `fn_financial_events_from_paid_period()` | Trigger: commission_settled al pagar período |
| `fn_materialize_appointment_payment_status()` | Trigger: deriva payment_status en appointments |
| `fn_commission_accrued_from_confirmation_log()` | Trigger: accrual de comisión |
| `fn_prevent_financial_events_mutation()` | Trigger: protege append-only |
| `handle_void_client_account_transaction()` | Trigger: reversión de transacción |
| `evaluate_worker_alerts()` | Evalúa alertas de workers |
| `upsert_worker_heartbeat(...)` | Heartbeat de workers |
| `update_updated_at()` | Genérico: updated_at |
| `update_updated_at_column()` | Genérico: updated_at |
| `update_daily_analytics_updated_at()` | updated_at para analytics |
| `update_email_settings_updated_at()` | updated_at para email_settings |
| `update_whatsapp_settings_updated_at()` | updated_at para whatsapp_settings |

### 5.5 Triggers (17)

| Trigger | Tabla | Evento |
|---------|-------|--------|
| `on_auth_user_created` | auth.users | INSERT → handle_new_user |
| `on_auth_user_created_profile` | auth.users | INSERT → handle_new_user_profile |
| `on_auth_user_email_changed` | auth.users | UPDATE → sync_user_profile_email |
| `trg_update_client_account_balance` | client_account_transactions | INSERT |
| `trg_financial_event_from_confirmation_log` | confirmation_logs | INSERT |
| `trg_financial_event_from_client_transaction` | client_account_transactions | INSERT |
| `trg_financial_events_from_paid_period` | payroll_periods | UPDATE status |
| `trg_materialize_appointment_payment_status` | financial_events | INSERT |
| `trg_commission_accrued_from_confirmation_log` | confirmation_logs | INSERT |
| `trg_prevent_financial_events_mutation` | financial_events | DELETE |
| `update_updated_at` triggers (6+) | Varias tablas | UPDATE |

### 5.6 RLS [DERIVED]

**53 tablas con RLS habilitado.** ~99 políticas.

Patrones de política:
- **Org-scoped SELECT:** `organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())`
- **Role-scoped INSERT/UPDATE:** mismo filtro + `AND role IN ('owner', 'admin')`
- **Employee self-view:** `user_id = auth.uid()` en employees
- **Public access:** employee_invitations (verify token), confirmation_tokens (respond)
- **Service role only:** shadow tables, notification_queue INSERT/UPDATE

### 5.7 Índices [DERIVED]

~130+ índices, incluyendo:
- **Compuestos:** `idx_appointments_org_id`, `idx_notification_queue_org_status`, `idx_daily_analytics_org_date`, `idx_clients_org_id`
- **Parciales:** `idx_notifications_user_unread WHERE read = FALSE`, `idx_inventory_low_stock WHERE quantity <= min_quantity`, `idx_promo_codes_active WHERE is_active = true`, `idx_notification_queue_status_scheduled WHERE status IN ('pending', 'processing')`
- **Únicos:** `idx_conv_org_phone`, `idx_inbound_provider_msg`, `idx_msg_provider_id`, `uq_open_session`
- **GIN:** `idx_confirmation_logs_metadata`, `idx_notifications_metadata`, `idx_logs_drift_types`

---

## 6. Roles y Permisos [VERIFIED]

### DB enum `role_type`
- `owner`, `admin`, `staff`

### TypeScript type `UserRole`
- `owner`, `admin`, `staff`, `empleado`

> **Drift detectado:** `empleado` no existe como constraint DB. Se maneja exclusivamente en aplicación.

### Permisos efectivos (desde `src/lib/rbac.ts`)

| Rol | Acceso completo | Restricciones |
|-----|----------------|---------------|
| owner | Todo | — |
| admin | Todo | — |
| staff | Agenda, clientes, confirmaciones, invitaciones | Oculto: employees, payroll, inventory, whatsapp, email, settings, billing |
| empleado | Agenda personal, confirmaciones propias, payroll/mi | Oculto: employees, clients, services, inventory, whatsapp, email, settings, billing |

---

## 7. Infraestructura [INFERRED]

> Conclusiones arquitectónicas basadas en los datos observados.

### 7.1 Estado de V1 vs V2

| Sistema | V1 (Legacy) | V2 (Activo) | Evidencia |
|---------|-------------|-------------|-----------|
| **Notificaciones** | whatsapp_messages (3 refs) | notification_queue (48 refs) | 16x más referencias V2 |
| **Payroll** | payroll_receipts (1 ref) | payroll_periods + payroll_items (34 refs) | 34x más referencias V2 |
| **Confirmaciones** | notifications V1 | confirmation_logs + appointment_confirmations | Flujo dual con V2 activo |
| **Shadow Mode** | shadow/index.ts (deprecated stub) | notifications/shadow/ (5 archivos activos) | Doc confirmado |

### 7.2 Capa Financiera Canónica

`financial_events` es la capa append-only autoritativa para finanzas. Se alimenta desde:
- `confirmation_logs` (confirmaciones de citas)
- `client_account_transactions` (cuentas por cobrar)
- `payroll_periods` (comisiones liquidadas)

### 7.3 Coexistencia V1+V2 Documentada

El sistema opera con sistemas duales en payroll y notificaciones. Shadow mode valida equivalencia entre V1 y V2 sin impacto en producción.

---

## 8. Reference Counts [DERIVED]

> Ocurrencias en `src/` para entidades clave. Útil para decidir CURRENT vs LEGACY.

| Entidad | Ref count en src/ | Estado inferido |
|---------|-------------------|-----------------|
| `notification_queue` | 48 | Activo (V2) |
| `payroll_periods` | 34 | Activo (V2) |
| `notification_providers` | 20 | Activo |
| `employee_loans` | 13 | Activo |
| `confirmation_logs` | 12 | Activo |
| `financial_events` | 5 | Activo (nuevo) |
| `whatsapp_messages` | 3 | Legacy |
| `payroll_receipts` | 1 | Legacy |
| `shadow_validation_logs` | 0 | Deprecated |

---

## 9. Legacy Inventory [DERIVED]

| Entidad | Estado | V2 destino | Evidencia |
|---------|--------|------------|-----------|
| `whatsapp_settings` | Legacy | `notification_providers` | Migration completed |
| `whatsapp_messages` | Legacy | `notification_queue` | 3 refs vs 48 |
| `whatsapp_logs` | Legacy | `notification_messages` | — |
| `email_settings` | Legacy | `notification_providers` | Migration completed |
| `email_logs` | Legacy | `notification_queue` | — |
| `payroll_receipts` | Legacy | `payroll_periods` + `payroll_items` | 1 ref vs 34 |
| `payroll_receipt_services` | Legacy | `period_commissions` | — |
| `payroll_receipt_loans` | Legacy | `payroll_item_loans` | — |
| `notifications` (V1 in-app) | Legacy | `notification_events` + `notification_queue` | — |
| `src/lib/shadow/index.ts` | Deprecated | `src/lib/notifications/shadow/` | Stub no-op confirmado |

---

## 10. Variables de Entorno [VERIFIED]

20 variables activas (sin comentar):

| Variable | Requerida | Se usa en |
|----------|-----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Service role client |
| `STRIPE_SECRET_KEY` | Condicional | Stripe API |
| `STRIPE_PRICE_BASIC_MONTHLY` | Condicional | Stripe prices |
| `STRIPE_PRICE_PRO_MONTHLY` | Condicional | Stripe prices |
| `RESEND_API_KEY` | Sí | Resend email |
| `RESEND_FROM_EMAIL` | Sí | Resend sender |
| `CRON_SECRET` | Prod | Cron auth |
| `NEXT_PUBLIC_BASE_URL` | Dev | Base URL |
| `BYPASS_SUBSCRIPTION_CHECK` | Dev | Feature flag |
| `BYPASS_ADMIN_AUTH` | Dev | Feature flag |
| `SHADOW_MODE_ENABLED` | Opcional | Shadow mode |
| `SHADOW_MODE_FLOWS` | Opcional | Shadow mode |
| `SHADOW_MODE` | Opcional | Shadow mode |
| `SHADOW_NOTIFICATION_ENABLED` | Opcional | Shadow notifications |
| `SHADOW_NOTIFICATION_MODE` | Opcional | Shadow notifications |
| `SHADOW_BATCH_SIZE` | Opcional | Shadow notifications |
| `SHADOW_PROCESSING_TIMEOUT_MIN` | Opcional | Shadow notifications |
| `SHADOW_SCHEDULING_TOLERANCE_SEC` | Opcional | Shadow notifications |

Comentadas/opcionales: `STRIPE_WEBHOOK_SECRET`, `WASENDER_WEBHOOK_TOKEN`, `WEBHOOK_SECRET`, `PROCESS_NOTIFICATIONS_DRY_RUN`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_FLAG_NEW_WIDGETS`, `NEXT_PUBLIC_FLAG_STAFF_UTIL`

---

## 11. Cron Jobs [VERIFIED]

| Endpoint | Método | Intervalo documentado |
|----------|--------|----------------------|
| `POST /api/cron/check-reminders` | POST | 3 min |
| `POST /api/cron/process-notifications` | POST | 5 min |
| `POST /api/cron/purge-appointments` | POST | Diario 2 AM |
| `POST /api/cron/shadow-notifications` | POST | 5 min |

Auth: `Authorization: Bearer <CRON_SECRET>`

---

## 12. Drift Documental Detectado [DERIVED]

> Afirmaciones de documentación actual que NO coinciden con el inventario.

| # | Documento | Afirmación | Real | Impacto |
|---|-----------|-----------|------|---------|
| D-01 | `ARCHITECTURE.md:68` | "44 migraciones" | 73 migraciones | Alto |
| D-02 | `ARCHITECTURE.md:48` | "21 módulos" actions | 26 módulos | Alto |
| D-03 | `ARCHITECTURE.md:143` | "Cormorant Garamond + Plus Jakarta Sans" | Poppins + Manrope | Alto |
| D-04 | `DATABASE.md:5` | "44 migraciones" | 73 migraciones | Alto |
| D-05 | `DATABASE.md:11` | "44 migraciones aplicadas" | 73 migraciones | Alto |
| D-06 | `INDEX.md:87-88` | Referencia `ARCHITECTURE_GOVERNANCE.md` | No existe | Alto |
| D-07 | `INDEX.md:89` | Referencia `OPERATIONAL_VISUAL_SYSTEMS.md` | No existe | Alto |
| D-08 | `INDEX.md:49-66` | Ruta `docs/architecture/FUTURE/` | Archivos en `src/docs/architecture/` | Alto |
| D-09 | `INDEX.md:25` | ".env.example (82 vars)" | 20 vars activas, 82 líneas total (comentarios+blancos) | Medio |
| D-10 | `README.md` | Template GitLab sin personalizar | No describe el proyecto | Crítico |
| D-11 | `ROADMAP.md:5` | "v1.0 MVP" | Sistema en V2 (payroll, notifications, confirmations) | Alto |
| D-12 | `ROADMAP.md` | "Next.js 14" (en diagrama) | Next.js 16 | Alto |
| D-13 | `saas-screen-map` | Rutas con prefijo `/dashboard/` | Rutas planas: `/calendar`, `/clients`, etc. | Crítico |
| D-14 | `saas-system-flow` | Usa `whatsapp_messages` como entidad principal | 3 refs vs 48 de notification_queue | Crítico |
| D-15 | `saas-system-flow` | Payroll describe V1 (payroll_receipts) | V2 activo (payroll_periods+items) | Crítico |
| D-16 | `saas-user-actions` | Faltan acciones de payroll, confirmations, financial, cash-sessions | Existen en código | Medio |
| D-17 | `DB role_type` | `empleado` no está en enum DB | Existe en TypeScript tipo UserRole | Medio |
