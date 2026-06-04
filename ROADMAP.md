# Product Roadmap — Prügressy

> Última actualización: 2026-06-04

---

## Estado Actual

**Versión:** V2 (post-migración payroll, notificaciones, confirmaciones)
**Framework:** Next.js 16 / React 19 / Tailwind 4
**Base de datos:** PostgreSQL 17 (73 migraciones, 69 tablas)
**Mercado:** B2B wellness/health (spas, barberías, clínicas) en Colombia

---

## Capacidades Completadas

| Módulo | Estado | Notas |
|--------|--------|-------|
| Autenticación | ✅ | Login, register, password reset, Supabase Auth |
| Multi-tenant | ✅ | RBAC con 4 roles, RLS, organización por slug |
| Gestión empleados | ✅ | CRUD, disponibilidad, overrides, breaks |
| Servicios | ✅ | CRUD, comisiones, buffers |
| Clientes | ✅ | CRUD, cuentas de crédito, métodos de pago |
| Calendario de citas | ✅ | Vista semanal, drag & drop, clusters |
| Reserva pública | ✅ | Wizard 3 pasos `/reservar/[slug]` |
| Confirmaciones V2 | ✅ | Flujo A (por cita) + B (por servicio), Realtime, urgencia visual |
| Payroll V2 | ✅ | payroll_periods+items, comisiones, préstamos, recibos, PDF |
| Notificaciones V2 | ✅ | Multicanal (WhatsApp/Email/In-App), cola con SKIP LOCKED, templates, shadow validation |
| Cuentas por cobrar | ✅ | client_accounts, transacciones, ajustes, reversiones |
| Caja diaria | ✅ | cash_sessions, operation_entries, auditoría de pagos |
| Financial events | ✅ | Capa append-only canónica |
| Inventario | ✅ | Stock, alertas low-stock, consumo |
| Dashboard analytics | ✅ | KPIs, tendencias, rendimiento empleados |
| Promo codes | ✅ | Códigos promocionales con tracking |
| Dark mode | ✅ | Toggle global con next-themes |
| Data retention | ✅ | Purga automática configurable |
| Admin global | ✅ | panel de administración, organization status, notificaciones sistema |
| Shadow mode | ✅ | Validación offline V1 vs V2 (6 tipos de drift) |

---

## Workstreams Activos

| Prioridad | Workstream | Estado | Descripción |
|-----------|-----------|--------|-------------|
| P1 | Stripe billing completo | ⚠️ Parcial | Falta customer portal completo, historial facturas, webhooks edge cases |
| P1 | WhatsApp real | ⚠️ Setup | Arquitectura de canales lista (Wasender, n8n, mock), falta conectar API real |
| P2 | Onboarding fluido | 🔄 En desarrollo | Mejorar primera experiencia post-registro |
| P2 | Dashboard empleado | 🔄 En desarrollo | Vista diferenciada para rol empleado |
| P3 | Multi-sede | 📅 Investigación | Soporte para múltiples locations por organización |

---

## Backlog Priorizado

| Prioridad | Feature | Dependencia |
|-----------|---------|-------------|
| Alta | Integración Google Calendar | API setup |
| Alta | Portal de cliente (autogestión) | Auth |
| Media | Reportes avanzados (revenue, comisiones) | Analytics |
| Media | Consumo automático de inventario por servicio | Inventory |
| Media | Migración total V1→V2 payroll y notificaciones | Shadow mode |
| Baja | Integración SMS | Notifications |
| Baja | Login social (Google, GitHub) | Auth |
| Baja | Términos y condiciones / privacidad | Legal |

---

## Histórico Relevante

- **2026-03:** Schema inicial, auth, RLS, payroll V1, whatsapp V1
- **2026-04:** Confirmaciones, invitaciones, purga, COP fix
- **2026-05:** Payroll V2, Notificaciones V2, Financial events, Shadow mode
- **2026-06:** User profiles, platform admins, caja diaria, operation entries

---

Ver `docs/architecture/CURRENT/SYSTEM_INVENTORY.md` para métricas actualizadas del sistema.
