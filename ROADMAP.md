# Product Roadmap - SaaS Prügressy

## Estado del Proyecto

**Versión Actual:** v1.0 MVP  
**Última Actualización:** 2026-04-01  
**Mercado Objetivo:** B2B wellness/health (spas, barberías, clínicas, centros de bienestar) en Colombia

---

## Visión del Producto

Plataforma SaaS de gestión integral para negocios de bienestar que combina:
- **Agenda inteligente** con disponibilidad en tiempo real
- **Nómina automática** con comisiones y préstamos
- **Cuentas por cobrar** para ventas de productos
- **Integraciones** con WhatsApp, Email, Stripe

---

## Sistema de Roles - Roles de Usuario

### Roles Implementados

| Rol (DB) | Label UI | Descripción | Permisos |
|----------|---------|-------------|----------|
| `owner` | Owner | Propietario de la organización | Todos (creador de org) |
| `admin` | Administrador | Acceso completo | Agenda, empleados, servicios, configuración, nómina, invitaciones |
| `staff` | Asistente | Acceso básico | Agenda, confirmaciones, invitaciones |
| `empleado` | Empleado | Acceso limitado | Solo su agenda, confirmaciones, y su nómina |

### Permisos Detallados por Rol

| Ruta/Feature | Admin | Asistente | Empleado |
|--------------|-------|-----------|---------|
| Dashboard | ✅ | ✅ | ✅ (simplificado) |
| Agenda | ✅ | ✅ | ✅ |
| Confirmaciones | ✅ Recepción | ✅ Recepción | ✅ Propias |
| Nómina | ✅ Ver todas | ❌ Oculto | ✅ Solo la suya |
| Empleados | ✅ | ❌ Oculto | ❌ Oculto |
| Clientes | ✅ | ✅ | ❌ Oculto |
| Servicios | ✅ | ✅ | ❌ Oculto |
| Inventario | ✅ | ❌ Oculto | ❌ Oculto |
| WhatsApp | ✅ | ❌ Oculto | ❌ Oculto |
| Email | ✅ | ❌ Oculto | ❌ Oculto |
| Facturación | ✅ | ❌ Oculto | ❌ Oculto |
| Ajustes | ✅ | ❌ Oculto | ❌ Oculto |
| Invitar empleados | ✅ | ✅ | ❌ |

---

## Estado por Módulo

### ✅ Módulos Completados

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Autenticación** | ✅ v1.0 | Login, Register, Supabase Auth |
| **Gestión Organizaciones** | ✅ v1.0 | Multi-tenant con RBAC |
| **Empleados** | ✅ v1.0 | CRUD, disponibilidad, invitaciones |
| **Servicios** | ✅ v1.0 | CRUD con duración y precio |
| **Clientes** | ✅ v1.0 | CRUD con grid, búsqueda, página de detalle |
| **Clientes - Confirmaciones** | ✅ v1.0 | Sistema completo de método de confirmación |
| **Citas** | ✅ v1.0 | Calendario, crear, editar, cancelar |
| **Reserva Pública** | ✅ v1.0 | Wizard de 3 pasos |
| **Inventario** | ✅ v1.0 | Stock y límites por plan |
| **Confirmaciones** | ✅ v1.0 | Flujo empleado → recepción |
| **Nómina** | ✅ v1.0 | Comisiones, préstamos, recibos |
| **Cuentas por Cobrar** | ✅ v1.0 | Ventas a crédito, pagos parciales |
| **Dashboard Analytics** | ✅ v1.0 | KPIs, gráficos, tendencias, widgets |
| **Email (Resend)** | ✅ v1.0 | Confirmaciones, recordatorios, invitaciones |
| **Dark Mode** | ✅ v1.0 | Toggle global |
| **WhatsApp (N8N)** | ⚠️ Setup | Configuración lista, falta conectar API |
| **Stripe Billing** | ⚠️ Parcial | Suscripciones, falta portal completo |

---

## Completado: Email con Resend + Dominio Personalizado

### ✅ Implementado (2026-04-01)

#### Configuración
| Componente | Estado | Detalle |
|------------|--------|---------|
| API Key Resend | ✅ | `re_gZ7gfQFV_JkRNYTH9LMq9Sty5eqsdkcTX` |
| Dominio verificado | ✅ | `focusidestudio.com` verificado en Resend |
| Variable `RESEND_FROM_EMAIL` | ✅ | `noreply@focusidestudio.com` |

#### Templates de Email Mejorados
| Template | Estado | Descripción |
|---------|--------|-------------|
| Invitación empleado | ✅ Premium UI | Header gradiente, badge rol, CTA mejorado |
| Confirmación cita | ✅ Premium UI | Highlight servicio, grid detalles |
| Recordatorio cita | ✅ Premium UI | Color ámbar, alerta animada |
| Cita cancelada | ✅ Premium UI | Color rojo, mensaje de cancelación |
| Cita completada | ✅ Premium UI | Color verde, feedback positivo |
| No show | ✅ Premium UI | Color indigo, informativo |

#### Características del Diseño
- Header con gradiente y animación sutil de pulso
- Logo con acento teal (`#5eead4`)
- Jerarquía tipográfica clara (Inter + Cormorant Garamond)
- Botones CTA con hover effects
- Badges de rol en invitaciones
- Footer consistente con branding
- Responsive mobile-first
- Sin emojis en asuntos (profesional)

---

## Completado: Página de Error de Invitación

### ✅ Implementado (2026-04-01)

#### Tipos de Error Contextuales
| ErrorType | Título | Color Accent |
|-----------|--------|--------------|
| `invalid_token` | Invitación no válida | Gris `#6b7280` |
| `not_found` | Invitación no encontrada | Rojo `#dc2626` |
| `already_accepted` | Invitación ya utilizada | Verde `#10b981` |
| `cancelled` | Invitación cancelada | Rojo `#dc2626` |
| `expired` | Invitación expirada | Ámbar `#f59e0b` |

#### Diseño
- Ilustración SVG personalizada de "link roto"
- Título contextual dinámico
- Descripción explicativa con acción sugerida
- Botón primario: "Ir al inicio"
- Botón secundario: "Volver al login"
- Footer con link "Contactar soporte"
- Branding Prügressy

---

## Completado: Labels de Roles en Español

### ✅ Implementado (2026-04-01)

Los roles ahora usan terminología en español claro:

| Valor DB | Label Anterior | Label Nuevo |
|----------|---------------|------------|
| `admin` | Admin (acceso completo) | Administrador (acceso completo: agenda, empleados, servicios, configuracion e invitaciones) |
| `staff` | Staff (acceso básico) | Asistente (acceso a agenda, confirmaciones e invitaciones) |
| `empleado` | (no existía) | Empleado (acceso a su agenda, confirmaciones y su nomina) |

---

## Completado: Sistema de Invitaciones de Empleados (2026-04-18)

### ✅ Fixes Implementados

#### 1. Email de Invitacion - API Key Resend Actualizado
| Componente | Estado | Detalle |
|------------|--------|---------|
| API Key Resend | ✅ | `re_NdCwvRUB_99z6BEWAPpdxQcbnfd1dmTCg` (nuevo) |
| Dominio verificado | ✅ | `focusidestudio.com` |
| Variable `RESEND_FROM_EMAIL` | ✅ | `noreply@focusidestudio.com` |

#### 2. Registro de Nuevo Empleado - Bug RPC Corregido
| Componente | Estado | Detalle |
|------------|--------|---------|
| `setupPasswordAndAccept.ts` | ✅ | RPC `accept_employee_invitation` → INSERT directo a `organization_members` |
| Razon | ✅ | La funcion RPC no existia en migraciones (bug en Supabase dashboard) |
| Solucion | ✅ | Uso de INSERT directo, igual que `acceptInvitation.ts` |

#### 3. Deprecation React 19 - useActionState
| Componente | Estado | Archivo |
|------------|--------|---------|
| `AcceptInvitationForm.tsx` | ✅ Fix | `useFormState` → `useActionState` |
| `ResetPasswordForm.tsx` | ✅ Fix | `useFormState` → `useActionState` |

#### 4. Validador Visual de Contrasena
| Componente | Estado | Detalle |
|------------|--------|---------|
| `PasswordInput` component | ✅ Ya existia | Con `showStrength` para feedback visual |
| `RegisterForm` | ✅ Listo | Ya usaba `PasswordInput` con `showStrength` |
| `ResetPasswordForm` | ✅ Actualizado | Integró `PasswordInput` con `showStrength` |
| `AcceptInvitationForm` | ✅ Actualizado | Integró `PasswordInput` con `showStrength` |
| Zod schemas | ✅ | `min(6)` → `min(8)` caracteres |

**Requisitos de seguridad:**
- Minimo 8 caracteres
- Al menos 1 mayuscula
- Al menos 1 numero
- Al menos 1 simbolo especial

#### 5. Rate Limit Supabase Auth - SMTP Resend Configurado
| Componente | Estado | Detalle |
|------------|--------|---------|
| `config.toml` local | ✅ | `email_sent = 30` (antes 2) |
| `config.toml` SMTP | ✅ | Resend SMTP habilitado |
| Supabase Dashboard remoto | ✅ | Resend SMTP configurado manualmente |
| Resultado | ✅ | Emails ilimitados via Resend (no mas rate limit exceeded) |

---

## Pendiente: Sistema de 3 Roles con Dashboard Diferenciado

### 🔄 En Progreso

#### Tareas Pendientes

| # | Componente | Estado | Archivo |
|---|------------|--------|---------|
| 1 | Sidebar - rutas para empleado (hideForEmpleado) | 🔄 Pendiente | `src/components/dashboard/Sidebar.tsx` |
| 2 | CollapsibleSidebar - rutas para empleado | 🔄 Pendiente | `src/components/dashboard/CollapsibleSidebar.tsx` |
| 3 | Payroll - ocultar en payroll general para empleado | 🔄 Pendiente | `src/app/(dashboard)/payroll/page.tsx` |
| 4 | Payroll [employeeId] - solo admin/staff acceden | 🔄 Pendiente | `src/app/(dashboard)/payroll/[employeeId]/page.tsx` |
| 5 | **Nueva página /payroll/mi para empleado** | 🔄 Pendiente | `src/app/(dashboard)/payroll/mi/page.tsx` |
| 6 | **Dashboard diferenciado para empleado** | 🔄 Pendiente | `src/app/(dashboard)/dashboard/page.tsx` |
| 7 | Verificar seguridad confirmations page | 🔄 Pendiente | `src/app/(dashboard)/confirmations/page.tsx` |

### Detalle: Dashboard Diferenciado por Rol

#### Admin/Asistente → Dashboard Completo
```
┌─────────────────────────────────────────┐
│ KPIs: Ingresos, Citas, Clientes, etc.  │
├─────────────────────────────────────────┤
│ Gráficos de Tendencia                  │
├─────────────────────────────────────────┤
│ Widgets: Quick Actions, Health, etc.    │
├─────────────────────────────────────────┤
│ Resumen Payroll                         │
└─────────────────────────────────────────┘
```

#### Empleado → Dashboard Simplificado
```
┌─────────────────────────────────────────┐
│ Saludo personal: "Hola, [Nombre]"      │
├─────────────────────────────────────────┤
│ Mis métricas: Citas hoy, Pendientes      │
├─────────────────────────────────────────┤
│ Mi Payroll: Ingresos del período        │
├─────────────────────────────────────────┤
│ Accesos rápidos: Agenda, Mis Citas      │
└─────────────────────────────────────────┘
```

### Detalle: Página "Mi Nómina" (/payroll/mi)

Nueva ruta dedicada para el rol `empleado`:
- Muestra: Sus ingresos, comisiones, anticipos/préstamos
- NO muestra: Lista de otros empleados, ajustes de nómina
- Header: "Mi Nómina - [Nombre del empleado]"
- Filtro por período (semanal/quincenal/mensual)
- Acceso directo a sus recibos de pago

---

## Roadmap por Prioridad

### 🔴 PRIORIDAD ALTA - Bloqueantes de Producción

#### 1. WhatsApp API Integration

**Descripción:** Conectar el webhook de N8N con la API real de WhatsApp Business para enviar mensajes de confirmación y recordatorios.

| Componente | Estado | Archivo |
|------------|--------|---------|
| Setup N8N Webhook | ✅ | `docs/N8N-WHATSAPP-WORKFLOW.md` |
| Tabla `whatsapp_messages` | ✅ | `supabase/migrations/` |
| Server Actions (queue, send, resend) | ✅ | `src/actions/whatsapp/` |
| UI Settings & Logs | ✅ | `src/components/dashboard/whatsapp/` |
| **N8N Workflow** | 🔄 Pendiente | Workflow completo |
| **API Connection** | 🔄 Pendiente | Conectar con WhatsApp Cloud API |

**Pendiente:**
- [ ] Crear workflow N8N que consuma `/api/whatsapp/scheduler`
- [ ] Configurar WhatsApp Cloud API (Meta Business)
- [ ] Obtener phone number ID y WhatsApp Business Account ID
- [ ] Probar envío de mensajes reales
- [ ] Implementar retry logic para mensajes fallidos

---

#### 2. Stripe Billing Completado

**Descripción:** Terminar integración de Stripe con portal de facturación completo y webhooks.

| Componente | Estado | Archivo |
|------------|--------|---------|
| Migración DB | ✅ | `supabase/migrations/` |
| Server Actions | ✅ | `src/actions/billing/` |
| Checkout Session | ✅ | Implementado |
| Webhook Handler | ⚠️ Parcial | `src/app/api/webhooks/stripe/` |
| **Customer Portal** | 🔄 Pendiente | Portal completo |
| **Invoice History** | 🔄 Pendiente | Historial detallado |

**Pendiente:**
- [ ] Completar webhook handler para todos los eventos
- [ ] Implementar Customer Portal de Stripe
- [ ] Mostrar historial de facturas con PDF
- [ ] Manejar edge cases (failed payment, retry)
- [ ] Testing con Stripe CLI

---

#### 3. Sistema de 3 Roles (Empleado/Asistente/Admin)

**Descripción:** Implementar el rol "Empleado" con acceso limitado y dashboard diferenciado.

| Componente | Estado | Archivo |
|------------|--------|---------|
| Tipo `MemberRole` con `empleado` | ✅ | `src/types/invitations.ts` |
| Select de roles UI | ✅ | `InviteEmployeeModal.tsx`, `EmployeeAccessTab.tsx` |
| Sidebar para empleado | 🔄 Pendiente | `Sidebar.tsx` |
| CollapsibleSidebar para empleado | 🔄 Pendiente | `CollapsibleSidebar.tsx` |
| Payroll general oculto para empleado | 🔄 Pendiente | `payroll/page.tsx` |
| Payroll [employeeId] seguro | 🔄 Pendiente | `payroll/[employeeId]/page.tsx` |
| **Página "Mi Nómina"** | 🔄 Pendiente | `payroll/mi/page.tsx` |
| **Dashboard diferenciado** | 🔄 Pendiente | `dashboard/page.tsx` |
| Seguridad confirmations | 🔄 Pendiente | `confirmations/page.tsx` |

**Checklist:**
- [ ] Sidebar: agregar `hideForEmpleado` a rutas restringidas
- [ ] CollapsibleSidebar: mismo tratamiento
- [ ] Payroll page: redirect empleado a `/payroll/mi`
- [ ] Payroll [employeeId]: verificar que solo admin/staff acceden
- [ ] Crear `/payroll/mi/page.tsx` con vista simplificada
- [ ] Dashboard: crear vista diferente para empleado
- [ ] Confirmations: empleado ve solo sus confirmaciones pendientes

---

#### 4. Seguridad y Anti-Hacking

**Descripción:** Implementar protección contra ataques comunes y mejorar seguridad de la aplicación.

| Componente | Estado | Archivo |
|------------|--------|---------|
| RLS Policies | ✅ | `supabase/migrations/` |
| Auth Verification | ⚠️ Básico | Middleware básico |
| **Rate Limiting** | 🔄 Pendiente | API routes |
| **CSRF Protection** | 🔄 Pendiente | Server Actions |
| **Input Sanitization** | 🔄 Pendiente | Zod en todos los forms |

**Checklist de Seguridad:**
- [ ] Implementar rate limiting en API routes
- [ ] Añadir CSRF tokens a todos los forms
- [ ] Validar y sanitizar TODOS los inputs con Zod
- [ ] Implementar refresh token rotation
- [ ] Audit log de eventos importantes

---

### 🟡 PRIORIDAD MEDIA - Mejoras de UX

#### 5. Login/Register - UX y Seguridad

| Componente | Estado | Archivo |
|------------|--------|---------|
| Login Page | ✅ | `src/app/(auth)/login/` |
| Register Page | ✅ | `src/app/(auth)/register/` |
| UI/UX | ⚠️ Básico | Necesita redesign |
| **Social Login** | 🔄 Pendiente | Google, GitHub |
| **Password Reset** | 🔄 Pendiente | Flow completo |

**Pendiente:**
- [ ] Rediseñar UI con design system
- [ ] Añadir login con Google
- [ ] Implementar password reset flow
- [ ] Terms & Privacy Policy pages

---

### 🟢 PRIORIDAD BAJA - Nice to Have

#### 6. Google Calendar Integration

| Componente | Estado |
|------------|--------|
| Research | ✅ Completado |
| API Setup | 🔄 Pendiente |
| Sync Logic | 🔄 Pendiente |

---

## Roadmap Timeline Sugerido

```
Q1 2026 (Completado)
├── Autenticación ✅
├── Core Modules ✅
├── Nómina ✅
├── Cuentas por Cobrar ✅
└── Email Premium ✅

Q2 2026 (En Progreso)
├── Abril
│   ├── Sistema de 3 Roles 🔄
│   ├── WhatsApp API Integration 🔄
│   └── Stripe Completado 🔄
│
├── Mayo
│   ├── Login/Register UX 🔄
│   ├── Dashboard para Empleado 🔄
│   └── Testing Integral 🔄
│
└── Junio
    ├── v1.0 Launch 🔄
    └── Marketing 🔄
```

---

## Dependencias Técnicas

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA ACTUAL                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Frontend          Backend           Third Party            │
│   ────────          ────────         ────────────            │
│   Next.js 14    →   Supabase    →   Stripe                 │
│   React         →   Postgres    →   Resend                 │
│   Tailwind      →   RLS         →   WhatsApp (N8N)        │
│   TypeScript                       Google Calendar          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## KPIs del Negocio

| Métrica | Target | Actual |
|---------|--------|--------|
| **MRR** | $5,000 USD/mes | $0 (pre-launch) |
| **Churn** | < 5% | N/A |
| **NPS** | > 40 | N/A |
| **DAU/MAU** | > 30% | N/A |
| **Time to Setup** | < 15 min | N/A |

---

## Checklist de Launch v1.0

### Sistema de Roles
- [x] Tipo MemberRole con 3 roles
- [x] Labels en español claros
- [ ] Sidebar diferenciado por rol
- [ ] Dashboard diferenciado por rol
- [ ] Payroll seguro (empleado solo ve el suyo)
- [ ] Página "Mi Nómina" implementada

### Seguridad
- [ ] Rate limiting implementado
- [ ] CSRF protection activa
- [ ] All inputs sanitized
- [ ] Audit log funcionando
- [ ] Backup configurado

### Funcional
- [ ] Todos los módulos completados
- [ ] Sin bugs críticos
- [ ] Mobile responsive
- [ ] Dark mode funcionando

### Legal
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie Banner
- [ ] Invoice generation

---

## Recursos

- **Docs Técnicos:** `/docs/`
- **Workflows N8N:** `/docs/N8N-*.md`
- **Migraciones:** `/supabase/migrations/`
- **Server Actions:** `/src/actions/`
- **Components:** `/src/components/dashboard/`

---

*Documento actualizado: 2026-04-01*
