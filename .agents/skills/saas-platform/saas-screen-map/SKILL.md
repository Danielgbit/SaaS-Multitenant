---
name: saas-screen-map
description: Reference for the entire screen architecture, routing map, and UI component hierarchy of the SaaS platform. Use this skill whenever you need to create new pages, implement routing, design layouts, or build components to ensure they align with the defined structure (Auth, Dashboard, Booking, etc.) and expose the correct user actions.
---

# Mapa de Pantallas (Screen Map) del SaaS

Esta skill documenta la arquitectura de navegación, las rutas del sistema y la jerarquía visual de componentes. Consúltala siempre que debas crear nuevas páginas, diseñar Layouts, componer interfaces o vincular botones con sus respectivas Server Actions.

El SaaS cuenta con **4 tipos principales de interfaces**:

1. **Auth** (Login, Register, Password Reset)
2. **Onboarding** (Setup inicial del negocio)
3. **Dashboard** (Gestión interna — ~30 páginas)
4. **Público** (Booking, confirmación, invitación)

---

## Rutas Reales (desde `src/app/`)

### Auth `(auth)`

| Ruta | Pantalla |
|------|----------|
| `/login` | Login |
| `/register` | Register |
| `/forgot-password` | Recuperar contraseña |
| `/reset-password` | Resetear contraseña |

### Public `(public)`

| Ruta | Pantalla |
|------|----------|
| `/reservar/[slug]` | Booking público (wizard 3 pasos) |
| `/confirmar/[token]` | Confirmación de cita vía link |
| `/invite/[token]` | Aceptar invitación de empleado |
| `/help/special-days` | Help: días especiales |

### Dashboard `(dashboard)`

| Ruta | Pantalla | Roles |
|------|----------|-------|
| `/dashboard` | Overview analítico (KPIs, tendencias) | owner, admin, staff |
| `/calendar` | Calendario semanal de citas | owner, admin, staff, empleado |
| `/clients` | Lista de clientes + búsqueda | owner, admin, staff |
| `/clients/[id]` | Detalle de cliente + historial | owner, admin, staff |
| `/clients/[id]/account` | Cuenta/crédito del cliente | owner, admin, staff |
| `/clients/accounts` | Vista general cuentas por cobrar | owner, admin |
| `/employees` | Gestión de empleados | owner, admin |
| `/employees/[id]` | Detalle de empleado | owner, admin |
| `/employees/[id]/availability` | Disponibilidad de empleado | owner, admin |
| `/services` | Catálogo de servicios | owner, admin, staff |
| `/confirmations` | Panel de confirmaciones (recepción) | owner, admin, staff, empleado |
| `/confirmations/walkin` | Confirmación walk-in | owner, admin, staff |
| `/payroll` | Nómina general | owner, admin |
| `/payroll/new` | Nueva liquidación | owner, admin |
| `/payroll/[employeeId]` | Nómina por empleado | owner, admin |
| `/payroll/mi` | Mi nómina (vista empleado) | empleado |
| `/payroll/history` | Historial de nómina | owner, admin |
| `/payroll/period/[periodId]` | Detalle de período | owner, admin |
| `/payroll/settings` | Configuración de nómina | owner, admin |
| `/caja` | Caja del día (cash register) | owner, admin, staff |
| `/horarios` | Gestión de horarios/availability | owner, admin |
| `/inventory` | Inventario / stock | owner, admin |
| `/debts` | Deudas / cuentas por cobrar | owner, admin |
| `/whatsapp` | Configuración WhatsApp | owner, admin |
| `/email` | Configuración email | owner, admin |
| `/notificaciones` | Centro de notificaciones | owner, admin, staff |
| `/notificaciones/messages` | Historial de mensajes | owner, admin |
| `/notificaciones/messages/[id]` | Detalle de mensaje | owner, admin |
| `/notificaciones/dead-letter` | Cola dead-letter | owner, admin |
| `/notificaciones/validacion` | Validación shadow mode | owner, admin |
| `/settings` | Ajustes de organización | owner, admin |
| `/settings/data-retention` | Retención de datos / purga | owner, admin |
| `/billing` | Facturación / Stripe | owner, admin |
| `/mi` | Mi perfil / espacio personal | owner, admin, staff, empleado |

### Admin global

| Ruta | Pantalla |
|------|----------|
| `/admin` | Admin dashboard |
| `/admin/organizations` | Lista de organizaciones |
| `/admin/organizations/[id]` | Detalle de organización |
| `/admin/users` | Usuarios del sistema |
| `/admin/metrics` | Métricas del sistema |
| `/admin/promo-codes` | Códigos promocionales |
| `/admin/promo-codes/new` | Crear código promocional |
| `/admin/system/notifications` | Sistema de notificaciones admin |

### Otras

| Ruta | Pantalla |
|------|----------|
| `/onboarding` | Setup inicial post-registro |
| `/precios` | Página de precios/planes |
| `/dev/typography` | Guía tipográfica (dev-only) |

---

## Layouts

| Layout | Archivo | Rol |
|--------|---------|-----|
| Root | `src/app/layout.tsx` | Poppins+Manrope, ThemeProvider, Toaster |
| Dashboard | `src/app/(dashboard)/layout.tsx` | Auth check, OrgProvider, QueryProvider, DashboardShell |
| Admin | `src/app/admin/layout.tsx` | Admin shell |
| Admin system | `src/app/admin/system/layout.tsx` | Admin system shell |
| Onboarding | `src/app/onboarding/layout.tsx` | Onboarding shell |

---

## Componentes por Pantalla

### AUTH

**Login** (`/login`): `LoginForm`, `ThemeToggle`
**Register** (`/register`): `RegisterForm`, `ThemeToggle`
**Forgot Password** (`/forgot-password`): `ForgotPasswordForm`
**Reset Password** (`/reset-password`): `ResetPasswordForm`

### ONBOARDING

**Business Setup** (`/onboarding`): `BusinessInfoForm`, `ServiceSetup`, `EmployeeSetup`, `BusinessHoursSetup`

### DASHBOARD — Generales

**Dashboard Overview** (`/dashboard`): `MetricCard`, `Chart`, `TodayPulse`, `QuickActions`, `UpcomingAppointmentsList`

**Calendar** (`/calendar`): `CalendarView`, `AppointmentCard`, `AppointmentDetailModal`, `EditAppointmentModal`, `CalendarToolbar`, `CalendarFooter`, `CreateAppointmentWizard`

**Navegación**: `DashboardShell`, `CollapsibleSidebar`, `Header`, `MobileNav`, `CommandPalette`, `NotificationCenter`

### DASHBOARD — Clientes

**Clients list** (`/clients`): `ClientTable`, `ClientSearchBar`, `CreateClientModal`, `ClientActions`
**Client detail** (`/clients/[id]`): `ClientProfileCard`, `AppointmentHistory`, `AccountBalanceCard`
**Client account** (`/clients/[id]/account`): `TransactionList`, `RecordPaymentForm`, `AdjustmentForm`
**Accounts overview** (`/clients/accounts`): `AccountsTable`, `AccountFilters`

### DASHBOARD — Empleados

**Employees list** (`/employees`): `EmployeeTable`, `CreateEmployeeModal`, `InviteEmployeeModal`
**Employee detail** (`/employees/[id]`): `EmployeeProfileCard`, `PayrollSummaryCard`, `ServiceAssignment`
**Availability** (`/employees/[id]/availability`): `AvailabilityCalendar`, `OverrideForm`

### DASHBOARD — Servicios

**Services** (`/services`): `ServiceList`, `CreateServiceModal`, `EditServiceModal`, `ToggleServiceStatus`

### DASHBOARD — Confirmaciones

**Confirmations** (`/confirmations`): `ConfirmBanner`, `PendingServicesPanel`, `PaymentModal`, `AdjustPriceModal`, `MarkCompletedModal`
**Walk-in** (`/confirmations/walkin`): `WalkinForm`, `ServiceSelector`, `PaymentModal`

### DASHBOARD — Payroll

**Payroll** (`/payroll`): `PayrollDashboard`, `PayrollTable`, `CreatePayrollPeriodModal`
**Employee payroll** (`/payroll/[employeeId]`): `PayrollItemDetail`, `CommissionBreakdown`, `LoanDeductions`
**Mi nómina** (`/payroll/mi`): `EmployeePayrollView`, `ReceiptList`, `LoanStatus`
**New period** (`/payroll/new`): `PayrollPeriodForm`, `EmployeeSelector`
**Period detail** (`/payroll/period/[periodId]`): `PeriodSummary`, `PayrollItemsTable`
**Settings** (`/payroll/settings`): `PayrollConfigForm`, `PayrollSettingsForm`

### DASHBOARD — Caja

**Caja** (`/caja`): `CashSessionPanel`, `OpenSessionForm`, `OperationEntryList`, `CloseSessionForm`, `PaymentAudit`

### DASHBOARD — Horarios

**Horarios** (`/horarios`): `AvailabilityGrid`, `BulkAvailabilityForm`, `SpecialDaysManager`

### DASHBOARD — Inventario

**Inventory** (`/inventory`): `InventoryTable`, `CreateItemModal`, `EditItemModal`, `AdjustStockModal`, `ConsumeModal`, `LowStockAlerts`

### DASHBOARD — Notificaciones

**Notificaciones** (`/notificaciones`): `NotificationList`, `AutomationRulesEditor`, `TemplateEditor`, `ProviderConfig`
**Messages** (`/notificaciones/messages`): `MessageHistoryTable`, `MessageFilters`
**Dead letter** (`/notificaciones/dead-letter`): `DeadLetterQueue`, `ReplayButton`, `DiscardButton`
**Validación** (`/notificaciones/validacion`): `ShadowValidationPanel`, `DriftSummary`, `ComparisonDetail`

### DASHBOARD — Configuración

**Settings** (`/settings`): `OrganizationForm`, `BookingSettingsForm`, `IntegrationStatusCards`, `SlugEditor`
**Data retention** (`/settings/data-retention`): `DataRetentionToggle`, `RetentionDaysSelector`, `ManualPurgeButton`

### DASHBOARD — Otros

**WhatsApp** (`/whatsapp`): `WhatsAppSettingsForm`, `TemplateManager`, `LogViewer`, `ActivationRequest`
**Email** (`/email`): `EmailSettingsForm`, `TemplatePreview`, `LogViewer`
**Billing** (`/billing`): `CurrentPlanCard`, `PricingTable`, `PaymentHistoryTable`, `UpgradeButton`
**Debts** (`/debts`): `DebtsTable`, `DebtFilters`, `PaymentForm`
**Mi** (`/mi`): `MyProfileForm`, `MyAvailabilityEditor`, `MyMetrics`

### PUBLIC

**Booking** (`/reservar/[slug]`): `ServiceSelector`, `EmployeeSelector`, `SlotGrid`, `ClientBookingForm`, `BookingConfirmation`
**Confirmar** (`/confirmar/[token]`): `ConfirmationPage`, `CancellationPage`
**Invite** (`/invite/[token]`): `AcceptInvitationForm`, `PasswordInput`, `InviteErrorPage`
**Help** (`/help/special-days`): `SpecialDaysGuide`

---

## Cómo usar este Screen Map

1. **Routing:** Las rutas son planas bajo `(dashboard)` — sin prefijo `/dashboard/`. Ej: `app/(dashboard)/calendar/page.tsx`.
2. **Jerarquía UI:** Cada pantalla lista sus componentes clave. Usarlos como entrada para composición.
3. **Conexión lógica:** Los eventos interactivos se vinculan a Server Actions documentadas en la skill `saas-user-actions`.
4. **Visibilidad por rol:** La navegación se filtra por rol via `src/lib/navigation.ts` (propiedades `hideForStaff`, `hideForEmpleado`, `showOnlyForEmpleado`).
