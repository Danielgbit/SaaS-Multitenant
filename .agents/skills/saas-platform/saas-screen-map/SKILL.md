---
name: saas-screen-map
description: Reference for the entire screen architecture, routing map, and UI component hierarchy of the SaaS platform. Use this skill whenever you need to create new pages, implement routing, design layouts, or build components to ensure they align with the defined structure (Auth, Dashboard, Booking, etc.) and expose the correct user actions.
---

# Mapa de Pantallas (Screen Map) del SaaS

Esta skill documenta la arquitectura de navegación, las rutas del sistema y la jerarquía visual de componentes. **Consúltala siempre que debas crear nuevas páginas (routes), diseñar Layouts, componer interfaces o vincular botones con sus respectivas Server Actions.**

El SaaS cuenta con **3 tipos principales de interfaces**:
1. `Auth` (Autenticación)
2. `Dashboard` (Gestión interna del negocio)
3. `Booking público` (Cara visible para los clientes)

---

## 🗺️ Mapa Visual Completo de Navegación

```text
AUTH
├─ Login
└─ Register

ONBOARDING
└─ Business Setup

DASHBOARD
├─ Overview
├─ Calendar
├─ Clients
├─ Services
├─ Employees
├─ Automation
└─ Billing

EMPLOYEE
└─ My Schedule

PUBLIC
└─ Booking Page
```

---

## 🖥️ Detalle por Pantallas y Componentes

### 1️⃣ AUTH (Autenticación)

**Pantalla: Login**
*   **User Actions disponibles:** `login`, `reset_password`
*   **Componentes Clave:**
    *   `LoginForm`
    *   `EmailInput`
    *   `PasswordInput`
    *   `SubmitButton`
    *   `ForgotPasswordLink`

**Pantalla: Register**
*   **User Actions disponibles:** `register_account`, `create_organization`
*   **Componentes Clave:**
    *   `RegisterForm`
    *   `BusinessNameInput`
    *   `EmailInput`
    *   `PasswordInput`
    *   `SubmitButton`

---

### 2️⃣ ONBOARDING

**Pantalla: Business Setup**
*   **User Actions disponibles:** `complete_onboarding`, `create_initial_services`, `create_initial_employees`, `set_business_hours`
*   **Componentes Clave:**
    *   `BusinessInfoForm`
    *   `ServiceSetup`
    *   `EmployeeSetup`
    *   `BusinessHoursSetup`

---

### 3️⃣ DASHBOARD (Gestión de Negocio)

**Pantalla: Dashboard Overview**
*   **User Actions disponibles:** `view_daily_appointments`, `view_metrics`
*   **Componentes Clave:**
    *   `TodayAppointmentsCard`
    *   `RevenueTodayCard`
    *   `UpcomingAppointmentsList`
    *   `QuickActionsPanel`

---

### 4️⃣ CALENDAR (Pantalla Principal del Staff/Owner)

**Ruta esperada:** `/dashboard/calendar`
*   **User Actions disponibles:** `view_calendar_week`, `filter_calendar_by_employee`, `create_appointment_from_slot`, `drag_and_drop_appointment`, `open_appointment_details`
*   **Componentes Clave:**
    *   `CalendarView`
    *   `EmployeeFilter`
    *   `AppointmentCard`
    *   `CreateAppointmentModal`
    *   `AppointmentDetailsModal`

---

### 5️⃣ CREATE APPOINTMENT MODAL (Componente Global)

*   **User Actions disponibles:** `create_appointment`, `assign_service`, `assign_employee`, `assign_client`
*   **Componentes Clave (Internos):**
    *   `ClientSearchInput`
    *   `ServiceSelector`
    *   `EmployeeSelector`
    *   `DateTimeSelector`
    *   `ConfirmButton`

---

### 6️⃣ CLIENTS (Clientes)

**Ruta esperada:** `/dashboard/clients`
*   **User Actions disponibles:** `create_client`, `edit_client`, `search_client_by_phone`, `view_client_history`
*   **Componentes Clave:**
    *   `ClientTable`
    *   `ClientSearchBar`
    *   `CreateClientModal`
    *   `ClientProfileModal`

---

### 7️⃣ SERVICES (Servicios)

**Ruta esperada:** `/dashboard/services`
*   **User Actions disponibles:** `create_service`, `edit_service`, `activate_service`, `deactivate_service`
*   **Componentes Clave:**
    *   `ServiceTable`
    *   `CreateServiceModal`
    *   `EditServiceModal`
    *   `ServiceCard`

---

### 8️⃣ EMPLOYEES (Empleados)

**Ruta esperada:** `/dashboard/employees`
*   **User Actions disponibles:** `create_employee`, `edit_employee`, `set_employee_availability`, `invite_employee`
*   **Componentes Clave:**
    *   `EmployeeTable`
    *   `CreateEmployeeModal`
    *   `EmployeeAvailabilityEditor`
    *   `InviteEmployeeModal`

---

### 9️⃣ EMPLOYEE DASHBOARD (Panel exclusivo del Empleado)

**Ruta esperada:** `/dashboard/my-schedule`
*   **User Actions disponibles:** `view_personal_schedule`, `view_next_appointment`, `mark_appointment_completed`, `mark_appointment_no_show`
*   **Componentes Clave:**
    *   `TodaySchedule`
    *   `NextAppointmentCard`
    *   `CompleteAppointmentButton`
    *   `ClientInfoCard`

---

### 🔟 BOOKING PÚBLICO (Vista del Cliente Final)

**Ruta esperada:** `/reservar/[slug]`
*   **User Actions disponibles:** `view_public_services`, `select_service`, `select_employee`, `select_slot`, `create_public_booking`
*   **Componentes Clave:**
    *   `ServiceSelector`
    *   `EmployeeSelector`
    *   `AvailableSlotsGrid`
    *   `ClientBookingForm`
    *   `BookingConfirmation`

---

### 1️⃣1️⃣ AUTOMATION SETTINGS (Configuración de WhatsApp)

**Ruta esperada:** `/dashboard/automation`
*   **User Actions disponibles:** `edit_whatsapp_templates`, `enable_reminders`, `disable_reminders`
*   **Componentes Clave:**
    *   `TemplateEditor`
    *   `ReminderToggle`
    *   `AutomationSettingsCard`

---

### 1️⃣2️⃣ BILLING (Facturación)

**Ruta esperada:** `/dashboard/billing`
*   **User Actions disponibles:** `view_current_plan`, `change_plan`, `cancel_subscription`, `view_payment_history`
*   **Componentes Clave:**
    *   `CurrentPlanCard`
    *   `PricingTable`
    *   `PaymentHistoryTable`
    *   `UpgradePlanButton`
---

## 🚀 Cómo usar este Screen Map en el Código

1. **Estructura de Carpetas:** Este mapa debe dictar la estructura de la carpeta `app/` en Next.js (ej. `app/(dashboard)/dashboard/calendar/page.tsx`).
2. **Jerarquía UI:** Al construir una pantalla, asegúrate de incluir y aislar los *Componentes Clave* listados.
3. **Conexión Lógica:** Cada componente interactivo dentro de estas pantallas debe tener sus eventos (`onClick`, `onSubmit`) ligados a las *User Actions* documentadas en la skill `saas-user-actions`.
