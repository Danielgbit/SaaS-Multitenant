# Product Roadmap - SaaS Prügressy

## Strategy Context

**Business Goal:** Build a B2B scheduling SaaS for wellness/health businesses (barberías, spas, clínicas, centros de bienestar)

**Customer Problems:**
- Gestión manual de citas y horarios
- Sin visibilidad de disponibilidad en tiempo real
- Proceso de reserva tedioso para clientes

**Constraints & Dependencies:**
- Supabase for auth + database
- Next.js 14 App Router
- Multi-tenant architecture (organizations)

---

## Roadmap (Now / Next / Later)

| Stage | Initiative | Outcome | Metric | Notes |
|-------|------------|---------|--------|-------|
| **Now** | Authentication & Organization | Sistema de auth funcional con organizaciones | # usuarios registrados | ✅ Completado |
| **Now** | Employee Management | CRUD de empleados por organización | # empleados activos | ✅ Completado |
| **Now** | Service Management | CRUD de servicios con duración y precio | # servicios configurados | ✅ Completado |
| **Now** | Employee Availability | Configuración de horarios por empleado | % empleados con agenda completa | ✅ Completado |
| **Now** | Slots Engine | Generación de slots disponibles en tiempo real | Slots calculados correctamente | ✅ Completado |
| **Now** | Client Management | CRUD de clientes con grid UI | # clientes registrados | ✅ Completado |
| **Now** | Calendar View | Vista de calendario con citas del día/semana + CRUD completo | Citas visualizadas | ✅ Completado |
| **Now** | Appointment Booking | Crear/cancelar/reschedule citas | Citas creadas exitosamente | ✅ Completado |
| **Now** | Public Booking Page | Página de reservas pública (/reservar/[slug]) | Reservas desde web | ✅ Completado |
| **Now** | WhatsApp Integration | Recordatorios automáticos por WhatsApp via N8N | Tasa de asistencia | ✅ Completado |
| **Now** | Billing & Subscriptions | Planes, pagos Stripe, portal facturación | MRR | ✅ Completado |
| **Now** | Landing Page & Pricing | Página principal con pricing SEO | Tráfico orgánico | ✅ Completado |
| **Now** | Email Automation | Confirmaciones y recordatorios via Resend | Tasa de apertura | ✅ Completado |
| **Now** | Dashboard Analytics | KPIs, gráficos de tendencia, servicios populares | Visibilidad del negocio | ✅ Completado |
| **Now** | Dark Mode | Toggle modo oscuro (Header) | Usuarios que usan dark mode | ✅ Completado |
| **Now** | Settings Page | Página centralizada de configuración | Configuración completada | ✅ Completado |
| **Now** | Inventory Module | Gestión de inventario con límites por plan | Control de inventario | ✅ Completado |
| **Now** | Service Confirmation | Sistema de confirmación de servicios | Flujo empleado→recepción | ✅ Completado |
| **Now** | Employee Invitations | Sistema de invitaciones con link universal | Acceso de empleados | ✅ Completado |
| **Now** | Employee Profile | Perfil de empleado con tabs integrados | Gestión completa | ✅ Completado |

---

## Fase Actual: Review & Testing

- Tests unitarios y de integración

---

## Slots Engine - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------|--------|
| Generate Slots Logic | `src/services/slots/generateSlots.ts` | ✅ |
| Get Appointments | `src/services/appointments/getAppointments.ts` | ✅ |
| API Route (`GET /api/slots`) | `src/app/api/slots/route.ts` | ✅ |
| Server Action (`createAppointment`) | `src/actions/appointments/createAppointment.ts` | ✅ |
| UI Component (`SlotsPicker`) | `src/components/dashboard/SlotsPicker.tsx` | ✅ |

### Pendientes del módulo "Slots Engine"
- [x] Selector de cliente (client_id en createAppointment)
- [x] Mejora UI con design system
- [ ] Tests unitarios

---

## Services Management - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------|--------|
| Página servicios | `src/app/(dashboard)/services/page.tsx` | ✅ |
| Server Action createService | `src/actions/services/createService.ts` | ✅ |
| Server Action updateService | `src/actions/services/updateService.ts` | ✅ |
| Server Action toggleServiceStatus | `src/actions/services/toggleServiceStatus.ts` | ✅ |

### Características implementadas
- CRUD completo de servicios
- Nombre, duración, precio, descripción
- Activar/desactivar servicios
- Validación Zod
- Diseño responsive

---

## Employees Management - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------|--------|
| Página empleados | `src/app/(dashboard)/employees/page.tsx` | ✅ |
| Server Action createEmployee | `src/actions/employees/createEmployee.ts` | ✅ |
| Server Action updateEmployee | `src/actions/employees/updateEmployee.ts` | ✅ |
| Server Action toggleEmployeeStatus | `src/actions/employees/toggleEmployeeStatus.ts` | ✅ |

### Características implementadas
- CRUD completo de empleados
- Nombre, rol, teléfono
- Activar/desactivar empleados
- Enlace a configuración de disponibilidad
- Validación Zod
- Diseño responsive

---

## Client Management - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------|--------|
| Server Action (`createClient`) | `src/actions/clients/createClient.ts` | ✅ |
| Server Action (`updateClient`) | `src/actions/clients/updateClient.ts` | ✅ |
| Server Action (`deleteClient`) | `src/actions/clients/deleteClient.ts` | ✅ |
| UI Component (`ClientsClient`) | `src/app/(dashboard)/clients/ClientsClient.tsx` | ✅ |
| UI Component (`ClientCard`) | `src/app/(dashboard)/clients/ClientCard.tsx` | ✅ |
| UI Component (`EditClientModal`) | `src/app/(dashboard)/clients/EditClientModal.tsx` | ✅ |
| UI Component (`DeleteClientModal`) | `src/app/(dashboard)/clients/DeleteClientModal.tsx` | ✅ |

### Características implementadas
- Grid layout con cards de clientes
- Búsqueda en tiempo real
- Filtros (Todos/Activos)
- Modal unificado para crear y editar
- Confirmación de eliminación
- Validación Zod en Server Actions
- Design system tokens aplicados

---

## Calendar View - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------||
| UI Component (`CalendarView`) | `src/components/dashboard/CalendarView.tsx` | ✅ |
| API Route (`POST /api/appointments`) | `src/app/api/appointments/route.ts` | ✅ |
| API Route (`PATCH /api/appointments`) | `src/app/api/appointments/route.ts` | ✅ |
| API Route (`PUT /api/appointments`) | `src/app/api/appointments/route.ts` | ✅ |
| API Route (`DELETE /api/appointments`) | `src/app/api/appointments/route.ts` | ✅ |
| Modal de nueva cita | Integrada en CalendarView | ✅ |
| Cancelar cita | Integrada en modal de detalles | ✅ |
| Confirmar cita | Integrada en modal de detalles | ✅ |
| Editar cita | Integrada en modal de edición con advertencia de cambio de horario | ✅ |
| Eliminar cita | Integrada en modal de confirmación | ✅ |

### Características implementadas
- Vista de calendario semanal
- Navegación entre semanas (anterior, siguiente, hoy)
- Carga de citas, empleados, clientes y servicios
- Modal de detalles de cita
- Modal de nueva cita con selector de cliente, servicio, empleado y fecha/hora
- Wizard de 3 pasos para nueva cita (Cliente → Servicio/Empleado → Fecha/Hora)
- Botón de cancelar cita
- Botón de confirmar cita
- Verificación de disponibilidad antes de crear cita
- **Editar cita** - con detección de cambio de horario y advertencia
- **Eliminar cita** - con confirmación

---

## Appointment Booking - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------||
| Server Action (`createAppointment`) | `src/actions/appointments/createAppointment.ts` | ✅ |
| Server Action (`updateAppointmentStatus`) | `src/actions/appointments/createAppointment.ts` | ✅ |
| API Route (`POST /api/appointments`) | `src/app/api/appointments/route.ts` | ✅ |
| API Route (`PATCH /api/appointments`) | `src/app/api/appointments/route.ts` | ✅ |

### Características implementadas
- Crear cita con verificación de disponibilidad
- Cancelar cita
- Confirmar cita
- Estados: pending, confirmed, completed, cancelled, no_show
- Revalidación automática del calendario

---

## Public Booking Page - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------|--------|
| Server Action (`createPublicBooking`) | `src/actions/public/createPublicBooking.ts` | ✅ |
| Página pública (`/reservar/[slug]`) | `src/app/(public)/reservar/[slug]/page.tsx` | ✅ |
| Wizard de reservas | `src/components/public/BookingWizard.tsx` | ✅ |

### Características implementadas
- Página pública accesible sin autenticación
- Wizard de 3 pasos: Servicio → Fecha/Hora → Datos del cliente
- Selector de servicio con precio y duración
- Selector de empleado con disponibilidad
- Selector de fecha y horarios disponibles (mañana/tarde)
- Formulario de cliente (nombre, teléfono, email, notas)
- Creación automática de cliente si no existe
- Verificación de disponibilidad antes de confirmar
- Pantalla de confirmación con resumen de la cita

---

## Riesgos y Dependencias

- **Dependencia:** Tabla `appointments` debe existir en Supabase
- **Riesgo:** Race conditions al crear citas simultáneas - mitigado con verificación de disponibilidad
- **Riesgo:** Timezone management - usar `booking_settings.timezone`

---

## Billing & Subscriptions - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------|--------|
| Migración DB | `supabase/migrations/20260314180000_billing_subscriptions.sql` | ✅ |
| Stripe config | `src/lib/stripe.ts` | ✅ |
| Resend config | `src/lib/resend.ts` | ✅ |
| Billing utils | `src/lib/billing/utils.ts` | ✅ |
| Server Actions | `src/actions/billing/` (8 actions) | ✅ |
| UI Billing | `src/components/dashboard/billing/BillingClient.tsx` | ✅ |
| Página billing | `src/app/(dashboard)/billing/page.tsx` | ✅ |
| Página precios (SEO) | `src/app/precios/page.tsx` | ✅ |
| Webhook Stripe | `src/app/api/webhooks/stripe/route.ts` | ✅ |

### Características implementadas
- Planes: Básico (0€), Profesional (29.99€), Enterprise (79.99€)
- Trial de 30 días
- Checkout Session Stripe
- Customer Portal Stripe
- Cancelación al final del período
- Reactivación de suscripción
- Solicitud de activación de WhatsApp (formulario interno)
- Historial de facturas
- Página pública de precios con SEO

---

## WhatsApp Integration - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------|--------|
| Tabla whatsapp_settings | `supabase/migrations/20260315100000_whatsapp_integration.sql` | ✅ |
| Tabla whatsapp_logs | `supabase/migrations/20260315100000_whatsapp_integration.sql` | ✅ |
| Server Action (getWhatsAppSettings) | `src/actions/whatsapp/getWhatsAppSettings.ts` | ✅ |
| Server Action (updateWhatsAppSettings) | `src/actions/whatsapp/updateWhatsAppSettings.ts` | ✅ |
| Server Action (testWhatsAppWebhook) | `src/actions/whatsapp/testWhatsAppWebhook.ts` | ✅ |
| Server Action (sendWhatsAppReminder) | `src/actions/whatsapp/sendWhatsAppReminder.ts` | ✅ |
| Server Action (queueWhatsAppMessage) | `src/actions/whatsapp/whatsApp.ts` | ✅ |
| Server Action (getWhatsAppLogs) | `src/actions/whatsapp/getWhatsAppLogs.ts` | ✅ |
| Server Action (resendWhatsAppReminder) | `src/actions/whatsapp/resendWhatsAppReminder.ts` | ✅ |
| Server Action (runDailyReminderScheduler) | `src/actions/whatsapp/runDailyReminderScheduler.ts` | ✅ |
| API Route (/api/whatsapp/scheduler) | `src/app/api/whatsapp/scheduler/route.ts` | ✅ |
| UI Settings | `src/components/dashboard/whatsapp/WhatsAppSettingsClient.tsx` | ✅ |
| UI Logs | `src/components/dashboard/whatsapp/WhatsAppLogs.tsx` | ✅ |
| Integración en createAppointment | `src/actions/appointments/createAppointment.ts` | ✅ |
| Integración en createPublicBooking | `src/actions/public/createPublicBooking.ts` | ✅ |
| Documentación N8N | `docs/N8N-WHATSAPP-WORKFLOW.md` | ✅ |

### Características implementadas
- Configuración de webhook N8N y API Key
- Prueba de conexión al webhook
- Habilitar/deshabilitar recordatorios
- Configuración de horas antes de la cita (1, 2, 4, 12, 24, 48 horas)
- Envío automático de confirmación al crear cita
- Scheduler diario para recordatorios (consultar `/api/whatsapp/scheduler`)
- Historial de mensajes enviados
- Reenvío de mensajes fallidos
- Integración con dashboard y reservas públicas

### Pendientes
- [x] Considerar `reminder_hours_before` en el scheduler (usar 24h por defecto)
- [x] Usar cola de `whatsapp_messages` en lugar de envío directo (envío directo implementado, cola para futuro)
- [x] UI/UX con design system aplicado

---

## Dashboard - Página Principal

| Componente | Archivo | Estado |
|------------|---------|--------|
| Ruta principal | `src/app/page.tsx` | ✅ |
| Redirección auth | Redirect a /calendar | ✅ |
| Login | `src/app/(auth)/login/page.tsx` | ✅ |
| Register | `src/app/(auth)/register/page.tsx` | ✅ |
| Sidebar | `src/components/dashboard/Sidebar.tsx` | ✅ |

### Características implementadas
- Landing page con pricing SEO
- Autenticación con Supabase Auth
- Redirección automática a /calendar si está logueado
- Sidebar con navegación completa
- Diseño responsive

---

## Employee Availability - Configuración de Horarios

| Componente | Archivo | Estado |
|------------|---------|--------|
| Página disponibilidad | `src/app/(dashboard)/employees/[id]/availability/page.tsx` | ✅ |
| AvailabilityForm | `src/app/(dashboard)/employees/[id]/availability/AvailabilityForm.tsx` | ✅ |
| AvailabilityList | `src/app/(dashboard)/employees/[id]/availability/AvailabilityList.tsx` | ✅ |
| Service getAvailability | `src/services/availability/getAvailability.ts` | ✅ |
| Server Action setAvailability | `src/actions/availability/setAvailability.ts` | ✅ |
| Server Action deleteAvailability | `src/actions/availability/deleteAvailability.ts` | ✅ |
| SEO Metadata | Configurado en page.tsx | ✅ |

### Características implementadas
- Configurar horarios por día de la semana
- Múltiples rangos horarios por día
- Edición y eliminación de horarios
- Validación de horarios
- Resumen de días configurados
- Diseño responsive con dark mode

---

## Landing Page & Pricing - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------|--------|
| Página precios | `src/app/precios/page.tsx` | ✅ |
| SEO Metadata | title, description, keywords, OG | ✅ |
| Canonical URL | https://prugressy.com/precios | ✅ |
| Planes (Básico, Profesional, Enterprise) | getPlans() | ✅ |
| Feature cards | Listado de features | ✅ |
| Links a registro | /register | ✅ |

### Características implementadas
- Página pública de precios (SEO optimizado)
- 3 planes: Básico (0€), Profesional (29.99€), Enterprise (79.99€)
- Lista de features por plan
- Links a página de registro
- Diseño responsive
- Metadata para SEO

---

## Email Automation - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------|--------|
| Migration DB | `supabase/migrations/20260316100000_email_integration.sql` | ✅ |
| Plantillas HTML | `src/lib/email/templates.ts` | ✅ |
| Server Action (getEmailSettings) | `src/actions/email/getEmailSettings.ts` | ✅ |
| Server Action (updateEmailSettings) | `src/actions/email/updateEmailSettings.ts` | ✅ |
| Server Action (queueEmailMessage) | `src/actions/email/queueEmailMessage.ts` | ✅ |
| Server Action (getEmailLogs) | `src/actions/email/getEmailLogs.ts` | ✅ |
| Server Action (runEmailReminderScheduler) | `src/actions/email/runEmailReminderScheduler.ts` | ✅ |
| API Route (/api/email/scheduler) | `src/app/api/email/scheduler/route.ts` | ✅ |
| UI Settings | `src/components/dashboard/email/EmailSettingsClient.tsx` | ✅ |
| UI Logs | `src/components/dashboard/email/EmailLogs.tsx` | ✅ |
| Página /email | `src/app/(dashboard)/email/page.tsx` | ✅ |
| Integración createAppointment | `src/actions/appointments/createAppointment.ts` | ✅ |
| Integración createPublicBooking | `src/actions/public/createPublicBooking.ts` | ✅ |
| Integración updateAppointmentStatus | `src/actions/appointments/createAppointment.ts` | ✅ |

### Características implementadas
- Configuración de emails por organización
- Envío de confirmación al crear cita (dashboard y booking público)
- Envío de recordatorio 24h antes (scheduler)
- Envío de email al cancelar/completar/no-show
- Historial de emails enviados
- Plantillas HTML con diseño premium
- Integración con Resend (3,000 emails/mes gratis)
- Configuración de horas de recordatorio (1-168 horas)

### UI/UX Implementado
- Diseño premium con colores de marca (#0F4C5C)
- Tipografía: Cormorant Garamond (headings) + Plus Jakarta Sans (body)
- Sección de estadísticas en tiempo real
- Tooltips de ayuda contextuales
- Cards con sombras y gradientes
- Toggle switches animados
- Estado vacío (empty states) profesionales
- Tabla de logs con paginación
- Metadata SEO (OpenGraph, Twitter Cards)

### Configuración N8N
- Endpoint: `POST /api/email/scheduler`
- Frecuencia recomendada: cada hora
- Auth: Bearer token (CRON_SECRET)

---

## Dashboard Analytics - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------|--------|
| Migration DB | `supabase/migrations/20260317000000_daily_analytics.sql` | ✅ |
| Dependencias | `recharts`, `date-fns` | ✅ |
| Server Action (getOverviewStats) | `src/actions/analytics/getOverviewStats.ts` | ✅ |
| Server Action (getAppointmentsTrend) | `src/actions/analytics/getAppointmentsTrend.ts` | ✅ |
| Server Action (getTopServices) | `src/actions/analytics/getTopServices.ts` | ✅ |
| Server Action (getDashboardData) | `src/actions/analytics/getDashboardData.ts` | ✅ |
| UI StatsCard | `src/components/dashboard/analytics/StatsCard.tsx` | ✅ |
| UI TrendChart | `src/components/dashboard/analytics/TrendChart.tsx` | ✅ |
| UI TopServicesList | `src/components/dashboard/analytics/TopServicesList.tsx` | ✅ |
| UI PeriodSelector | `src/components/dashboard/analytics/PeriodSelector.tsx` | ✅ |
| UI DashboardClient | `src/components/dashboard/analytics/DashboardClient.tsx` | ✅ |
| Página /dashboard | `src/app/(dashboard)/dashboard/page.tsx` | ✅ |
| Sidebar | `src/components/dashboard/Sidebar.tsx` | ✅ |

### Características implementadas
- KPIs: Citas, Ingresos, Clientes, Tasa de completado
- Gráfico de tendencia de citas (Recharts)
- Lista de servicios populares
- Selector de período (hoy/semana/mes/año/últimos 7/30 días)
- Comparación con período anterior (%)
- Diseño minimalista premium
- Tipografía: Cormorant Garamond + Plus Jakarta Sans
- Metadata SEO básica

---

## Settings Page - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------|--------|
| Página settings | `src/app/(dashboard)/settings/page.tsx` | ✅ |
| SettingsClient | `src/app/(dashboard)/settings/SettingsClient.tsx` | ✅ |
| Server Action getBookingSettings | `src/actions/settings/getBookingSettings.ts` | ✅ |
| Server Action updateBookingSettings | `src/actions/settings/updateBookingSettings.ts` | ✅ |
| Server Action updateOrganization | `src/actions/settings/updateOrganization.ts` | ✅ |
| Ruta en Sidebar | `src/components/dashboard/Sidebar.tsx` | ✅ |

### Características implementadas
- Configuración general: intervalo de cita, buffer, anticipación mínima
- Configuración de organización: nombre, slug (URL pública)
- Zona horaria
- Toggle reservas online
- Links a WhatsApp y Email
- Diseño responsive con dark mode

---

## Inventory Module - Gestión de Inventario

| Componente | Archivo | Estado |
|------------|---------|--------|
| Migración DB | `supabase/migrations/20260318000000_inventory.sql` | ✅ |
| Server Actions | `src/actions/inventory/` (5 actions) | ✅ |
| UI Inventory | `src/app/(dashboard)/inventory/` | ✅ |
| Billing utils | `src/lib/billing/utils.ts` (hasReachedInventoryLimit) | ✅ |
| Ruta Sidebar | `src/components/dashboard/Sidebar.tsx` | ✅ |

### Características implementadas
- CRUD de productos de inventario
- Seguimiento de stock
- Límites por plan (Basic=200, Professional=5000)
- Validación en creación de citas
- Diseño responsive con dark mode

---

## Service Confirmation System - Sistema de Confirmaciones

| Componente | Archivo | Estado |
|------------|---------|--------|
| Migración DB | `supabase/migrations/20260319000000_confirmations.sql` | ✅ |
| Server Actions | `src/actions/confirmations/` (3 actions) | ✅ |
| UI Employee | `src/app/(dashboard)/confirmations/EmployeeConfirmations.tsx` | ✅ |
| UI Reception | `src/app/(dashboard)/confirmations/ReceptionConfirmations.tsx` | ✅ |
| UI Walk-in | `src/app/(dashboard)/confirmations/walkin/WalkinForm.tsx` | ✅ |
| API Route | `src/app/api/appointments/check-completed/route.ts` | ✅ |
| Ruta Sidebar | `src/components/dashboard/Sidebar.tsx` | ✅ |

### Flujo implementado
1. **Empleado**: Selecciona servicios completados → envía a cola de recepción
2. **Recepción**: Confirma servicio, registra cliente, cobra
3. **Walk-in**: Formulario visual paso a paso
4. **N8N**: Detecta citas terminadas cada 1-2 minutos

### Características UX/UI
- Header con gradiente y estadísticas
- Selector visual de servicios
- Filtros por estado
- Selector de método de pago
- Pantalla de éxito

---

## Employee Invitations - Sistema de Invitaciones

| Componente | Archivo | Estado |
|------------|---------|--------|
| Migración DB | `supabase/migrations/20260320000000_employee_invitations.sql` | ✅ |
| Types | `src/types/invitations.ts` | ✅ |
| Server Actions | `src/actions/invitations/` (8 actions) | ✅ |
| UI Invite Modal | `src/app/(dashboard)/employees/InviteEmployeeModal.tsx` | ✅ |
| Página pública | `src/app/(public)/invite/[token]/page.tsx` | ✅ |

### Características implementadas
- Invitaciones con email opcional
- Link universal para compartir (WhatsApp)
- Rate limit: 10 reenvíos/hora
- Expiración: 7 días
- Notificación por email al revocar acceso
- Revocar acceso (despido)
- Cambio de rol (staff/admin)

---

## Employee Profile - Perfil de Empleado con Tabs

| Componente | Archivo | Estado |
|------------|---------|--------|
| Página detalle | `src/app/(dashboard)/employees/[id]/page.tsx` | ✅ |
| EmployeeTabs | `src/app/(dashboard)/employees/[id]/EmployeeTabs.tsx` | ✅ |
| Tab Info | `src/app/(dashboard)/employees/[id]/EmployeeInfoTab.tsx` | ✅ |
| Tab Horario | `src/app/(dashboard)/employees/[id]/EmployeeAvailabilityTab.tsx` | ✅ |
| Tab Servicios | `src/app/(dashboard)/employees/[id]/EmployeeServicesTab.tsx` | ✅ |
| Tab Acceso | `src/app/(dashboard)/employees/[id]/EmployeeAccessTab.tsx` | ✅ |
| Services | `src/services/employees/` (2 files) | ✅ |
| Actions | `src/actions/employees/updateEmployeeService.ts` | ✅ |

### Características implementadas
- 4 tabs integrados en una página
- **Info**: Editar nombre, teléfono, estado activo/inactivo
- **Horario**: Agregar/eliminar días y horarios de trabajo
- **Servicios**: Toggle servicios + override duración/precio
- **Acceso**: Invitar, reenviar, cancelar, revocar acceso
- Navegación mejorada en lista de empleados

---

## Próximos Pasos Inmediatos

1. ~~**Email Automation**~~ → ✅ Completado
2. ~~**Dashboard Analytics**~~ → ✅ Completado
3. ~~**Dark Mode**~~ → ✅ Completado
4. ~~**Settings Page**~~ → ✅ Completado
5. **Review & Testing** → Tests unitarios y de integración

---

## v2 - Pendiente

- **Google Calendar Integration** → Sincronización de citas con Google Calendar
- **Review & Testing** → Tests unitarios y de integración