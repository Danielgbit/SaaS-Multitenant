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
|---|---|---|---|---|
| **Now** | Authentication & Organization | Sistema de auth funcional con organizaciones | # usuarios registrados | ✅ Completado |
| **Now** | Employee Management | CRUD de empleados por organización | # empleados activos | ✅ Completado |
| **Now** | Service Management | CRUD de servicios con duración y precio | # servicios configurados | ✅ Completado |
| **Now** | Employee Availability | Configuración de horarios por empleado | % empleados con agenda completa | ✅ Completado |
| **Now** | **Slots Engine** | **Generación de slots disponibles en tiempo real** | **Slots calculados correctamente** | **✅ Completado** |
| **Now** | **Client Management** | **CRUD de clientes con grid UI** | **# clientes registrados** | **✅ Completado** |
| **Now** | **Calendar View** | **Vista de calendario con citas del día/semana + CRUD completo** | **Citas visualizadas** | **✅ Completado** |
| **Now** | **Appointment Booking** | **Crear/cancelar/reschedule citas** | **Citas creadas exitosamente** | **✅ Completado** |
| **Now** | **Public Booking Page** | **Página de reservas pública (/reservar/[slug])** | **Reservas desde web** | **✅ Completado** |
| **Later** | WhatsApp Integration | Recordatorios automáticos por WhatsApp | Tasa de asistencia | - |
| **Now** | **Billing & Subscriptions** | **Planes, pagos Stripe, portal facturación** | **MRR** | **✅ Completado** |

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

## Próximos Pasos Inmediatos

1. **WhatsApp Integration** → Recordatorios automáticos por WhatsApp
2. **Email Automation** → Emails transaccionales (recordatorios, confirmaciones)