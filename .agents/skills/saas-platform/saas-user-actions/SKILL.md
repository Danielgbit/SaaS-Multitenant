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
*   `send_password_reset_email`

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
*   `get_my_history`
*   `get_my_metrics`
*   `update_my_profile`
*   `set_my_availability`

### 1️⃣1️⃣ CONFIRMACIONES (Post-Servicio)
**Actores:** Owner / Admin / Staff / Employee (propias).
*   `mark_appointment_completed` — empleado marca "Listo"
*   `confirm_service_collection` — recepcionista cobra
*   `confirm_by_reception`
*   `adjust_price`
*   `cancel_confirmation`
*   `mark_manually`
*   `view_confirmation_logs`
*   `create_walkin_confirmation`

### 1️⃣2️⃣ PAYROLL (Nómina)
**Actores:** Owner / Admin.
*   `create_payroll_period`
*   `calculate_employee_payroll`
*   `manage_payroll_period` (approve/pay)
*   `recalculate_payroll_item`
*   `update_payroll_item`
*   `generate_payroll_receipt`
*   `send_payroll_receipt_email`
*   `view_payroll_dashboard`
*   `view_payroll_settings`
*   `create_employee_loan`
*   `get_pending_loans`
**Actores:** Employee.
*   `view_my_payroll`

### 1️⃣3️⃣ FINANCIAL EVENTS
**Actores:** Sistema (triggers de BD).
*   `record_financial_event_from_confirmation`
*   `record_financial_event_from_transaction`
*   `record_financial_event_from_payroll`
*   `materialize_appointment_payment_status`
**Actores:** Owner / Admin.
*   `view_appointment_financial_status`
*   `record_appointment_payment`
*   `record_commission_accrual`

### 1️⃣4️⃣ CASH SESSIONS (Caja)
**Actores:** Owner / Admin / Staff.
*   `open_cash_session`
*   `close_cash_session`
*   `create_operation_entry`
*   `pay_employee_from_cash`
*   `void_operation_entry`
*   `audit_payments`
*   `view_session_history`

### 1️⃣5️⃣ CLIENT ACCOUNTS (Cuentas por Cobrar)
**Actores:** Owner / Admin / Staff.
*   `record_client_transaction`
*   `record_client_adjustment`
*   `void_client_transaction`
*   `update_adjustment`
*   `view_client_account_detail`
*   `view_client_accounts_overview`

### 1️⃣6️⃣ INVENTORY (Inventario)
**Actores:** Owner / Admin.
*   `create_inventory_item`
*   `edit_inventory_item`
*   `adjust_stock`
*   `consume_inventory`
*   `record_inventory_purchase`
*   `delete_inventory_item`
*   `view_low_stock_alerts`

### 1️⃣7️⃣ PUBLIC BOOKING (Reservas Públicas)
**Actores:** Cliente final.
*   `view_public_services`
*   `view_available_slots`
*   `select_service`
*   `select_employee`
*   `create_public_booking`
*   `cancel_public_booking`
*   `confirm_booking`

### 1️⃣8️⃣ NOTIFICACIONES V2 (Multicanal)
**Actores:** Owner / Admin.
*   `configure_automation_rules`
*   `edit_message_templates`
*   `configure_notification_providers`
*   `view_notification_queue`
*   `view_notification_messages`
*   `replay_dead_letter`
*   `discard_dead_letter`
*   `requeue_stuck_notifications`
**Actores:** Sistema.
*   `process_notification_queue`
*   `evaluate_automation_rules`
*   `resolve_channel_provider`
*   `send_whatsapp_message`
*   `send_email_message`
*   `send_in_app_notification`

### 1️⃣9️⃣ WHATSAPP (Legacy V1)
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

### 2️⃣0️⃣ BILLING (Facturación)
**Actores:** Owner.
*   `view_current_plan`
*   `change_plan`
*   `cancel_subscription`
*   `view_payment_history`

**Actores:** Sistema.
*   `validate_plan_limits`
*   `update_subscription_status`
*   `process_webhook_payment`

### 2️⃣1️⃣ ANALYTICS (Métricas)
**Actores:** Owner / Admin.
*   `view_daily_appointments`
*   `view_daily_revenue`
*   `view_monthly_revenue`
*   `view_top_services`
*   `view_employee_performance`
*   `view_cancellation_rate`
*   `view_no_show_rate`

### 2️⃣2️⃣ SETTINGS (Configuración General)
**Actores:** Owner / Admin.
*   `update_business_settings`
*   `configure_public_booking`
*   `configure_automation_settings`
*   `configure_business_hours`
*   `update_data_retention`
*   `trigger_manual_purge`
*   `check_slug_availability`

### 2️⃣3️⃣ PROMO CODES
**Actores:** Sistema.
*   `validate_promo_code`
*   `apply_promo_code`

### 2️⃣4️⃣ ONBOARDING
**Actores:** Owner.
*   `get_onboarding_state`
*   `complete_onboarding`

### 2️⃣5️⃣ SISTEMA (Acciones Automáticas Core)
**Actores:** Sistema.
*   `create_organization_on_signup`
*   `create_owner_profile`
*   `create_trial_subscription`
*   `generate_available_slots`
*   `validate_appointment_overlap`
*   `process_notification_queue`
*   `process_reminder_cron`
*   `process_purge_cron`
*   `process_shadow_validation`
*   `evaluate_worker_alerts`
*   `upsert_worker_heartbeat`
*   `handle_stripe_webhook`
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
