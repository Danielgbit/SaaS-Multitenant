# Product Roadmap - SaaS Prügressy

## Estado del Proyecto

**Versión Actual:** v1.0 MVP  
**Última Actualización:** 2026-03-25  
**Mercado Objetivo:** B2B wellness/health (spas, barberías, clínicas, centros de bienestar) en Colombia

---

## Visión del Producto

Plataforma SaaS de gestión integral para negocios de bienestar que combina:
- **Agenda inteligente** con disponibilidad en tiempo real
- **Nómina automática** con comisiones y préstamos
- **Cuentas por cobrar** para ventas de productos
- **Integraciones** con WhatsApp, Email, Stripe

---

## Estado por Módulo

### ✅ Módulos Completados

| Módulo | Estado | Descripción |
|---------|--------|-------------|
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
| **WhatsApp (N8N)** | ⚠️ Setup | Configuración lista, falta conectar API |
| **Email (Resend)** | ✅ v1.0 | Confirmaciones y recordatorios |
| **Stripe Billing** | ⚠️ Parcial | Suscripciones, falta portal completo |
| **Dark Mode** | ✅ v1.0 | Toggle global |

---

## Completado Recientemente: Sistema de Confirmaciones de Clientes

### ✅ Implementado (2026-03-25)

#### Backend
| Componente | Estado | Archivo |
|------------|--------|---------|
| Enum `confirmation_method` | ✅ | `20260325000000_client_confirmation_system.sql` |
| Enum `preferred_contact` | ✅ | `20260325000000_client_confirmation_system.sql` |
| Campo `confirmations_enabled` | ✅ | `supabase/migrations/` |
| Campo `confirmation_method` | ✅ | `supabase/migrations/` |
| Campo `preferred_contact` | ✅ | `supabase/migrations/` |
| Índices optimizados | ✅ | `supabase/migrations/` |

#### Frontend
| Componente | Estado | Archivo |
|------------|--------|---------|
| Toggle de confirmaciones | ✅ | `EditClientModal.tsx` |
| Tooltip con recordatorio | ✅ | `EditClientModal.tsx` |
| Selector de método | ✅ | `EditClientModal.tsx` |
| Validación teléfonos CO/US | ✅ | `src/lib/validators/phone.ts` |
| Badge en página de detalle | ✅ | `ClientTabs.tsx` |

#### Tipos y Validación
| Componente | Estado | Archivo |
|------------|--------|---------|
| Tipos TypeScript | ✅ | `src/types/clients.ts` |
| Validador teléfono CO/US | ✅ | `src/lib/validators/phone.ts` |
| Server Actions actualizados | ✅ | `src/actions/clients/` |

### Campos del Formulario de Cliente

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | **Sí** | Nombre completo |
| `confirmations_enabled` | boolean | No | Si activa confirmaciones automáticas |
| `phone` | string | Condicional | Requerido si confirmations_enabled=true |
| `email` | string | No | Email opcional |
| `notes` | string | No | Notas adicionales |
| `confirmation_method` | enum | No | whatsapp, phone_call, in_person, none |
| `preferred_contact` | enum | No | whatsapp, phone, email |

### Flujo de Confirmaciones

```
Crear Cliente:
│
├── Toggle: "Activar confirmaciones automáticas"
│   ├── ON → Teléfono requerido, confirmation_method='whatsapp'
│   └── OFF → Selector de método alternativo
│
└── Método:
    ├── whatsapp → Confirmación por WhatsApp
    ├── phone_call → Ya confirmado por llamada
    ├── in_person → Confirmado presencialmente
    └── none → No desea mensajes
```

### Pendiente: N8N Integration
- [ ] Consumir tabla `whatsapp_messages` desde N8N
- [ ] Workflow que lea `confirmation_method` y `preferred_contact`
- [ ] Enviar por WhatsApp, email o saltar según configuración

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

**Métricas de éxito:**
- Tasa de entrega > 95%
- Tasa de apertura > 60%
- Reducción de no-shows > 20%

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
| **Payment Methods** | 🔄 Pendiente | Gestionar tarjetas |

**Pendiente:**
- [ ] Completar webhook handler para todos los eventos
- [ ] Implementar Customer Portal de Stripe
- [ ] Mostrar historial de facturas con PDF
- [ ] Manejar edge cases (failed payment, retry)
- [ ] Testing con Stripe CLI

**Métricas de éxito:**
- MRR tracking preciso
- Churn rate < 5%
- Payment success rate > 98%

---

#### 3. Seguridad y Anti-Hacking

**Descripción:** Implementar protección contra ataques comunes y mejorar seguridad de la aplicación.

| Componente | Estado | Archivo |
|------------|--------|---------|
| RLS Policies | ✅ | `supabase/migrations/` |
| Auth Verification | ⚠️ Básico | Middleware básico |
| **Rate Limiting** | 🔄 Pendiente | API routes |
| **CSRF Protection** | 🔄 Pendiente | Server Actions |
| **Input Sanitization** | 🔄 Pendiente | Zod en todos los forms |
| **SQL Injection Prevention** | 🔄 Pendiente | Query builder |
| **XSS Prevention** | 🔄 Pendiente | Content sanitization |
| **Session Management** | 🔄 Pendiente | Refresh tokens |

**Checklist de Seguridad:**
- [ ] Implementar rate limiting en API routes
- [ ] Añadir CSRF tokens a todos los forms
- [ ] Validar y sanitizar TODOS los inputs con Zod
- [ ] Implementar refresh token rotation
- [ ] Añadir 2FA opcional para admins
- [ ] Logging de eventos de seguridad
- [ ] Backup automático de DB
- [ ] SSL/HTTPS enforced

---

### 🟡 PRIORIDAD MEDIA - Mejoras de UX

#### 4. Login/Register - UX y Seguridad

**Descripción:** Mejorar la experiencia de autenticación con mejor diseño y más opciones.

| Componente | Estado | Archivo |
|------------|--------|---------|
| Login Page | ✅ | `src/app/(auth)/login/` |
| Register Page | ✅ | `src/app/(auth)/register/` |
| UI/UX | ⚠️ Básico | Necesita redesign |
| **Social Login** | 🔄 Pendiente | Google, GitHub |
| **Password Reset** | 🔄 Pendiente | Flow completo |
| **Email Verification** | 🔄 Pendiente | Confirmación email |
| **Magic Links** | 🔄 Pendiente | Login sin password |

**Pendiente:**
- [ ] Rediseñar UI con design system
- [ ] Añadir login con Google
- [ ] Implementar password reset flow
- [ ] Añadir verificación de email
- [ ] Considerar magic links (Supabase)
- [ ] Terms & Privacy Policy pages

**Métricas de éxito:**
- Conversion rate registro > 40%
- Login success rate > 95%
- Session duration > 30 min

---

#### 5. Dashboard - Analytics Avanzados

**Descripción:** Añadir métricas más sofisticadas para que los dueños de negocio tomen mejores decisiones.

| Componente | Estado | Archivo |
|------------|--------|---------|
| KPIs básicos | ✅ | `StatsCard.tsx` |
| Trend Chart | ✅ | `TrendChart.tsx` |
| Business Health Widget | ✅ | `BusinessHealthWidget.tsx` |
| Quick Actions Widget | ✅ | `QuickActionsWidget.tsx` |
| **Retention Metrics** | 🔄 Pendiente | Clientes que regresan |
| **Occupancy Rate** | 🔄 Pendiente | Uso de capacidad |
| **Revenue Forecast** | 🔄 Pendiente | Proyecciones |
| **Employee Utilization** | 🔄 Pendiente | Rendimiento staff |

**Pendiente:**
- [ ] Widget de retención de clientes (% que regresa)
- [ ] Widget de ocupación por hora/día
- [ ] Gráfico de revenue proyectado
- [ ] Dashboard de utilización por empleado
- [ ] Export a PDF/Excel

**Métricas de éxito:**
- Daily active users > 70%
- NPS score > 40

---

#### 6. Mejoras UI Clientes

**Descripción:** Optimizar la experiencia de usuario en la gestión de clientes.

| Componente | Estado | Archivo |
|------------|--------|---------|
| Formulario con floating labels | ✅ | `EditClientModal.tsx` |
| Toggle confirmaciones | ✅ | `EditClientModal.tsx` |
| Tooltip recordatorio | ✅ | `EditClientModal.tsx` |
| Página de detalle | ✅ | `ClientTabs.tsx` |
| Badge de método | ✅ | `ClientTabs.tsx` |
| **Quick-add mode** | 🔄 Pendiente | Solo nombre para recepción |
| **Filtros avanzados** | 🔄 Pendiente | Por estado, deuda, última visita |
| **Export/Import** | 🔄 Pendiente | CSV clientes |

---

### 🟢 PRIORIDAD BAJA - Nice to Have

#### 7. Google Calendar Integration

| Componente | Estado |
|------------|--------|
| Research | ✅ Completado |
| API Setup | 🔄 Pendiente |
| Sync Logic | 🔄 Pendiente |
| UI Integration | 🔄 Pendiente |

---

## Roadmap Timeline Sugerido

```
Q1 2026 (Completado)
├── Autenticación ✅
├── Core Modules ✅
├── Nómina ✅
└── Cuentas por Cobrar ✅

Q2 2026 (En Progreso)
├── Abril
│   ├── WhatsApp API Integration 🔄
│   ├── Stripe Completado 🔄
│   └── Seguridad 🔄
│
├── Mayo
│   ├── Login/Register UX 🔄
│   ├── Dashboard Analytics 🔄
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

## Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| WhatsApp API restrictions | Media | Alto | Tener email como backup |
| Stripe onboarding delays | Alta | Medio | Asistir al usuario |
| Supabase rate limits | Baja | Medio | Plan adecuado |
| Competitor feature parity | Alta | Medio | Priorizar UX |

---

## Checklist de Launch v1.0

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

### UX
- [ ] Onboarding flow completo
- [ ] Empty states diseñados
- [ ] Error states manejados
- [ ] Loading states implementados

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

*Documento actualizado: 2026-03-25*
