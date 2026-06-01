---
name: saas-user-actions
description: Defines all allowed user actions and system operations mapped to specific roles (Owner, Admin, Staff, Empleado). Use this skill when implementing Server Actions, API routes, role-based access control (RBAC), UI components, or any feature requiring permission validation. This v2.0 aligns with saas-screen-map v2.0 and saas-system-flow v2.0.
---

# User Actions y Permisos v2.0 — SaaS Prügressy

Esta skill documenta **TODAS** las acciones permitidas en el sistema, mapeadas a los roles que pueden ejecutarlas. **Consúltala siempre que debas crear Server Actions, validar permisos en rutas API, diseñar componentes UI o implementar reglas de validación RBAC.**

---

## 🧠 Actores y Roles

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **owner** | Propietario del negocio | Todo |
| **admin** | Administrador | Todo excepto acciones destructive de org |
| **staff** | Recepcionista/administrativo | Appointments, clients, confirmations |
| **empleado** | Empleado con acceso | Solo agenda propia, payroll propio, marcar completados |
| **Sistema** | Backend y CRON jobs | Automatizaciones, validaciones, webhooks |

---

## 1️⃣ AUTH (Autenticación)

**Roles:** all users

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `login` | Iniciar sesión | `auth/login.ts` |
| `logout` | Cerrar sesión | `auth/logout.ts` |
| `register_account` | Crear cuenta nueva | `auth/register.ts` |
| `request_password_reset` | Solicitar recuperación | `auth/sendPasswordResetEmail.ts` |
| `reset_password` | Recuperar contraseña | `auth/resetPassword.ts` |

---

## 2️⃣ ORGANIZATION (Organización)

**Roles:** Owner

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `create_organization` | Crear negocio | `handle_new_user` trigger |
| `update_business_information` | Actualizar datos del negocio | `settings/updateOrganization.ts` |
| `update_timezone` | Cambiar zona horaria | `settings/updateOrganization.ts` |
| `update_contact_information` | Actualizar contacto | `settings/updateOrganization.ts` |
| `update_branding` | Actualizar logo/marca | `settings/updateOrganization.ts` |
| `delete_organization` | Eliminar organización | — (solo owner, no implementado en UI) |

**Roles:** Owner / Admin

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `update_organization` | Actualizar organización | `settings/updateOrganization.ts` |

---

## 3️⃣ ONBOARDING (Configuración Inicial)

**Roles:** Owner

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `complete_onboarding` | Completar setup inicial | `settings/updateBookingSettings.ts` |
| `create_initial_services` | Crear servicios iniciales | `services/createService.ts` |
| `create_initial_employees` | Crear empleados iniciales | `employees/createEmployee.ts` |
| `set_business_hours` | Configurar horarios del SPA | `availability/setAvailability.ts` |

---

## 4️⃣ EMPLOYEES (Empleados)

**Roles:** Owner / Admin

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `create_employee` | Crear empleado | `employees/createEmployee.ts` |
| `edit_employee` | Editar datos personales | `employees/updateEmployee.ts` |
| `activate_employee` | Activar empleado | `employees/toggleEmployeeStatus.ts` |
| `deactivate_employee` | Desactivar empleado | `employees/toggleEmployeeStatus.ts` |
| `archive_employee` | Archivar empleado | `employees/archiveEmployee.ts` |
| `permanent_delete_employee` | Eliminar permanentemente | `employees/permanentDeleteEmployee.ts` |
| `reactivate_employee` | Reactivar empleado | `employees/reactivateEmployee.ts` |
| `set_employee_availability` | Configurar disponibilidad | `availability/setAvailability.ts` |
| `assign_employee_to_service` | Asignar servicio | `employees/updateEmployeeService.ts` |
| `update_employee_service` | Actualizar servicio asignado | `employees/updateEmployeeService.ts` |
| `update_employee_service_commission` | Cambiar comisión por servicio | `employees/updateEmployeeServiceCommission.ts` |
| `update_employee_payroll` | Configurar payroll del empleado | `employees/updateEmployeePayroll.ts` |
| `count_employee_records` | Contar registros del empleado | `employees/countEmployeeRecords.ts` |

**Roles:** Owner / Admin / Staff

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `view_employees` | Ver lista de empleados | `employees/getEmployees.ts` |
| `view_employee_detail` | Ver detalle de empleado | `employees/getEmployeeWithDetails.ts` |
| `view_employee_services` | Ver servicios del empleado | `employees/getEmployeeServices.ts` |

**Roles:** Owner / Admin / Empleado (limitado a propio)

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `view_my_schedule` | Ver agenda propia | `appointments/getAppointments.ts` |

---

## 5️⃣ EMPLOYEE INVITATIONS (Invitaciones)

**Roles:** Owner / Admin

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `send_employee_invitation` | Enviar invitación | `invitations/createInvitation.ts` |
| `resend_invitation` | Reenviar invitación | `invitations/resendInvitation.ts` |
| `cancel_invitation` | Cancelar invitación | `invitations/cancelInvitation.ts` |
| `revoke_access` | Revocar acceso | `invitations/revokeAccess.ts` |
| `remove_employee_access` | Remover acceso al sistema | `invitations/revokeAccess.ts` |
| `update_member_role` | Cambiar rol en org | `invitations/updateMemberRole.ts` |
| `link_user_to_employee` | Vincular user a empleado | `invitations/linkUserToEmployee.ts` |

**Roles:** Empleado (al aceptar invitación)

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `verify_invitation` | Verificar token de invitación | `invitations/verifyInvitation.ts` |
| `accept_invitation` | Aceptar invitación | `invitations/acceptInvitation.ts` |
| `setup_password_and_accept` | Crear password y aceptar | `invitations/setupPasswordAndAccept.ts` |

---

## 6️⃣ APPOINTMENTS (Citas y Reservas Internas)

**Roles:** Owner / Admin / Staff

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `create_appointment` | Crear cita interna | `appointments/createAppointment.ts` |
| `edit_appointment` | Editar cita | `api/appointments route` |
| `cancel_appointment` | Cancelar cita | `api/appointments route` |
| `reschedule_appointment` | Reprogramar cita | `api/appointments route` |
| `assign_employee_to_appointment` | Asignar empleado | (en create/edit) |
| `assign_service_to_appointment` | Asignar servicio(s) | (en create/edit) |
| `assign_client_to_appointment` | Asignar cliente | (en create/edit) |
| `open_appointment_details` | Ver detalle de cita | `appointments/getAppointment.ts` |
| `check_completed` | Verificar citas completadas | `api/appointments/check-completed` |
| `purge_appointments` | Purgar citas canceladas antiguas | `appointments/purgeAppointments.ts` |

**Roles:** Owner / Admin

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `drag_and_drop_appointment` | Mover cita arrastrando | `api/appointments route` |

---

## 7️⃣ CALENDAR (Calendario)

**Roles:** Owner / Admin / Staff

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `view_calendar_day` | Vista de un día | `appointments/getAppointments.ts` |
| `view_calendar_week` | Vista semanal | `appointments/getAppointments.ts` |
| `filter_calendar_by_employee` | Filtrar por empleado | `appointments/getAppointments.ts` |
| `create_appointment_from_slot` | Crear desde slot disponible | `appointments/createAppointment.ts` |
| `view_available_slots` | Ver slots disponibles | `api/slots route` |

---

## 8️⃣ CONFIRMATIONS (Sistema de Confirmación Post-Servicio)

**Roles:** Owner / Admin / Staff / Empleado

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `get_pending_confirmations` | Obtener confirmaciones pendientes | `confirmations/getConfirmations.ts` |
| `get_notifications` | Obtener notificaciones realtime | `confirmations/getNotifications.ts` |
| `mark_notification_read` | Marcar notificación leída | `confirmations/markNotificationRead.ts` |
| `mark_all_notifications_read` | Marcar todas leídas | `api/notifications/mark-all-read` |

**Roles:** Empleado

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `confirmService` | Marcar servicio como completado ("Listo") | `confirmations/markCompleted.ts` |
| `mark_appointment_completed` | Marcar cita completada | `confirmations/markCompleted.ts` |
| `mark_appointment_no_show` | Marcar como no asistido | `confirmations/markNoShow.ts` |

**Roles:** Staff / Admin / Owner

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `confirmByReception` | Confirmar con método de pago | `confirmations/confirmByReception.ts` |
| `adjustPrice` | Ajustar precio antes de confirmar | `confirmations/adjustPrice.ts` |
| `cancel_confirmation` | Cancelar confirmación | `confirmations/cancelConfirmation.ts` |
| `create_walkin_appointment` | Crear cita de paso/walk-in | `confirmations/createConfirmation.ts` |
| `mark_manually` | Marcar manualmente | `confirmations/markManually.ts` |
| `get_confirmation_logs` | Ver historial de confirmaciones | `confirmations/getConfirmationLogs.ts` |

---

## 9️⃣ EMPLOYEE DASHBOARD (Panel del Empleado)

**Roles:** Empleado

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `view_personal_schedule` | Ver agenda personal | `appointments/getAppointments.ts` |
| `view_next_appointment` | Ver próxima cita | `appointments/getUpcomingAppointments.ts` |
| `view_client_details` | Ver datos del cliente | `clients/getClientDetail.ts` |
| `mark_appointment_completed` | Marcar como completado | `confirmations/markCompleted.ts` |
| `mark_appointment_no_show` | Marcar no asistió | `confirmations/markNoShow.ts` |
| `view_my_payroll` | Ver mi nómina | `payroll/getMyPayroll.ts` |
| `view_my_payroll_receipts` | Ver mis recibos | `payroll/getPayrollReceipts.ts` |
| `view_my_loans` | Ver mis préstamos | `payroll/getPendingLoans.ts` |

---

## 🔟 CLIENTS (Clientes)

**Roles:** Owner / Admin / Staff

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `create_client` | Crear cliente | `clients/createClient.ts` |
| `edit_client` | Editar cliente | `clients/updateClient.ts` |
| `delete_client` | Eliminar cliente | `clients/deleteClient.ts` |
| `search_client_by_phone` | Buscar por teléfono | `clients/getClients.ts` |
| `view_client_history` | Ver historial de citas | `clients/getClientDetail.ts` |
| `add_client_notes` | Agregar notas | `clients/updateClient.ts` |
| `view_client_detail` | Ver detalle de cliente | `clients/getClientDetail.ts` |

---

## 1️⃣1️⃣ CLIENT ACCOUNTS (Cuentas por Cobrar)

**Roles:** Owner / Admin / Staff

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `view_client_accounts` | Ver todas las cuentas | `clientAccounts/getClientAccounts.ts` |
| `view_client_account_detail` | Ver detalle de cuenta | `clientAccounts/getClientAccountDetail.ts` |
| `record_transaction` | Registrar transacción (charge/payment) | `clientAccounts/recordTransaction.ts` |
| `get_inventory_products` | Ver productos (linked) | `clientAccounts/getInventoryProducts.ts` |

---

## 1️⃣2️⃣ SERVICES (Servicios)

**Roles:** Owner / Admin

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `create_service` | Crear servicio | `services/createService.ts` |
| `edit_service` | Editar servicio | `services/updateService.ts` |
| `activate_service` | Activar servicio | `services/toggleServiceStatus.ts` |
| `deactivate_service` | Desactivar servicio | `services/toggleServiceStatus.ts` |
| `set_service_duration` | Cambiar duración | `services/updateService.ts` |
| `set_service_price` | Cambiar precio | `services/updateService.ts` |
| `set_service_buffer` | Configurar buffer | `services/updateService.ts` |
| `update_service_commission` | Cambiar comisión global | `services/updateServiceCommission.ts` |

---

## 1️⃣3️⃣ PAYROLL (Nómina y Comisiones)

**Roles:** Owner / Admin

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `view_payroll_dashboard` | Ver dashboard de nómina | `payroll/getPayrollDashboard.ts` |
| `view_payroll_summary` | Ver resumen general | `payroll/getPayrollSummary.ts` |
| `create_payroll_period` | Crear nuevo período | `payroll/createPayrollPeriod.ts` |
| `manage_payroll_period` | Gestionar período | `payroll/managePayrollPeriod.ts` |
| `recalculate_payroll_item` | Recalcular item específico | `payroll/recalculatePayrollItem.ts` |
| `calculate_commission` | Calcular comisión | `payroll/calculateCommission.ts` |
| `calculate_employee_payroll` | Calcular nómina empleado | `payroll/calculateEmployeePayroll.ts` |
| `generate_payroll_receipt_pdf` | Generar PDF del recibo | `payroll/generatePayrollReceipt.ts` |
| `send_payroll_receipt_email` | Enviar recibo por email | `payroll/sendPayrollReceiptEmail.ts` |
| `finalize_payroll_period` | Finalizar período | `payroll/managePayrollPeriod.ts` |
| `mark_payroll_paid` | Marcar como pagado | `payroll/updatePayrollItem.ts` |
| `view_employee_payroll` | Ver nómina de empleado | `payroll/getPayrollItems.ts` |
| `create_employee_loan` | Crear préstamo | `payroll/createEmployeeLoan.ts` |
| `add_loan_payment` | Registrar pago de préstamo | `payroll/createEmployeeLoan.ts` |
| `get_pending_loans` | Ver préstamos pendientes | `payroll/getPendingLoans.ts` |
| `update_payroll_settings` | Actualizar settings | `payroll/managePayrollPeriod.ts` |
| `get_payroll_config` | Ver configuración | `payroll/getPayrollConfig.ts` |
| `get_payroll_settings` | Ver settings | `payroll/getPayrollSettings.ts` |

**Roles:** Owner / Admin / Staff / Empleado (ver su propia nómina)

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `view_my_payroll` | Ver mi nómina | `payroll/getPayrollItems.ts` (filtered) |

---

## 1️⃣4️⃣ INVENTORY (Inventario)

**Roles:** Owner / Admin

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `view_inventory` | Ver inventario | `inventory/getInventoryItems.ts` |
| `create_inventory_item` | Crear item | `inventory/createInventoryItem.ts` |
| `update_inventory_item` | Actualizar item | `inventory/updateInventoryItem.ts` |
| `delete_inventory_item` | Eliminar item | `inventory/deleteInventoryItem.ts` |
| `adjust_stock` | Ajustar stock | `inventory/adjustStock.ts` |
| `get_low_stock_alerts` | Ver alertas de stock bajo | `inventory/getInventoryItems.ts` |

---

## 1️⃣5️⃣ PUBLIC BOOKING (Reservas Públicas)

**Roles:** Cliente (público sin cuenta)

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `view_public_services` | Ver servicios disponibles | `services/getServices.ts` (public) |
| `select_service` | Seleccionar servicio(s) | — (UI action) |
| `select_employee` | Seleccionar empleado | — (UI action) |
| `view_available_slots` | Ver horarios disponibles | `api/slots route` |
| `select_slot` | Seleccionar slot | — (UI action) |
| `create_public_booking` | Crear reserva pública | `public/createPublicBooking.ts` |
| `cancel_public_booking` | Cancelar reserva | `public/cancelPublicBooking.ts` |
| `confirm_booking` | Confirmar reserva | — (automatic after create) |
| `apply_promo_code` | Aplicar código promocional | `promoCodes/applyCode.ts` |
| `validate_promo_code` | Validar código | `promoCodes/validateCode.ts` |

---

## 1️⃣6️⃣ WHATSAPP (Integración WhatsApp)

**Roles:** Sistema

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `send_appointment_confirmation` | Enviar confirmación | `whatsapp/sendWhatsAppReminder.ts` (cron) |
| `send_24h_reminder` | Recordatorio 24h antes | `whatsapp/runDailyReminderScheduler.ts` (cron) |
| `send_2h_reminder` | Recordatorio 2h antes | `whatsapp/runDailyReminderScheduler.ts` (cron) |
| `send_post_service_message` | Mensaje post-servicio | `whatsapp/sendWhatsAppReminder.ts` |
| `update_message_status` | Actualizar estado | `whatsapp/whatsApp.ts` (webhook) |
| `process_whatsapp_queue` | Procesar cola de mensajes | `whatsapp/runDailyReminderScheduler.ts` (cron) |

**Roles:** Owner / Admin

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `get_whatsapp_settings` | Ver configuración | `whatsapp/getWhatsAppSettings.ts` |
| `update_whatsapp_settings` | Actualizar settings | `whatsapp/updateWhatsAppSettings.ts` |
| `enable_reminders` | Habilitar recordatorios | `whatsapp/updateWhatsAppSettings.ts` |
| `disable_reminders` | Deshabilitar recordatorios | `whatsapp/updateWhatsAppSettings.ts` |
| `edit_whatsapp_templates` | Editar templates | `whatsapp/updateWhatsAppSettings.ts` |
| `get_whatsapp_logs` | Ver logs de mensajes | `whatsapp/getWhatsAppLogs.ts` |
| `resend_whatsapp_reminder` | Reenviar recordatorio | `whatsapp/resendWhatsAppReminder.ts` |
| `send_whatsapp_reminder` | Enviar recordatorio manual | `whatsapp/sendWhatsAppReminder.ts` |
| `run_daily_reminder_scheduler` | Ejecutar scheduler | `whatsapp/runDailyReminderScheduler.ts` (cron) |
| `test_whatsapp_webhook` | Probar webhook | `whatsapp/testWhatsAppWebhook.ts` |

---

## 1️⃣7️⃣ EMAIL (Email)

**Roles:** Sistema

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `queue_email_message` | Encolar email | `email/queueEmailMessage.ts` |
| `run_email_reminder_scheduler` | Ejecutar scheduler de emails | `email/runEmailReminderScheduler.ts` (cron) |

**Roles:** Owner / Admin

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `get_email_settings` | Ver configuración | `email/getEmailSettings.ts` |
| `update_email_settings` | Actualizar settings | `email/updateEmailSettings.ts` |
| `get_email_logs` | Ver logs de emails | `email/getEmailLogs.ts` |

---

## 1️⃣8️⃣ BILLING (Facturación y Suscripciones)

**Roles:** Owner

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `view_current_plan` | Ver plan actual | `billing/getSubscription.ts` |
| `view_plans` | Ver planes disponibles | `billing/getPlans.ts` |
| `change_plan` | Cambiar de plan | `billing/createCheckoutSession.ts` |
| `cancel_subscription` | Cancelar suscripción | `billing/cancelSubscription.ts` |
| `reactivate_subscription` | Reactivar suscripción | `billing/reactivateSubscription.ts` |
| `view_payment_history` | Ver historial de pagos | `billing/getInvoices.ts` |
| `get_invoices` | Obtener facturas | `billing/getInvoices.ts` |
| `create_checkout_session` | Crear sesión de pago | `billing/createCheckoutSession.ts` |
| `create_portal_session` | Crear portal de Stripe | `billing/createPortalSession.ts` |
| `request_whatsapp_activation` | Solicitar activación WhatsApp | `billing/requestWhatsAppActivation.ts` |

**Roles:** Sistema

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `validate_plan_limits` | Validar límites del plan | — (RLS/check on create) |
| `update_subscription_status` | Actualizar estado | `settings/updateOrganization.ts` / webhook |
| `process_webhook_payment` | Procesar webhook de pago | `api/webhooks/stripe route` |

---

## 1️⃣9️⃣ ANALYTICS (Métricas)

**Roles:** Owner / Admin

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `view_daily_appointments` | Ver citas del día | `analytics/getOverviewStats.ts` |
| `view_daily_revenue` | Ver revenue del día | `analytics/getDashboardData.ts` |
| `view_monthly_revenue` | Ver revenue mensual | `analytics/getDashboardData.ts` |
| `view_appointments_trend` | Ver tendencia de citas | `analytics/getAppointmentsTrend.ts` |
| `view_top_services` | Ver servicios más populares | `analytics/getTopServices.ts` |
| `view_employee_performance` | Ver performance de empleados | `analytics/getEmployeePerformance.ts` |
| `view_cancellation_rate` | Ver tasa de cancelación | `analytics/getOverviewStats.ts` |
| `view_no_show_rate` | Ver tasa de no-show | `analytics/getOverviewStats.ts` |
| `get_system_alerts` | Ver alertas del sistema | `analytics/getSystemAlerts.ts` |
| `view_recent_activity` | Ver actividad reciente | `analytics/getRecentActivity.ts` |

---

## 2️⃣0️⃣ SETTINGS (Configuración General)

**Roles:** Owner / Admin

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `update_business_settings` | Actualizar settings de negocio | `settings/updateOrganization.ts` |
| `update_organization` | Actualizar organización | `settings/updateOrganization.ts` |
| `configure_public_booking` | Configurar booking público | `settings/updateBookingSettings.ts` |
| `configure_business_hours` | Configurar horarios | `settings/updateBookingSettings.ts` |
| `get_booking_settings` | Obtener booking settings | `settings/getBookingSettings.ts` |
| `update_booking_settings` | Actualizar booking settings | `settings/updateBookingSettings.ts` |
| `configure_automation_settings` | Configurar automatización | `settings/updateBookingSettings.ts` |
| `update_data_retention_policy` | Actualizar política de retención | — |

---

## 2️⃣1️⃣ NOTIFICATIONS (Notificaciones)

**Roles:** all users (Own)

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `get_notifications` | Obtener notificaciones | `confirmations/getNotifications.ts` |
| `mark_notification_read` | Marcar como leída | `confirmations/markNotificationRead.ts` |
| `mark_all_notifications_read` | Marcar todas como leídas | `api/notifications/mark-all-read` |

---

## 2️⃣2️⃣ ADMIN (Administración)

**Roles:** Sistema / Owner only

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `view_admin_dashboard` | Ver dashboard admin | `admin/getAdminDashboard.ts` |
| `view_all_organizations` | Ver todas las organizaciones | `admin/getOrganizations.ts` |
| `manage_organization` | Gestionar organización | `admin/manageOrganization.ts` |
| `create_promo_code` | Crear código promocional | `admin/createCode.ts` |
| `validate_promo_code` | Validar código (admin) | `promoCodes/validateCode.ts` |
| `apply_promo_code` | Aplicar código (admin) | `promoCodes/applyCode.ts` |

---

## 2️⃣3️⃣ SYSTEM (Acciones Automáticas Core)

**Roles:** Sistema

| Action | Descripción | Trigger |
|--------|-------------|---------|
| `create_organization_on_signup` | Crear org al registrar | `handle_new_user` trigger |
| `create_owner_profile` | Crear perfil de owner | `handle_new_user` trigger |
| `create_trial_subscription` | Crear suscripción trial | `handle_new_user` trigger |
| `generate_available_slots` | Generar slots disponibles | `api/slots route` |
| `validate_appointment_overlap` | Validar no overlap | `appointments/create.ts` |
| `log_system_event` | Registrar evento | Various |
| `log_audit_event` | Registrar auditoría | Confirmation logs |
| `purge_old_appointments` | Purgar citas antiguas | `cron/purge-appointments` |
| `check_trial_expiration` | Verificar trials | `cron/check-reminders` |
| `process_email_queue` | Procesar cola email | `cron/email-scheduler` |

---

## 2️⃣4️⃣ INTEGRATIONS (Integraciones)

**Roles:** Owner / Admin

| Action | Descripción | Server Action |
|--------|-------------|---------------|
| `get_integration_status` | Ver estado de integración | `integrations/getStatus.ts` |
| `update_integration_config` | Actualizar config | `integrations/updateConfig.ts` |

---

## 🗺️ Resumen de Actions por Rol

| Rol | Cantidad de Actions | Áreas Principales |
|-----|---------------------|-------------------|
| owner | ~120 | Todas |
| admin | ~110 | Todas excepto admin, delete org |
| staff | ~40 | Appointments, clients, confirmations, view |
| empleado | ~15 | Agenda propia, payroll propio, completar |
| sistema | ~20 | Automatizaciones, webhooks, triggers |

---

## 🚀 Cómo Usar Esta Skill

### 1. Server Actions
Verificar que cada acción tenga su Server Action correspondiente:
```typescript
// Example: create_appointment action
'use server'
export async function createAppointment(data: AppointmentInput) {
  // 1. Validate role
  // 2. Check permissions
  // 3. Execute business logic
  // 4. Return result
}
```

### 2. RBAC in Components
```typescript
// Check role before rendering
const role = await getUserRole();
if (!canAccess('create_employee', role)) {
  return null; // Hide component
}
```

### 3. Route Protection
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const role = await getRoleFromSession(request);
  if (!canAccessRoute(request.path, role)) {
    return NextResponse.redirect('/dashboard');
  }
}
```

---

**Última actualización:** Mayo 2026
**Versión:** 2.0
**Proyecto:** SaaS Prügressy - Wellness & Health
**Skills relacionadas:** `saas-screen-map` (v2.0), `saas-system-flow` (v2.0)