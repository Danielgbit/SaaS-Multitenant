---
name: saas-screen-map
description: Reference for the entire screen architecture, routing map, and UI component hierarchy of the SaaS platform. Use this skill whenever you need to create new pages, implement routing, design layouts, or build components to ensure they align with the defined structure (Auth, Dashboard, Booking, etc.) and expose the correct user actions.
---

# Screen Map v2.0 — SaaS Prügressy

Esta skill documenta la arquitectura completa de pantallas, rutas, y jerarquía de componentes del SaaS. **Consúltala siempre que debas crear nuevas páginas, implementar routing, diseñar layouts, o construir componentes que necesiten alinearse con la estructura existente.**

La aplicación se divide en 4 zonas principales:
1. **Auth** — Autenticación (login, password recovery)
2. **Dashboard** — Gestión interna del negocio (protegido por roles)
3. **Public** — Página de reservas pública (acceso sin cuenta)
4. **Admin** — Panel de administración multi-tenant

---

## 1️⃣ AUTH (Autenticación)

**Ruta base:** `/auth` | `(auth)/`

| Ruta | Descripción | User Actions | Componentes Clave |
|------|-------------|--------------|-------------------|
| `/login` | Login principal | `login`, `reset_password` | `LoginForm`, `PasswordInput`, `ThemeToggle` |
| `/forgot-password` | Solicitar recuperación | `request_password_reset` | `ForgotPasswordForm`, `EmailInput` |
| `/reset-password` | Nueva contraseña | `set_new_password` | `PasswordInput`, `PasswordConfirmInput` |

**Flujo de Auth:**
```
/login → (success) → /dashboard
        → (forgot) → /forgot-password → /reset-password
```

**Rutas relacionadas:**
- `/auth/callback` — OAuth callback (Google)

---

## 2️⃣ DASHBOARD (Gestión del Negocio)

**Ruta base:** `(dashboard)/` | Protegido por `organization_members.role`

### 2.1 📊 OVERVIEW (Dashboard Principal)

**Ruta:** `/dashboard`

| Sub-área | Descripción | User Actions | Componentes |
|----------|-------------|--------------|-------------|
| Stats Cards | Métricas rápidas del día | `view_daily_appointments`, `view_daily_revenue` | `StatsCard`, `RevenueTodayCard` |
| Alerts | Notificaciones del sistema | `get_system_alerts` | `AlertsPanel`, `ReminderBanner`, `ConfirmBanner` |
| Recent Activity | Actividad reciente | `view_recent_activity` | `RecentActivity`, `BusinessHealthWidget` |
| Quick Actions | Accesos directos | — | `QuickActionsWidget` |
| Upcoming | Próximas citas | `view_upcoming_appointments` | `UpcomingAppointments` |
| Trends | Gráficos de tendencia | `view_appointments_trend` | `TrendChart` |

### 2.2 📅 CALENDAR (Agenda Principal)

**Ruta:** `/calendar`

| Elemento | Descripción | User Actions | Componentes |
|----------|-------------|--------------|-------------|
| Calendar Grid | Vista semanal/diaria | `view_calendar_day`, `view_calendar_week` | `CalendarGrid`, `CalendarHeader`, `CalendarFooter` |
| Employee Filter | Filtrar por empleado | `filter_calendar_by_employee` | `EmployeeSelectorBar`, `EmployeeChip` |
| Appointment Card | Cita en el calendario | `open_appointment_details` | `AppointmentCard`, `AppointmentCardV2`, `AppointmentClusterCard` |
| Appointment Modal | Crear/editar cita | `create_appointment`, `edit_appointment`, `reschedule_appointment`, `cancel_appointment` | `NewAppointmentWizard`, `AppointmentDetailsModal` |
| Slot Creation | Crear desde slot | `create_appointment_from_slot` | `SlotsPicker`, `ClientSelector` |
| Drag & Drop | Reprogramar cita | `drag_and_drop_appointment` | `AppointmentCard` (draggable) |
| Overflow | Citas overflow | — | `OverflowDropdown`, `AppointmentList` |
| Purge | Eliminar citas canceladas | `purge_appointments` | `PurgeModal` |

**Sub-rutas:**
- `/calendar` — Vista principal

**Wizard de Nueva Cita (`NewAppointmentWizard`):**
1. Seleccionar cliente (`search_client_by_phone`, `create_client`)
2. Seleccionar servicio(s) (`assign_service_to_appointment`)
3. Seleccionar empleado (`assign_employee_to_appointment`)
4. Seleccionar horario (`view_available_slots`)
5. Confirmar

### 2.3 ✅ CONFIRMATIONS (Sistema de Confirmación Post-Servicio)

**Ruta:** `/confirmations`

| Sub-ruta | Descripción | User Actions | Componentes |
|----------|-------------|--------------|-------------|
| `/confirmations` | Panel principal | `get_pending_confirmations` | `ConfirmationsPanel` |
| `/confirmations/employee` | Vista del empleado | `mark_appointment_completed`, `confirmService` | `EmployeeConfirmationView` |
| `/confirmations/reception` | Vista de recepción | `confirmByReception`, `adjustPrice` | `ReceptionConfirmationView` |
| `/confirmations/walkin` | Crear walk-in | `create_walkin_appointment` | `WalkinForm` |

**Indicadores de Urgencia (UI):**
| Tiempo | Color | Estado |
|--------|-------|--------|
| 0-15 min | Verde | Listo para confirmar |
| 15-25 min | Ámbar | Confirmar pronto |
| 25-40 min | Naranja | Urgente |
| 40+ min | Rojo | Crítico |

**Componentes Compartidos:**
- `MarkCompletedModal` — Empleado marca "Listo"
- `PaymentModal` — Reception selecciona método de pago
- `AdjustPriceModal` — Ajuste de precio
- `ConfirmationLogs` — Historial de cambios

### 2.4 👥 EMPLOYEES (Gestión de Empleados)

**Ruta:** `/employees`

| Sub-ruta | Descripción | User Actions | Componentes |
|----------|-------------|--------------|-------------|
| `/employees` | Lista de empleados | `create_employee`, `view_employees` | `EmployeeTable`, `EmployeeCard`, `EmployeeActionMenu` |
| `/employees/[id]` | Detalle del empleado (tabs) | `edit_employee`, `archive_employee`, `set_employee_availability` | Tabs: Info, Services, Availability, Access, Payroll |
| `/employees/[id]/availability` | Disponibilidad dedicada | `set_employee_availability` | `AvailabilityEditor` |

**Tabs de Detalle (`EmployeeDetail`):**
| Tab | Descripción | User Actions |
|-----|-------------|--------------|
| Info | Datos personales, comisión, tipo de pago | `edit_employee`, `update_employee_payroll` |
| Services | Servicios asignados | `assign_employee_to_service`, `update_employee_service` |
| Availability | Horario semanal + overrides | `set_availability`, `spaOverrideActions` |
| Access | Invitación y acceso | `send_employee_invitation`, `revoke_access`, `update_member_role` |
| Payroll | Historial de nómina | `view_employee_payroll`, `create_employee_loan` |

**Componentes:**
- `EmployeeTable` — Tabla con acciones
- `EmployeeCard` — Card para vista mobile
- `InvitationLinkModal` — Generar/copiar link de invitación
- `AvailabilityEditor` — Editor de horarios semanales

### 2.5 👤 CLIENTS (Clientes)

**Ruta:** `/clients`

| Sub-ruta | Descripción | User Actions | Componentes |
|----------|-------------|--------------|-------------|
| `/clients` | Lista de clientes | `create_client`, `search_client_by_phone`, `view_client_history` | `ClientTable`, `ClientSearchBar`, `CreateClientModal` |
| `/clients/[id]` | Perfil del cliente | `edit_client`, `view_client_history`, `add_client_notes` | `ClientProfileModal`, `AppointmentHistory` |
| `/clients/accounts` | Cuentas por cobrar | `view_client_accounts` | `ClientAccountsClient`, `ClientAccountDetailClient` |
| `/clients/[id]/account` | Detalle de cuenta | `record_transaction` | `TransactionList`, `BalanceCard` |

**Componentes:**
- `ClientTable` — Tabla con búsqueda
- `ClientSearchInput` — Búsqueda por teléfono
- `CreateClientModal` — Crear cliente rápido
- `ClientProfileModal` — Ver/editar perfil
- `ClientAccountDetailClient` — Estado de cuenta

### 2.6 🛠️ SERVICES (Servicios)

**Ruta:** `/services`

| Descripción | User Actions | Componentes |
|-------------|--------------|-------------|
| Lista y gestión de servicios | `create_service`, `edit_service`, `activate_service`, `deactivate_service`, `set_service_duration`, `set_service_price`, `set_service_buffer`, `update_service_commission` | `ServiceTable`, `CreateServiceModal`, `EditServiceModal`, `ServiceCard` |

### 2.7 💰 PAYROLL (Nómina y Comisiones)

**Ruta:** `/payroll`

| Sub-ruta | Descripción | User Actions | Componentes |
|----------|-------------|--------------|-------------|
| `/payroll` | Dashboard de nómina | `view_payroll_dashboard` | `PayrollDashboard`, `PayrollSummaryWidget` |
| `/payroll/mi` | Mi nómina (empleado) | `view_my_payroll` | `MyPayrollView`, `PayrollReceiptCard` |
| `/payroll/new` | Crear período | `create_payroll_period` | `CreatePeriodPage`, `PeriodSelector` |
| `/payroll/period/[periodId]` | Detalle de período | `manage_payroll_period`, `recalculate_payroll_item` | `PeriodDetailView`, `ChangesPreviewModal` |
| `/payroll/settings` | Configuración | `update_payroll_settings` | `PayrollSettingsClient` |
| `/payroll/[employeeId]` | Nómina por empleado | `view_employee_payroll`, `calculate_commission` | `EmployeePayrollDetail`, `LoanModal` |

**Componentes:**
- `PayrollDashboard` — Vista general de períodos
- `CreatePeriodPage` — Wizard de creación
- `PeriodDetailView` — Tabla de empleados con net_pay
- `EmployeePayrollDetail` — Desglose de comisiones por servicio
- `ChangesPreviewModal` — Preview de cambios antes de aplicar
- `LoanModal` — Gestión de préstamos
- `PayrollReceiptCard` — Recibo individual

### 2.8 📦 INVENTORY (Inventario)

**Ruta:** `/inventory`

| Descripción | User Actions | Componentes |
|-------------|--------------|-------------|
| Gestión de productos y stock | `view_inventory`, `create_inventory_item`, `update_inventory_item`, `delete_inventory_item`, `adjust_stock`, `get_low_stock_alerts` | `InventoryTable`, `InventoryItemCard`, `StockAdjustmentModal` |

### 2.9 💬 WHATSAPP (Integración WhatsApp)

**Ruta:** `/whatsapp`

| Descripción | User Actions | Componentes |
|-------------|--------------|-------------|
| Configuración y logs | `get_whatsapp_settings`, `update_whatsapp_settings`, `enable_reminders`, `disable_reminders`, `get_whatsapp_logs`, `resend_whatsapp_reminder`, `test_whatsapp_webhook` | `WhatsAppSettingsClient`, `WhatsAppLogs` |

### 2.10 📧 EMAIL (Email)

**Ruta:** `/email`

| Descripción | User Actions | Componentes |
|-------------|--------------|-------------|
| Configuración y logs | `get_email_settings`, `update_email_settings`, `get_email_logs`, `queue_email_message` | `EmailSettingsClient`, `EmailLogs` |

### 2.11 💳 BILLING (Facturación y Suscripciones)

**Ruta:** `/billing`

| Descripción | User Actions | Componentes |
|-------------|--------------|-------------|
| Planes y pagos | `view_current_plan`, `change_plan`, `cancel_subscription`, `view_payment_history`, `request_whatsapp_activation` | `BillingClient`, `CurrentPlanCard`, `PricingTable`, `PaymentHistoryTable`, `PromoCodeInput` |

### 2.12 ⚙️ SETTINGS (Configuración General)

**Ruta:** `/settings`

| Sub-ruta | Descripción | User Actions | Componentes |
|----------|-------------|--------------|-------------|
| `/settings` | Configuración general | `update_business_settings`, `update_organization` | `OrganizationSettingsForm` |
| `/settings/data-retention` | Políticas de retención | `update_data_retention_policy` | `DataRetentionClient` |

### 2.13 🕐 HORARIOS (Horarios del Negocio)

**Ruta:** `/horarios`

| Descripción | User Actions | Componentes |
|-------------|--------------|-------------|
| Horas generales del SPA | `configure_business_hours`, `get_booking_settings`, `update_booking_settings` | `BusinessHoursEditor`, `SpaOverridesEditor` |

---

## 3️⃣ PUBLIC (Reserva Pública)

**Ruta base:** `(public)/`

### 3.1 📅 BOOKING PAGE (Página de Reserva)

**Ruta:** `/reservar/[slug]`

| Paso | Descripción | User Actions | Componentes |
|------|-------------|--------------|-------------|
| 1. Servicios | Seleccionar servicio(s) | `view_public_services`, `select_service` | `ServiceSelector` |
| 2. Empleado | Seleccionar empleado o "cualquiera" | `select_employee` | `EmployeeSelector` |
| 3. Horario | Seleccionar slot disponible | `view_available_slots`, `select_slot` | `SlotsPicker`, `AvailableSlotsGrid` |
| 4. Datos | Ingresar datos personales | `create_public_booking` | `ClientBookingForm` |
| Confirmación | Página de confirmación | `confirm_booking` | `BookingConfirmation` |

**Wizard:** `BookingWizard` — Componente principal que orchesta todo el flujo

### 3.2 📧 INVITATION ACCEPTANCE

**Ruta:** `/invite/[token]`

| Descripción | User Actions | Componentes |
|-------------|--------------|-------------|
| Aceptar invitación empleado | `verify_invitation`, `accept_invitation`, `setup_password_and_accept` | `InvitationAcceptForm`, `PasswordSetupForm` |

### 3.3 ℹ️ HELP PAGES

**Ruta:** `/help/special-days`

| Descripción | User Actions | Componentes |
|-------------|--------------|-------------|
| Información sobre días especiales | — | `SpecialDaysInfo` |

---

## 4️⃣ ADMIN (Panel de Administración)

**Ruta base:** `admin/`

| Sub-ruta | Descripción | User Actions | Componentes |
|----------|-------------|--------------|-------------|
| `/admin` | Dashboard admin | `view_admin_dashboard` | `AdminDashboard` |
| `/admin/organizations` | Gestión de organizaciones | `view_all_organizations` | `OrganizationsTable` |
| `/admin/promo-codes` | Códigos promocionales | `create_promo_code`, `validate_promo_code`, `apply_promo_code` | `PromoCodeInput`, `PromoCodesTable` |
| `/admin/promo-codes/new` | Crear código | `create_promo_code` | `CreatePromoCodeForm` |

---

## 5️⃣ COMPONENTES COMPARTIDOS (Shared)

### Layout Components
| Componente | Descripción | Ubicación |
|------------|-------------|-----------|
| `DashboardShell` | Layout principal del dashboard | Wraps all dashboard pages |
| `Sidebar` | Navegación lateral | Desktop navigation |
| `CollapsibleSidebar` | Sidebar colapsable | Mobile-friendly |
| `MobileNav` | Navegación móvil | Bottom navigation |
| `Header` | Header con org info y user menu | Top bar |
| `NotificationCenter` | Centro de notificaciones | Bell icon dropdown |

### Provider Components
| Componente | Descripción |
|------------|-------------|
| `OrganizationProvider` | Context de org actual |
| `AppointmentModalProvider` | Estado del modal de citas |
| `AppointmentRealtimeProvider` | Suscripción a realtime de citas |
| `PaymentQueueProvider` | Cola de pagos pendientes |
| `ThemeProvider` | Tema de la app |

### Utility Components
| Componente | Descripción |
|------------|-------------|
| `SecurityConfirmationModal` | Confirmación para acciones sensibles |
| `ForceCreationModal` | Forzar creación de cita |

---

## 6️⃣ MAPA DE RUTAS COMPLETO

```
/
├── (auth)/
│   ├── login/
│   └── forgot-password/
│       └── reset-password/
│
├── (dashboard)/            ← Protected by role
│   ├── dashboard/          ← Overview + Analytics
│   ├── calendar/           ← Agenda principal
│   ├── confirmations/
│   │   ├── employee/
│   │   ├── reception/
│   │   └── walkin/
│   ├── employees/
│   │   ├── [id]/
│   │   │   └── availability/
│   ├── clients/
│   │   ├── [id]/
│   │   │   └── account/
│   │   └── accounts/
│   ├── services/
│   ├── payroll/
│   │   ├── mi/
│   │   ├── new/
│   │   ├── settings/
│   │   ├── period/[periodId]/
│   │   └── [employeeId]/
│   ├── inventory/
│   ├── whatsapp/
│   ├── email/
│   ├── billing/
│   ├── settings/
│   │   └── data-retention/
│   └── horarios/
│
├── (public)/               ← Public access
│   ├── reservar/[slug]/
│   ├── invite/[token]/
│   ├── help/special-days/
│   └── precios/
│
└── admin/                  ← Admin only
    ├── organizations/
    └── promo-codes/
        └── new/
```

---

## 7️⃣ JERARQUÍA DE COMPONENTES

```
App
├── (auth)/
│   ├── LoginPage
│   │   └── LoginForm
│   │       ├── EmailInput
│   │       ├── PasswordInput
│   │       └── ThemeToggle
│   └── ForgotPasswordPage
│
├── (dashboard)/
│   ├── DashboardShell
│   │   ├── Sidebar / CollapsibleSidebar
│   │   │   ├── Logo
│   │   │   ├── NavItems (filtered by role)
│   │   │   └── MobileNav
│   │   └── Header
│   │       ├── OrganizationSelector
│   │       ├── NotificationCenter
│   │       └── UserMenu
│   │
│   ├── CalendarPage
│   │   ├── CalendarView
│   │   │   ├── CalendarHeader
│   │   │   ├── CalendarGrid
│   │   │   ├── EmployeeSelectorBar
│   │   │   ├── AppointmentCard / AppointmentCardV2
│   │   │   ├── AppointmentClusterCard
│   │   │   ├── OverflowDropdown
│   │   │   └── AppointmentList
│   │   ├── AppointmentDetailsModal
│   │   └── NewAppointmentWizard
│   │       ├── StepClient
│   │       ├── StepServices
│   │       ├── StepEmployee
│   │       ├── StepDateTime
│   │       └── StepConfirm
│   │
│   ├── ConfirmationsPage
│   │   ├── ConfirmationsPanel
│   │   │   ├── ConfirmationCard
│   │   │   ├── UrgencyIndicator
│   │   │   └── TimeElapsedBadge
│   │   ├── MarkCompletedModal
│   │   ├── PaymentModal
│   │   └── AdjustPriceModal
│   │
│   ├── EmployeesPage
│   │   ├── EmployeeTable
│   │   ├── EmployeeCard
│   │   ├── EmployeeActionMenu
│   │   ├── CreateEmployeeModal
│   │   └── EmployeeDetail
│   │       ├── TabInfo
│   │       ├── TabServices
│   │       ├── TabAvailability
│   │       ├── TabAccess
│   │       └── TabPayroll
│   │
│   ├── ClientsPage
│   │   ├── ClientTable
│   │   ├── ClientSearchBar
│   │   ├── CreateClientModal
│   │   └── ClientDetail
│   │       ├── ClientProfileModal
│   │       └── AppointmentHistory
│   │
│   ├── ServicesPage
│   │   ├── ServiceTable
│   │   └── ServiceCard
│   │
│   ├── PayrollPage
│   │   ├── PayrollDashboard
│   │   ├── PayrollSummaryWidget
│   │   ├── PeriodSelector
│   │   ├── CreatePeriodPage
│   │   ├── PeriodDetailView
│   │   ├── EmployeePayrollDetail
│   │   ├── ChangesPreviewModal
│   │   ├── LoanModal
│   │   └── PayrollSettingsClient
│   │
│   ├── PayrollMiPage (Employee)
│   │   ├── MyPayrollView
│   │   └── PayrollReceiptCard
│   │
│   ├── InventoryPage
│   │   ├── InventoryTable
│   │   ├── InventoryItemCard
│   │   └── StockAdjustmentModal
│   │
│   ├── WhatsAppPage
│   │   ├── WhatsAppSettingsClient
│   │   └── WhatsAppLogs
│   │
│   ├── EmailPage
│   │   ├── EmailSettingsClient
│   │   └── EmailLogs
│   │
│   ├── BillingPage
│   │   ├── BillingClient
│   │   ├── CurrentPlanCard
│   │   ├── PricingTable
│   │   ├── PaymentHistoryTable
│   │   └── PromoCodeInput
│   │
│   ├── SettingsPage
│   │   ├── OrganizationSettingsForm
│   │   └── DataRetentionClient
│   │
│   └── HorariosPage
│       ├── BusinessHoursEditor
│       └── SpaOverridesEditor
│
├── (public)/
│   ├── BookingPage /reservar/[slug]
│   │   └── BookingWizard
│   │       ├── ServiceSelector
│   │       ├── EmployeeSelector
│   │       ├── SlotsPicker
│   │       ├── AvailableSlotsGrid
│   │       ├── ClientBookingForm
│   │       └── BookingConfirmation
│   │
│   ├── InvitePage /invite/[token]
│   │   └── InvitationAcceptForm
│   │
│   └── HelpPage
│
└── Admin
    ├── AdminNav
    ├── AdminDashboard
    ├── OrganizationsTable
    └── PromoCodesPage
```

---

## 8️⃣ ACCESS BY ROLE (Permisos de Navegación)

| Ruta | Owner | Admin | Staff | Empleado |
|------|-------|-------|-------|----------|
| `/dashboard` | ✓ | ✓ | ✓ | ✓ (limitado) |
| `/calendar` | ✓ | ✓ | ✓ | ✗ |
| `/confirmations` | ✓ | ✓ | ✓ | ✓ (employee view) |
| `/employees` | ✓ | ✓ | ✗ | ✗ |
| `/clients` | ✓ | ✓ | ✓ | ✗ |
| `/services` | ✓ | ✓ | ✗ | ✗ |
| `/payroll` | ✓ | ✓ | ✗ | ✗ |
| `/payroll/mi` | ✓ | ✓ | ✓ | ✓ (propia) |
| `/inventory` | ✓ | ✓ | ✗ | ✗ |
| `/whatsapp` | ✓ | ✓ | ✗ | ✗ |
| `/email` | ✓ | ✓ | ✗ | ✗ |
| `/billing` | ✓ | ✗ | ✗ | ✗ |
| `/settings` | ✓ | ✓ | ✗ | ✗ |
| `/admin/*` | ✓ (sistema) | ✗ | ✗ | ✗ |

**Nota:** `empleado` es redirigido automáticamente a `/payroll/mi` al hacer login.

---

## 9️⃣ USER ACTIONS POR PANTALLA

### Dashboard Overview
- `view_daily_appointments`
- `view_daily_revenue`
- `view_monthly_revenue`
- `view_upcoming_appointments`
- `view_recent_activity`
- `get_system_alerts`
- `view_appointments_trend`
- `view_top_services`
- `view_employee_performance`

### Calendar
- `view_calendar_day`
- `view_calendar_week`
- `filter_calendar_by_employee`
- `create_appointment`
- `create_appointment_from_slot`
- `edit_appointment`
- `reschedule_appointment`
- `drag_and_drop_appointment`
- `cancel_appointment`
- `open_appointment_details`
- `assign_employee_to_appointment`
- `assign_service_to_appointment`
- `assign_client_to_appointment`
- `purge_appointments`

### Confirmations
- `get_pending_confirmations`
- `confirmService`
- `mark_appointment_completed`
- `mark_appointment_no_show`
- `confirmByReception`
- `adjustPrice`
- `cancel_confirmation`
- `create_walkin_appointment`
- `get_confirmation_logs`
- `mark_manually`

### Employees
- `create_employee`
- `edit_employee`
- `archive_employee`
- `permanent_delete_employee`
- `reactivate_employee`
- `set_employee_availability`
- `assign_employee_to_service`
- `update_employee_service`
- `update_employee_service_commission`
- `update_employee_payroll`
- `count_employee_records`

### Employee Invitations
- `send_employee_invitation`
- `resend_invitation`
- `verify_invitation`
- `accept_invitation`
- `setup_password_and_accept`
- `revoke_access`
- `remove_employee_access`
- `update_member_role`
- `cancel_invitation`
- `link_user_to_employee`

### Clients
- `create_client`
- `edit_client`
- `delete_client`
- `search_client_by_phone`
- `view_client_history`
- `add_client_notes`

### Client Accounts
- `view_client_accounts`
- `get_client_account_detail`
- `record_transaction`
- `get_inventory_products`

### Services
- `create_service`
- `edit_service`
- `activate_service`
- `deactivate_service`
- `set_service_duration`
- `set_service_price`
- `set_service_buffer`
- `update_service_commission`

### Payroll
- `view_payroll_dashboard`
- `view_payroll_summary`
- `create_payroll_period`
- `manage_payroll_period`
- `recalculate_payroll_item`
- `calculate_commission`
- `calculate_employee_payroll`
- `generate_payroll_receipt_pdf`
- `send_payroll_receipt_email`
- `finalize_payroll_period`
- `mark_payroll_paid`
- `view_employee_payroll`
- `create_employee_loan`
- `add_loan_payment`
- `get_pending_loans`
- `update_payroll_settings`
- `get_payroll_config`
- `get_payroll_settings`

### Inventory
- `view_inventory`
- `create_inventory_item`
- `update_inventory_item`
- `delete_inventory_item`
- `adjust_stock`
- `get_low_stock_alerts`

### Public Booking
- `view_public_services`
- `view_available_slots`
- `select_service`
- `select_employee`
- `select_slot`
- `create_public_booking`
- `cancel_public_booking`
- `confirm_booking`
- `apply_promo_code`
- `validate_promo_code`

### WhatsApp
- `get_whatsapp_settings`
- `update_whatsapp_settings`
- `enable_reminders`
- `disable_reminders`
- `edit_whatsapp_templates`
- `get_whatsapp_logs`
- `resend_whatsapp_reminder`
- `send_whatsapp_reminder`
- `run_daily_reminder_scheduler`
- `test_whatsapp_webhook`

### Email
- `get_email_settings`
- `update_email_settings`
- `get_email_logs`
- `queue_email_message`
- `run_email_reminder_scheduler`

### Billing
- `view_current_plan`
- `change_plan`
- `cancel_subscription`
- `reactivate_subscription`
- `view_payment_history`
- `get_invoices`
- `create_checkout_session`
- `create_portal_session`
- `request_whatsapp_activation`

### Settings
- `update_business_settings`
- `update_organization`
- `update_branding`
- `configure_public_booking`
- `configure_business_hours`
- `get_booking_settings`
- `update_booking_settings`
- `configure_automation_settings`
- `update_data_retention_policy`

### Notifications
- `get_notifications`
- `mark_notification_read`
- `mark_all_notifications_read`

### Admin
- `view_admin_dashboard`
- `view_all_organizations`
- `create_promo_code`
- `validate_promo_code`
- `apply_promo_code`

### System
- `log_system_event`
- `log_audit_event`
- `process_webhook_payment`
- `validate_plan_limits`
- `update_subscription_status`
- `purge_old_appointments`
- `process_email_queue`
- `process_whatsapp_queue`
- `generate_available_slots`
- `validate_appointment_overlap`
- `check_trial_expiration`

---

## 🔟 ICONOS Y NAVIGATION ITEMS

| Sección | Icono | Ruta | Roles |
|---------|-------|------|-------|
| Dashboard | Home | `/dashboard` | all |
| Calendar | Calendar | `/calendar` | owner, admin, staff |
| Confirmations | Bell | `/confirmations` | all |
| Employees | Users | `/employees` | owner, admin |
| Clients | UserCircle | `/clients` | owner, admin, staff |
| Services | Scissors | `/services` | owner, admin |
| Payroll | DollarSign | `/payroll` | owner, admin, empleado (own) |
| Inventory | Package | `/inventory` | owner, admin |
| WhatsApp | MessageCircle | `/whatsapp` | owner, admin |
| Email | Mail | `/email` | owner, admin |
| Billing | CreditCard | `/billing` | owner |
| Settings | Settings | `/settings` | owner, admin |
| Horarios | Clock | `/horarios` | owner, admin |

---

**Última actualización:** Mayo 2026
**Versión:** 2.0
**Proyecto:** SaaS Prügressy - Wellness & Health
