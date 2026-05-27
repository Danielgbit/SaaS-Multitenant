# ADR-003: Proxy Middleware vs Next.js Middleware

> STATUS: ACCEPTED
> Date: 2026-05-27
> Source of truth: `src/proxy.ts`, `src/middleware.ts` (si existe)

---

## Contexto

Next.js App Router ofrece `middleware.ts` para lógica de autenticación y redirección en el edge. Inicialmente el proyecto intentó usar este approach, pero se encontraron las siguientes limitaciones:

1. **El middleware de Next.js corre en el Edge Runtime** — No puede acceder a `@supabase/ssr` con cookies de forma confiable para todas las operaciones de auth
2. **Las Server Actions bypassan el middleware** — Una Server Action puede ejecutarse sin pasar por la validación del middleware
3. **Los cron endpoints necesitan bypass** — Las rutas `/api/cron/*` deben saltar la verificación de sesión porque usan `CRON_SECRET` + service role
4. **El middleware de Next.js no puede leer cookies en redirects cross-origin** para el flujo de auth de Supabase

## Decisión

Implementar un **proxy module** (`src/proxy.ts`) que se importa en Server Components y Server Actions para verificar autenticación, en lugar de depender del middleware de Next.js.

### Flujo actual

```
Request → Server Component / Server Action
              │
              └── proxy.ts.checkAuth()
                      │
                      ├── ¿Ruta pública? (/api/cron/*, /invite/*, /reservar/*) → OK
                      ├── ¿Sesión activa? → OK
                      └── No sesión → redirect(/login)
```

### El middleware de Next.js solo se usa para:

- Headers de seguridad (CSP, HSTS)
- Redirects de dominio (www → naked, etc.)
- Logging de requests (opcional)

No se usa para lógica de autenticación.

## Consecuencias

### Positivas

- La verificación de auth ocurre en el runtime correcto (Node.js, no Edge)
- Server Actions pueden verificar sesión de forma confiable (acceso a `@supabase/ssr`)
- Los cron endpoints tienen bypass explícito y claro
- El flujo de auth de Supabase funciona correctamente con cookies

### Negativas

- Cada Server Component/Server Action debe importar `proxy.ts` explícitamente (no es automático como middleware)
- El código de auth está ligeramente más disperso que con middleware centralizado
- Los nuevos developers pueden preguntarse por qué no usamos `middleware.ts`

## Alternativas Consideradas

| Alternativa | Razón de rechazo |
|-------------|-------------------|
| Middleware de Next.js puro | Server Actions lo bypassan; edge runtime no puede leer cookies de Supabase correctamente |
| middleware.ts + API routes para auth | Complejidad adicional sin beneficio real sobre proxy.ts |
| HOC wrapper para Server Components | Similar a proxy.ts pero con peor ergonomía |

## Referencias

- Proxy: `src/proxy.ts`
- Uso en Server Actions: `import { checkAuth } from '@/proxy'`
- Bypass cron: `if (pathname.startsWith('/api/cron/')) return`
