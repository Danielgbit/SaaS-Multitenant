# Despliegue — Prügressy

> STATUS: CURRENT IMPLEMENTATION
> Last updated: 2026-05-27

---

## 1. Stack de Producción

| Servicio | Propósito | Plan |
|----------|-----------|------|
| **Vercel** | Hosting frontend + API Routes | Pro (necesario para cron) |
| **Supabase** | Base de datos, Auth, Realtime | Pro (escala según uso) |
| **Resend** | Emails transaccionales | Free: 100/día, Pro: 50k/mes |
| **Stripe** | Pagos y suscripciones | Free + comisiones |
| **cron-job.org** | Scheduler cron endpoints | Free |
| **Pipedream** | Scheduler cola notificaciones | Free: 150h/mes |
| **N8N** (opcional) | Middleware WhatsApp | Self-hosted o cloud |

---

## 2. Orden de Provisioning

> Seguir este orden exacto. Cada paso depende del anterior.

```
 1. Supabase project
 2. DNS + dominio (si aplica)
 3. Resend (dominio + API key)
 4. Stripe (productos + prices)
 5. Vercel project + env vars + deploy
 6. Migraciones DB
 7. Cron jobs
 8. Stripe webhooks
 9. Verificación final
```

---

## 3. Paso a Paso

### 3.1 Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Anotar las credenciales:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Anon Key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `Service Role Key` → `SUPABASE_SERVICE_ROLE_KEY`
3. **Auth Settings**:
   - `Site URL`: `https://tudominio.com`
   - `Redirect URLs`: agregar `https://tudominio.com/auth/callback`
   - SMTP: configurar con Resend (ver paso 3.2)
4. No ejecutar migraciones aún (se hacen después del deploy inicial)

### 3.2 Resend

1. Crear cuenta en [resend.com](https://resend.com)
2. Agregar y verificar dominio (`focusidestudio.com` o el del cliente)
3. Crear API Key → `RESEND_API_KEY`
4. Configurar SMTP en Supabase Auth:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `smtp`
   - Password: la misma `RESEND_API_KEY`

### 3.3 Stripe

1. Crear cuenta en [stripe.com](https://stripe.com)
2. Ir a Developers → API Keys → copiar `STRIPE_SECRET_KEY`
3. Crear productos/prices:
   - Basic: `STRIPE_PRICE_BASIC_MONTHLY`
   - Professional: `STRIPE_PRICE_PRO_MONTHLY`
4. Configurar webhooks (se hace después del deploy)

### 3.4 Vercel

1. Conectar repo en [vercel.com](https://vercel.com)
2. **Environment Variables** (agrupar por sección):

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=

   # Stripe
   STRIPE_SECRET_KEY=
   STRIPE_PRICE_BASIC_MONTHLY=
   STRIPE_PRICE_PRO_MONTHLY=

   # Resend
   RESEND_API_KEY=
   RESEND_FROM_EMAIL=noreply@tudominio.com

   # Cron
   CRON_SECRET=<uuid>

   # Entorno
   NEXT_PUBLIC_APP_URL=https://tudominio.com

   # Shadow Mode (opcional en prod)
   SHADOW_MODE_ENABLED=false
   SHADOW_NOTIFICATION_ENABLED=false
   ```

3. **Importante:** NO incluir `NEXT_PUBLIC_BASE_URL` ni `BYPASS_*` en producción
4. Framework preset: Next.js
5. Build command: `npm run build`
6. Deploy

### 3.5 Migraciones

Una vez que el proyecto está en Vercel y Supabase configurado:

```bash
# Opción 1: Supabase CLI
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push

# Opción 2: Manual desde Supabase Dashboard
# SQL Editor → pegar cada migration en orden cronológico
# (No recomendado para 44 migrations)
```

### 3.6 Cron Jobs

Configurar en [cron-job.org](https://cron-job.org):

| Endpoint | Método | Intervalo | Headers |
|----------|--------|-----------|---------|
| `https://tudominio.com/api/cron/check-reminders` | POST | Cada 3 min | `Authorization: Bearer <CRON_SECRET>` |
| `https://tudominio.com/api/cron/purge-appointments` | POST | Diario 2 AM | `Authorization: Bearer <CRON_SECRET>` |

Configurar en [Pipedream](https://pipedream.com):

| Endpoint | Método | Intervalo | Headers |
|----------|--------|-----------|---------|
| `https://tudominio.com/api/cron/process-notifications` | POST | Cada 5 min | `Authorization: Bearer <CRON_SECRET>` |

**Test rápido:** Verificar que cada endpoint responde `200` con el header correcto.

### 3.7 Stripe Webhooks

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://tudominio.com/api/webhooks/stripe`
3. Eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

---

## 4. Ambientes

| Ambiente | Propósito | Supabase | Vercel | Variables |
|----------|-----------|----------|--------|-----------|
| **Development** | Localhost | Proyecto dev (.co) | No aplica | `.env.local` |
| **Preview** | PRs/Branches | Proyecto dev (branch) | Vercel Preview | Hereda dev |
| **Production** | Producción real | Proyecto prod | Vercel Production | Variables prod |

### Estrategia de branches

```
main ──► producción
  │
  ├── feat/xxx ──► preview deploy
  └── fix/xxx  ──► preview deploy
```

---

## 5. Verificación Post-Deploy

### Checklist

- [ ] `https://tudominio.com` carga sin errores
- [ ] Login/Register funciona
- [ ] Se puede crear organización
- [ ] Se puede crear empleado
- [ ] Emails de invitación llegan (verificar con Resend logs)
- [ ] Dashboard carga con métricas
- [ ] Calendario carga sin errores
- [ ] Cron endpoints responden 200:
  ```bash
  curl -X POST https://tudominio.com/api/cron/check-reminders \
    -H "Authorization: Bearer <CRON_SECRET>"
  ```
- [ ] Stripe checkout session se crea
- [ ] Webhooks de Stripe responden 200
- [ ] Dark mode funciona
- [ ] Mobile responsive

---

## 6. Rollback

Si algo sale mal después del deploy:

```bash
# 1. Vercel: ir a Deployment → seleccionar versión anterior → Promote to Production
# 2. Supabase: restore desde backup (Settings → Database → Backups)
# 3. Stripe: los webhooks reintentan automáticamente por 3 días
```

---

## 7. Mantenimiento Continuo

| Tarea | Frecuencia | Responsable |
|-------|------------|-------------|
| Rotar `CRON_SECRET` | Cada 6 meses | DevOps |
| Verificar estado Supabase backup | Mensual | DevOps |
| Revisar Resend usage (evitar límite) | Mensual | Producto |
| Verificar cron heartbeat logs | Semanal | DevOps |
| Actualizar Stripe prices si cambian planes | Cuando cambien | Producto |

---

## 8. Variables de Entorno

Referencia completa en `docs/architecture/CURRENT/ENVIRONMENT.md`.

Las variables de Vercel se configuran por environment. No mezclar:
- Dev: `sk_test_*` (Stripe)
- Prod: `sk_live_*` (Stripe)
