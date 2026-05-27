# Setup — Prügressy

Guía paso a paso para poner el proyecto en funcionamiento localmente.

---

## Prerrequisitos

- Node.js 20+ (verificar con `node --version`)
- npm (`npm --version`)
- Cuenta en [Supabase](https://supabase.com) (plan free suficiente)
- Cuenta en [Resend](https://resend.com) (100 emails/día gratis)
- [Opcional] Cuenta en [Stripe](https://stripe.com) para billing

---

## Paso 1: Clonar e instalar dependencias

```bash
git clone <repo-url>
cd saas
npm install
```

---

## Paso 2: Variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` y reemplazar los placeholders:

| Variable | Dónde obtenerla |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API (anon public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (service_role — mantener segura) |
| `RESEND_API_KEY` | Resend Dashboard → API Keys |
| `RESEND_FROM_EMAIL` | Un dominio verificado en Resend |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `CRON_SECRET` | Generar un UUID: `node -e "console.log(crypto.randomUUID())"` |

> **NUNCA** commitees `.env.local`. Está en `.gitignore`.

---

## Paso 3: Base de datos

Las migraciones están en `supabase/migrations/` (~44 archivos).

### Opción A: Supabase Cloud (recomendado para empezar)

```bash
# Si tienes Supabase CLI instalado
npx supabase login
npx supabase link --project-ref <project-id>
npx supabase db push

# Alternativa: ejecutar manualmente desde Supabase Dashboard
# SQL Editor → copiar y pegar cada migration en orden cronológico
```

### Opción B: Supabase Local

```bash
npx supabase start
npx supabase db push
```

> **Importante:** Las migraciones están diseñadas para aplicarse en secuencia.
> No saltarse ninguna. El orden es cronológico por nombre de archivo.

---

## Paso 4: Verificar el setup

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Checklist de verificación

- [ ] La página de login carga sin errores
- [ ] Puedes registrarte como nuevo usuario
- [ ] Se crea una organización automáticamente ("Mi Negocio")
- [ ] El dashboard carga con métricas en cero
- [ ] Puedes crear un servicio (precio en COP)
- [ ] Puedes crear un empleado
- [ ] El calendario carga sin errores

---

## Paso 5: Configurar Supabase Auth (SMTP)

Para que los emails de invitación y recuperación de contraseña funcionen en producción:

1. Supabase Dashboard → Authentication → Settings
2. Configurar SMTP con las credenciales de Resend:

| Campo | Valor |
|-------|-------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `smtp` |
| Password | Tu `RESEND_API_KEY` |
| Sender email | `noreply@focusidestudio.com` |

3. En Auth Settings → Site URL: `http://localhost:3000` (dev) o tu dominio (prod)
4. Agregar URLs de redirección adicionales según entorno

---

## Solución de problemas comunes

### Error: `Supabase client not initialized`

Las variables de entorno no están configuradas o `.env.local` no existe.
Verificar que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` tengan valores.

### Error: `relation "organizations" does not exist`

Las migraciones no se han ejecutado. Correr `npx supabase db push`.

### Error: `Port 3000 is already in use`

```bash
# Encontrar proceso usando el puerto
netstat -ano | findstr :3000
# Matar el proceso (reemplazar PID)
taskkill /PID <PID> /F
```

### Error: `Auth session missing` en Server Actions

El middleware/proxy (`src/proxy.ts`) requiere sesión activa.
Asegurarse de estar autenticado. Si el problema persiste, verificar `BYPASS_ADMIN_AUTH=true` en `.env.local`.

### Error: `Failed to send email`

Verificar que `RESEND_API_KEY` es válida y que el dominio del `RESEND_FROM_EMAIL` está verificado en Resend.

### Error de migración: `column "X" of relation "Y" already exists`

La migración ya fue aplicada parcialmente. Verificar el estado en Supabase Dashboard → Database → Migrations.

---

## Scripts de utilidad

| Script | Descripción |
|--------|-------------|
| `npm run guard` | Architecture drift detection (colors, primitives, hovers) |
| `npm run guard:ci` | Drift detection en formato GitHub Actions |
| `npm run test` | Tests unitarios con Vitest |
| `npm run lint` | ESLint |
| `npm run analyze` | Bundle analyzer |

---

## Docs relacionados

- `.env.example` — Variables de entorno documentadas
- `docs/architecture/CURRENT/ENVIRONMENT.md` — Referencia detallada de env vars
- `docs/architecture/CURRENT/DATABASE.md` — Schema y migraciones
- `docs/operations/DEPLOYMENT.md` — Despliegue a producción
