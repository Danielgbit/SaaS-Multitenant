---
name: saas-user-actions
description: Defines all allowed user actions and system operations mapped to specific roles (Owner, Admin, Staff, Employee, Client, System). Use this skill when implementing Server Actions, API routes, role-based access control (RBAC), UI components, or any feature requiring permission validation.
---

# User Actions y Permisos del SaaS

Esta skill documenta todas las acciones permitidas dentro del sistema, mapeadas a los roles específicos que pueden ejecutarlas. **Consúltala siempre que debas crear Server Actions, validar permisos en rutas API, diseñar componentes UI iterativos o implementar reglas de validación.**

## 🧠 Tipos de Usuarios (Actores)

El sistema define quién puede ejecutar acciones basado en los siguientes roles:

*   **Owner:** Dueño del negocio (máximo privilegio).
*   **Admin:** Administrador del negocio (privilegios delegados por el Owner).
*   **Staff:** Recepcionista o personal administrativo.
*   **Employee:** Empleado que presta los servicios.
*   **Cliente:** Público general (sin cuenta en el sistema).
*   **Sistema:** Acciones automáticas ejecutadas por el backend y CRON jobs.

---

## 🔒 Acciones por Entidad y Permisos

### 1️⃣ AUTH (Autenticación)
**Actores:** Usuarios del negocio.
*   `register_account`
*   `login`
*   `logout`
*   `reset_password`

### 2️⃣ ORGANIZATION (Organización)
**Actores:** Solo Owner / Admin.
*   `create_organization`
*   `update_business_information`
*   `update_timezone`
*   `update_contact_information`

### 3️⃣ ONBOARDING (Configuración Inicial)
**Actores:** Owner.
*   `complete_onboarding`
*   `create_initial_services`
*   `create_initial_employees`
*   `set_business_hours`

### 4️⃣ EMPLOYEES (Empleados)
**Actores:** Owner / Admin.
*   `create_employee`
*   `edit_employee`
*   `activate_employee`
*   `deactivate_employee`
*   `set_employee_availability`
*   `assign_employee_to_service`
*   `archive_employee`
*   `permanent_delete_employee`

### 5️⃣ INVITACIÓN DE EMPLEADOS
**Actores:** Owner / Admin.
*   `send_employee_invitation`
*   `resend_invitation`
*   `link_user_to_employee`
*   `remove_employee_access`

### 6️⃣ SERVICES (Servicios)
**Actores:** Owner / Admin.
*   `create_service`
*   `edit_service`
*   `activate_service`
*   `deactivate_service`
*   `set_service_duration`
*   `set_service_price`
*   `set_service_buffer`

### 7️⃣ CLIENTS (Clientes)
**Actores:** Owner / Admin / Staff.
*   `create_client`
*   `edit_client`
*   `search_client_by_phone`
*   `view_client_history`
*   `add_client_notes`

### 8️⃣ APPOINTMENTS (Citas y Reservas Internas)
**Actores:** Owner / Admin / Staff.
*   `create_appointment`
*   `edit_appointment`
*   `cancel_appointment`
*   `reschedule_appointment`
*   `assign_employee_to_appointment`
*   `assign_service_to_appointment`
*   `view_appointment_details`

### 9️⃣ CALENDAR (Calendario)
**Actores:** Usuarios internos (Owner, Admin, Staff, Employee - limitados a su vista).
*   `view_calendar_day`
*   `view_calendar_week`
*   `filter_calendar_by_employee`
*   `create_appointment_from_slot`
*   `drag_and_drop_appointment`
*   `open_appointment_details`

### 🔟 EMPLOYEE DASHBOARD (Panel de Empleado)
**Actores:** Employee.
*   `view_personal_schedule`
*   `view_next_appointment`
*   `view_client_details`
*   `mark_appointment_completed`
*   `mark_appointment_no_show`

### 1️⃣1️⃣ PUBLIC BOOKING (Reservas Públicas)
**Actores:** Cliente final.
*   `view_public_services`
*   `view_available_slots`
*   `select_service`
*   `select_employee`
*   `create_public_booking`
*   `cancel_public_booking`
*   `confirm_booking`

### 1️⃣2️⃣ AUTOMATIZACIÓN WHATSAPP
**Actores:** Sistema.
*   `send_appointment_confirmation`
*   `send_24h_reminder`
*   `send_2h_reminder`
*   `send_post_service_message`
*   `update_message_status`

**Actores:** Owner / Admin.
*   `edit_whatsapp_templates`
*   `enable_reminders`
*   `disable_reminders`

### 1️⃣3️⃣ BILLING (Facturación)
**Actores:** Owner.
*   `view_current_plan`
*   `change_plan`
*   `cancel_subscription`
*   `view_payment_history`

**Actores:** Sistema.
*   `validate_plan_limits`
*   `update_subscription_status`
*   `process_webhook_payment`

### 1️⃣4️⃣ ANALYTICS (Métricas)
**Actores:** Owner / Admin.
*   `view_daily_appointments`
*   `view_daily_revenue`
*   `view_monthly_revenue`
*   `view_top_services`
*   `view_employee_performance`
*   `view_cancellation_rate`
*   `view_no_show_rate`

### 1️⃣5️⃣ SETTINGS (Configuración General)
**Actores:** Owner / Admin.
*   `update_business_settings`
*   `configure_public_booking`
*   `configure_automation_settings`
*   `configure_business_hours`

### 1️⃣6️⃣ SISTEMA (Acciones Automáticas Core)
**Actores:** Sistema.
*   `create_organization_on_signup`
*   `create_owner_profile`
*   `create_trial_subscription`
*   `generate_available_slots`
*   `validate_appointment_overlap`
*   `process_whatsapp_queue`
*   `log_system_events`

---

## 🗺️ Mapa Resumen de User Actions

```text
AUTH
├─ register_account
├─ login
└─ logout

ORGANIZATION
├─ create
└─ update

EMPLOYEES
├─ create_employee
├─ edit_employee
├─ set_availability
├─ invite_employee
├─ archive_employee
└─ permanent_delete_employee

SERVICES
├─ create_service
├─ edit_service
└─ set_duration

CLIENTS
├─ create_client
├─ search_client
└─ view_history

APPOINTMENTS
├─ create
├─ reschedule
├─ cancel
├─ complete
└─ no_show

BOOKING
├─ view_services
├─ select_slot
└─ confirm_booking

AUTOMATION
├─ send_confirmation
├─ send_reminder
└─ send_feedback

BILLING
├─ view_plan
├─ change_plan
└─ cancel_subscription
```

---

## 🚀 Cómo usar estas User Actions en el Código

Cualquier funcionalidad nueva que se construya, debe basarse obligatoriamente en estas acciones. Estas acciones se traducen directamente en la arquitectura de la aplicación en las siguientes capas:

### 1. Server Actions (Backend)
Deben crearse funciones específicas validando el rol que ejecuta la acción:
*   `createAppointment()`
*   `cancelAppointment()`
*   `createClient()`
*   `inviteEmployee()`
*   `createService()`

### 2. Componentes UI (Frontend)
Deben consumir las Server Actions y renderizarse solos si el usuario tiene el rol adecuado:
*   `CreateAppointmentModal`
*   `ClientSearchInput`
*   `ServiceSelector`
*   `EmployeeSelector`
*   `CalendarEventCard`

### 3. Pantallas (Layout/Pages)
Agrupan los componentes UI correspondientes:
*   `Calendar`
*   `Clients`
*   `Services`
*   `Employees`
*   `Invite Employee`
*   `Booking Page`
*   `Billing`
