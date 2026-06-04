# Prügressy

Plataforma SaaS B2B para gestión integral de negocios de bienestar y salud (barberías, spas, clínicas, centros estéticos) en Colombia.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router, React 19, TypeScript 5) |
| Estilos | Tailwind CSS 4 + shadcn/ui + Framer Motion |
| Base de datos | Supabase (PostgreSQL 17, RLS, Realtime) |
| Auth | Supabase Auth |
| Cache | TanStack React Query 5 |
| Pagos | Stripe |
| Emails | Resend |
| Validación | Zod 4 |

## Arquitectura

- **73 migraciones** SQL, **69 tablas públicas**, **26 módulos de Server Actions**
- Multi-tenant con RLS, 4 roles (owner, admin, staff, empleado)
- Sistemas V2 activos: payroll (payroll_periods+items), notificaciones multicanal (notification_queue), confirmaciones (flujo A+B)
- Capa financiera append-only (financial_events)
- Shadow mode para validación offline V1→V2

Ver `docs/architecture/CURRENT/SYSTEM_INVENTORY.md` para el inventario completo.

## Setup local

```bash
cp .env.example .env.local   # Completar variables
npm install
npm run dev                  # http://localhost:3000
```

Variables mínimas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.

## Testing

```bash
npm test                          # Unitarios (Vitest)
npx playwright test               # E2E
npm run docs:check                # Validar documentación
```

## Despliegue

Ver `docs/operations/DEPLOYMENT.md` para el orden de provisioning, variables requeridas y rollback.

## Documentación

- `docs/INDEX.md` — Portal documental completo
- `docs/architecture/CURRENT/` — Arquitectura, BD, cron, environment, system inventory
- `docs/modules/` — Módulos de negocio (confirmaciones, payroll, shadow mode, etc.)
- `docs/operations/` — Despliegue, seguridad, troubleshooting
- `docs/decisions/` — ADRs (Architecture Decision Records)
- `.agents/skills/` — Skills para agentes (screen-map, system-flow, user-actions, user-flow)
