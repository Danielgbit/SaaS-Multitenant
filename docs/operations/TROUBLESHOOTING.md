# Troubleshooting

> STATUS: CURRENT IMPLEMENTATION
> Last updated: 2026-05-27

---

## RLS policy blocks insert

**Síntoma:** Error `new row violates row-level security policy` al insertar/actualizar desde una Server Action.

**Causas posibles:**
- El usuario autenticado no es miembro de la organización (`organization_members`)
- La acción requiere role owner/admin pero el usuario es staff/employee
- Se está usando `createClient()` (anon key) donde se necesita `createServiceRoleClient()`

**Soluciones:**
```sql
-- Verificar membresía
SELECT * FROM organization_members WHERE user_id = auth.uid();
-- Verificar rol
SELECT role FROM organization_members WHERE user_id = auth.uid() AND organization_id = '...';
```

**Para cron/webhooks:** Usar `createServiceRoleClient()` que bypass RLS.

---

## Cron endpoint returns 401

**Síntoma:** `POST /api/cron/*` responde 401 Unauthorized.

**Causa:** El header `Authorization: Bearer <CRON_SECRET>` es incorrecto o falta.

**Verificar:**
```bash
curl -X POST https://tudominio.com/api/cron/check-reminders \
  -H "Authorization: Bearer <CRON_SECRET>"
```
Asegurar que el `CRON_SECRET` en el scheduler coincide con el de `.env.local` (o Vercel env vars).

---

## Supabase auth redirect loop

**Síntoma:** Al hacer login, el browser redirige repetidamente entre `/login` y la ruta protegida.

**Causa:** El proxy (`src/proxy.ts`) no detecta la sesión porque las cookies de Supabase no están configuradas correctamente.

**Verificar:**
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` son correctos
- `Site URL` en Supabase Auth Settings apunta al dominio correcto
- Las `Redirect URLs` incluyen `/auth/callback`

**Solución rápida:** Agregar `BYPASS_ADMIN_AUTH=true` en `.env.local` (solo dev).

**Solución definitiva:** Verificar el flujo de cookies de `@supabase/ssr` en `src/lib/supabase/client.ts`.

---

## Shadow logs not appearing

**Síntoma:** `shadow_notification_logs` está vacía aunque las notificaciones se envían.

**Causas posibles:**
- `SHADOW_NOTIFICATION_ENABLED=false` en `.env.local`
- El cron `shadow-notifications` no está configurado en cron-job.org
- El seeder falló en el hot path (timeout de 100ms)

**Verificar:**
```sql
SELECT * FROM shadow_notification_seeds ORDER BY created_at DESC LIMIT 10;
SELECT * FROM shadow_notification_logs ORDER BY created_at DESC LIMIT 10;
```
Si `seeds` tiene filas pero `logs` no, el cron runner no está ejecutándose.

---

## Email de invitación no llega

**Síntoma:** El empleado no recibe el email de invitación.

**Causas posibles:**
- `RESEND_API_KEY` inválida o expirada
- Dominio no verificado en Resend
- Supabase Auth SMTP no configurado
- Rate limiting de Supabase Auth (2 emails/día por defecto en plan free)

**Verificar:**
1. Resend Dashboard → API Keys → la key es válida
2. Resend Dashboard → Domains → `focusidestudio.com` verificado
3. Supabase Dashboard → Auth → Settings → SMTP configurado con Resend
4. En Supabase local: `config.toml` → `email_smtp` configurado, `email_sent = 30`

---

## Servicio muestra precio incorrecto

**Síntoma:** El precio de un servicio aparece como $20 en vez de $20.000 COP.

**Causa:** Los precios se almacenan como `NUMERIC(10,0)` multiplicados por 1000 (migración `services_price_to_integer`). Un valor de `20` en DB = $20.000 COP.

**Verificar:**
```sql
SELECT name, price, price/1000 AS price_cop FROM services;
```

**En código:** Los componentes deben dividir por 1000 para mostrar y multiplicar por 1000 al guardar.

---

## Error "relation does not exist" en producción

**Síntoma:** Una tabla que existe en dev no existe en producción.

**Causa:** Las migraciones no se aplicaron en producción.

**Solución:**
```bash
npx supabase link --project-ref <ref-prod>
npx supabase db push
```
O verificar en Supabase Dashboard → Database → Migrations.

---

## Hydration error en CalendarView

**Síntoma:** Error de React hydration en el calendario, especialmente con dark mode.

**Causa:** El server render usa un tema (light) pero el cliente hidrata con otro (dark). Los estilos dinámicos basados en `COLORS` difieren.

**Solución:** El componente `CalendarView` usa un estado `mounted` que retrasa el render hasta el cliente. Verificar que este patrón se mantenga y que los valores estáticos de Tailwind se usen para el server render.

---

## Notification queue stuck en "processing"

**Síntoma:** Items en `notification_queue` con status `processing` por más de 10 minutos.

**Causa:** El cron `process-notifications` falló antes de actualizar el status.

**Solución automática:** El cron recupera estos items en cada ejecución via `processing_timeout_at`.

**Verificar:**
```sql
SELECT * FROM notification_queue
WHERE status = 'processing' AND processing_timeout_at < NOW();
```

---

## Migración SQL falla con "column already exists"

**Síntoma:** Una migración falla porque la columna ya existe.

**Causa:** La migración se aplicó parcialmente antes, o se aplicó manualmente en el Dashboard y ahora Supabase CLI intenta re-aplicarla.

**Solución:**
1. Verificar el estado de la migración en Supabase Dashboard → Database → Migrations
2. Si ya está aplicada, usar `npx supabase migration repair --status applied <version>`
3. Si no, resolver el conflicto manualmente y re-aplicar

---

## Server Action no encuentra `revalidatePath`

**Síntoma:** Error `revalidatePath is not defined` en una Server Action.

**Causa:** `revalidatePath` y `revalidateTag` deben importarse explícitamente de `next/cache`.

**Solución:** Agregar `import { revalidatePath, revalidateTag } from 'next/cache'`.

---

## Stripe webhook no responde

**Síntoma:** Stripe Dashboard muestra errores al enviar webhooks al endpoint.

**Causa:** El endpoint `/api/webhooks/stripe` no está accesible públicamente o el signing secret es incorrecto.

**Verificar:**
- `STRIPE_SECRET_KEY` es correcta
- Stripe Dashboard → Webhooks → el endpoint URL está correcta
- Stripe Dashboard → Webhooks → signing secret coincide con el código
- El endpoint no requiere auth (es público para Stripe)
