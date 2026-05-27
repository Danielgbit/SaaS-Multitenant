# Prügressy — SaaS de Gestión para Bienestar y Salud

Plataforma B2B para gestión de citas, empleados, nómina y confirmaciones.
Mercado objetivo: spas, barberías, clínicas y centros estéticos en Colombia.

## Stack

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 16 | App Router, Server Components, Server Actions |
| React | 19 | UI library |
| TypeScript | 5 | Tipado estático |
| Tailwind CSS | 4 | Estilos (design system — `useThemeColors()`) |
| Supabase | — | Auth, PostgreSQL, RLS, Realtime |
| Stripe | — | Pagos y suscripciones |
| Resend | — | Emails transaccionales |
| N8N | — | Automatizaciones WhatsApp |
| Recharts | — | Gráficos analytics |
| Framer Motion | — | Animaciones |

## Requisitos

- Node.js 20+
- npm
- Supabase account ([supabase.com](https://supabase.com))
- Resend API key ([resend.com](https://resend.com)) — para emails
- Stripe account ([stripe.com](https://stripe.com)) — solo si trabajas con billing

## Setup rápido

```bash
# 1. Clonar e instalar
git clone <repo>
cd saas
npm install

# 2. Variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 3. Migraciones de base de datos
# Las migraciones están en supabase/migrations/
# Se ejecutan automáticamente al conectar con Supabase
# Alternativa: supabase db push

# 4. Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Ver `.env.example` en la raíz del proyecto. Agrupadas por dominio:

- **Supabase** — URL, anon key, service role key
- **Stripe** — secret key, price IDs
- **Resend** — API key, from email
- **Cron** — CRON_SECRET para endpoints programados
- **Feature flags** — Shadow Mode, bypasses de desarrollo

## Scripts principales

| `npm run` | Descripción |
|-----------|-------------|
| `dev` | Servidor de desarrollo |
| `build` | Build de producción |
| `lint` | ESLint |
| `guard` | Architecture drift detection |
| `test` | Vitest (unitarios) |
| `analyze` | Bundle analyzer |

## Arquitectura resumida

```
Frontend (Next.js 16) ←→ Supabase (Auth, DB, RLS, Realtime)
        ↓
Server Actions (mutaciones) ←→ PostgreSQL
        ↓
Notificaciones multicanal → WhatsApp (N8N), Email (Resend), In-App (Realtime)
        ↓
Sistema de confirmaciones → Flujo síncrono empleado ↔ recepción
        ↓
Shadow Mode → Validación en paralelo de nueva arquitectura (event-driven)
```

## Documentación

El índice completo está en [`docs/INDEX.md`](docs/INDEX.md) (pendiente de creación).

### Navegación rápida

| Documento | Descripción |
|-----------|-------------|
| `docs/setup/SETUP.md` | Setup detallado paso a paso |
| `docs/architecture/CURRENT/` | Arquitectura actual implementada |
| `docs/modules/` | Módulos de negocio (confirmaciones, WhatsApp, payroll, etc.) |
| `docs/governance/` | Policies, OVS Registry, snapshots |
| `docs/operations/` | Deploy, troubleshooting, testing |
| `.env.example` | Variables de entorno documentadas |
| `ROADMAP.md` | Roadmap de producto |

## Licencia

Privado — uso interno.
