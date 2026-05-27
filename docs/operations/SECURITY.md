# Security

> STATUS: CURRENT IMPLEMENTATION
> Last updated: 2026-05-27

---

## 1. Rate Limiting

### Endpoints protegidos

| Endpoint | Límite | Ventana | Llave |
|----------|--------|---------|-------|
| `POST /login` | 5 intentos | 60s | IP |
| `POST /register` | 3 intentos | 300s | IP |
| `POST /api/webhooks/*` | 60 requests | 60s | IP |

**Implementación:** Sliding window in-memory (`src/lib/rate-limiter.ts`).
**No es distribuido** — funciona por instancia. Si se escala a múltiples instancias, migrar a Redis.

### Cómo ajustar límites

```typescript
import { authLimiter, registerLimiter, webhookLimiter } from '@/lib/rate-limiter'

// Valores por defecto
// authLimiter: 5 requests / 60s
// registerLimiter: 3 requests / 300s
// webhookLimiter: 60 requests / 60s
```

Los límites se configuran en `src/lib/rate-limiter.ts`.

### Structured logging

Cada rate limit excedido loggea:

```json
{ "type": "rate_limit_exceeded", "ip": "...", "route": "...", "timestamp": "..." }
```

Esto permite monitorear abuso sin sistema de observabilidad externo.

---

## 2. Origin Validation (CSRF ligero)

Las Server Actions verifican el header `Origin` contra `Host` para prevenir CSRF.

**Implementación:** `src/lib/csrf.ts`

```typescript
function validateOrigin(request: Request): { valid: boolean; reason?: string }
```

- Si `Origin` coincide con `Host` → permitido
- Si `Origin` no existe (curl, clientes HTTP simples) → permitido (no bloquea APIs)
- Si `Origin` no coincide con `Host` → rechazado

**Limitación:** El modelo Double Submit Cookie con `httpOnly: false` es vulnerable a XSS.
Un atacante con XSS puede leer el token. Mitigación: SameSite=Lax + Origin validation.

---

## 3. Webhooks

### Stripe

| Medida | Implementación |
|--------|----------------|
| Signature verification | ✅ `stripe.webhooks.constructEvent()` con `STRIPE_WEBHOOK_SECRET` |
| Idempotency | ✅ In-memory best-effort (`Set<string>`) |

### Notifications

| Medida | Implementación |
|--------|----------------|
| Provider validation | ✅ `provider.validateWebhook()` por provider (Wasender, N8N) |
| Auth fallback | ✅ `Authorization: Bearer <WEBHOOK_SECRET>` cuando está configurado |
| Idempotency | ✅ In-memory best-effort por `providerMessageId` |
| Rate limiting | ✅ 60 requests/min por IP |

### Idempotency caveats

La idempotencia es **best-effort y en memoria**. Esto protege contra duplicados inmediatos dentro de una misma instancia, pero:

- No persiste entre deploys (el Set se pierde al reiniciar)
- No funciona en multi-instancia
- No garantiza deduplicación a través de restarts

Para idempotencia persistente, migrar a tabla `webhook_events` en PostgreSQL cuando el volumen lo requiera.

---

## 4. Cron Jobs

Todos los endpoints cron usan `Bearer CRON_SECRET` para autenticación.

**Implementación:** Check manual del header `Authorization` en cada `route.ts`.

No tienen rate limiting porque el CRON_SECRET actúa como control de acceso.
Si se detecta abuso, rotar el CRON_SECRET.

---

## 5. Base de Datos

### RLS (Row Level Security)

Todas las tablas tenant-specific tienen políticas RLS que filtran por `organization_id`.
El patrón principal:

```sql
organization_id IN (
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
)
```

Tablas con datos sensibles (payroll, billing) requieren rol `owner` o `admin` además de membresía.

### Service Role

El `SUPABASE_SERVICE_ROLE_KEY` se usa solo en:
- Endpoints cron (bypass RLS para operaciones internas)
- Webhooks (bypass RLS para eventos externos)
- Shadow mode (validación offline)

NUNCA se expone al cliente.

---

## 6. Checklist de Seguridad para PRs

- [ ] ¿La Server Action verifica que el usuario es miembro de la organización?
- [ ] ¿La operación requiere un rol específico (owner/admin/staff)?
- [ ] ¿La ruta API tiene autenticación (CRON_SECRET, WEBHOOK_SECRET)?
- [ ] ¿Los rate limits adecuados están aplicados?
- [ ] ¿Se está usando `createServiceRoleClient()` donde se necesita bypass RLS?
- [ ] ¿Las consultas SQL incluyen filtro por `organization_id`?
