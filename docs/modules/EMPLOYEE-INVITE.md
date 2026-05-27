# Arquitectura de Invitación de Empleados + Recuperación de Contraseña

## Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Problemas Identificados](#problemas-identificados)
3. [Decisiones Arquitecturales](#decisiones-arquitecturales)
4. [Flujos de Usuario](#flujos-de-usuario)
5. [Estructura de Archivos](#estructura-de-archivos)
6. [Server Actions](#server-actions)
7. [Componentes Frontend](#componentes-frontend)
8. [Esquema de Base de Datos](#esquema-de-base-de-datos)
9. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
10. [Guía de Pruebas](#guía-de-pruebas)

---

## Visión General

Este documento describe la implementación del sistema de invitación de empleados y recuperación de contraseña para el SaaS de bienestar y salud Prugressy.

### Objetivos
- Permitir que administradores (owners/admins) inviten empleados a sus organizaciones
- Habilitar que empleados creen su cuenta directamente desde el enlace de invitación
- Proporcionar flujo de recuperación de contraseña para usuarios existentes

---

## Problemas Identificados

### Problema 1: Formulario de Registro Incorrecto
El empleado invitado que visitaba `/invite/{token}` y no estaba logueado veía el formulario de registro de `/register`, que estaba diseñado para crear un negocio propio (con campos como "Nombre del Negocio").

```
// Flujo ROTO antes:
/invite/{token} → Sin sesión → Error "Debes iniciar sesión"
    → Empleado va a /login
    → "¿Olvidaste tu contraseña?" = # (placeholder)
    → "Solicitar acceso" → /register
    → ❌ Formulario de NEGOCIO, no de empleado
```

### Problema 2: No Existía Formulario de Creación de Contraseña
Un empleado nuevo (sin cuenta previa) no tenía forma de crear su contraseña. El flujo `acceptInvitation` requería que el usuario ya estuviera autenticado.

### Problema 3: "¿Olvidaste tu Contraseña?" No Funcionaba
El link apuntaba a `#` (placeholder) en lugar de una página funcional.

---

## Decisiones Arquitecturales

### Decisión 1: No Permitir Self-Registration Antes de Invitación
**Elegido: Opción B**

Un empleado NO puede registrarse por su cuenta antes de recibir una invitación. Esto evita:
- Conflictos de cuentas múltiples
- Empleados que acceden a datos de organizaciones ajenas
- Complejidad en gestión de membresías

### Decisión 2: Detectar Email Existente via signUp
**Elegido: signUp directo**

En lugar de consultar `auth.users` directamente o usar `signInWithPassword` dummy, se intenta `signUp` directamente:
- Si falla con "User already exists" → Redireccionar a login
- Si es exitoso → Continuar con acceptInvitation

```typescript
// Pseudocódigo
const { error } = await supabase.auth.signUp({ email, password })
if (error?.includes('already registered')) {
  return { error: 'Este correo ya está registrado. Por favor inicia sesión.' }
}
```

### Decisión 3: Login Contextual (Sin Toggle)
**Elegido: Link Contextual**

En lugar de implementar un toggle "Soy propietario" vs "Soy empleado", el login muestra texto diferente según el contexto:
- Si viene de `/invite/{token}` con email → Mensaje contextual
- Si es login directo → Flujo normal

### Decisión 4: Email Confirmation
**Elegido: NO para empleados, SÍ para owners**

| Rol | Email Confirmation |
|-----|-------------------|
| Empleados invitados | ❌ No requerido |
| Owners (self-registered) | ✅ Requerido |

Razón: El admin ya vetting al empleado, no hay necesidad de fricción adicional.

---

## Flujos de Usuario

### Flujo A: Empleado Nuevo (Sin Cuenta Previa)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EMPLEADO NUEVO                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Admin crea empleado en /employees                                │
│     - Nombre, Teléfono                                              │
│     - Click "Invitar al sistema"                                    │
│                                                                      │
│  2. Admin envía invitación                                          │
│     - Email con link: /invite/{token}                               │
│                                                                      │
│  3. Empleado abre link (en incognito/nuevo browser)                 │
│     → GET /invite/abc123-token                                      │
│     → Server valida token                                           │
│     → Token válido ✓                                                │
│     → Usuario NO logueado                                           │
│                                                                      │
│  4. Sistema detecta: email NO existe en auth.users                   │
│     → Mostrar: "Crea tu contraseña"                                 │
│                                                                      │
│  5. Empleado completa formulario                                    │
│     - Contraseña (mín 6 caracteres)                                 │
│     - Confirmar contraseña                                          │
│     - Click "Crear cuenta"                                          │
│                                                                      │
│  6. Server action: setupPasswordAndAccept                           │
│     a) verifyInvitation(token) → ✓                                  │
│     b) signUp(email, password) → ✓ Crea auth.users                 │
│     c) update employees.user_id → ✓ Vincula                         │
│     d) insert organization_members → ✓ Crea membresía                │
│     e) update invitation status → 'accepted'                        │
│     f) redirect /calendar                                           │
│                                                                      │
│  7. Empleado llega a /calendar                                      │
│     - Ve la organización del admin                                   │
│     - Puede gestionar citas asignadas                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Flujo B: Empleado Existente (Ya Tiene Cuenta)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   EMPLEADO EXISTENTE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Admin crea empleado + envía invitación                         │
│                                                                      │
│  2. Empleado abre link /invite/{token}                              │
│     → Token válido ✓                                                │
│     → Usuario NO logueado                                           │
│                                                                      │
│  3. Sistema intenta setupPasswordAndAccept                           │
│     → signUp falla con "User already exists"                        │
│                                                                      │
│  4. Server retorna error: "Este correo ya está registrado"         │
│                                                                      │
│  5. Frontend detecta error e incluye "ya está registrado"          │
│     → Mostrar mensaje "Ya tienes cuenta"                            │
│     → Link a /login?email=x&redirect=/invite/token                  │
│                                                                      │
│  6. Empleado inicia sesión en /login                                 │
│                                                                      │
│  7. Post-login, redirect a /invite/{token}                          │
│     → detectLoggedIn = true                                         │
│     → Mostrar botón "Aceptar invitación"                           │
│                                                                      │
│  8. Click "Aceptar invitación"                                      │
│     → acceptInvitation(token)                                       │
│     → Vincula employee → user (si no estaba vinculado)              │
│     → Crea organization_members                                     │
│     → redirect /calendar                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Flujo C: Usuario Ya Logueado (Empleado o Owner)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   USUARIO YA LOGUEADO                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Usuario recibe email con /invite/{token}                        │
│                                                                      │
│  2. Usuario ya tiene sesión activa en el browser                     │
│                                                                      │
│  3. Abre /invite/{token}                                           │
│     → Token válido ✓                                                │
│     → getUser() retorna usuario                                     │
│     → isLoggedIn = true                                             │
│                                                                      │
│  4. Frontend muestra directamente                                   │
│     → Botón "Aceptar invitación"                                    │
│     → "Te unirás como email@ejemplo.com"                           │
│                                                                      │
│  5. Click "Aceptar invitación"                                      │
│     → acceptInvitation(token)                                       │
│     → redirect /calendar                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Flujo D: Recuperación de Contraseña

```
┌─────────────────────────────────────────────────────────────────────┐
│                RECUPERACIÓN DE CONTRASEÑA                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Usuario va a /login                                              │
│                                                                      │
│  2. Click "¿Olvidaste tu contraseña?"                               │
│     → /forgot-password                                               │
│                                                                      │
│  3. Ingresa email                                                    │
│     → Click "Enviar enlace"                                          │
│                                                                      │
│  4. Server action: sendPasswordResetEmail                           │
│     → supabase.auth.resetPasswordForEmail(email)                    │
│     → Email enviado con link: /reset-password?token=xxx             │
│     → Link expira en 1 hora                                         │
│                                                                      │
│  5. Usuario abre email, click link                                   │
│     → /reset-password?token=abc                                     │
│                                                                      │
│  6. Sistema valida token de sesión de Supabase                       │
│                                                                      │
│  7. Usuario ingresa nueva contraseña                                 │
│     → Click "Guardar contraseña"                                    │
│                                                                      │
│  8. Server action: resetPassword                                    │
│     → supabase.auth.updateUser({ password: newPassword })           │
│     → redirect /login?message=password_reset_success               │
│                                                                      │
│  9. Usuario inicia sesión con nueva contraseña                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Estructura de Archivos

```
src/
├── actions/
│   ├── auth/
│   │   ├── index.ts                    # loginAction, registerAction, logoutAction
│   │   ├── sendPasswordResetEmail.ts   # NUEVO: Envía email de reset
│   │   └── resetPassword.ts            # NUEVO: Actualiza password
│   │
│   └── invitations/
│       ├── acceptInvitation.ts         # Ya existía (para usuarios logueados)
│       ├── setupPasswordAndAccept.ts   # NUEVO: SignUp + accept en un paso
│       ├── createInvitation.ts
│       ├── verifyInvitation.ts
│       └── ...
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx               # MODIFICADO: Link a forgot-password
│   │   │
│   │   ├── forgot-password/            # NUEVO
│   │   │   ├── page.tsx               # Página "¿Olvidaste tu contraseña?"
│   │   │   └── ForgotPasswordForm.tsx # Formulario
│   │   │
│   │   └── reset-password/            # NUEVO
│   │       ├── page.tsx               # Página "Nueva contraseña"
│   │       └── ResetPasswordForm.tsx   # Formulario
│   │
│   ├── (public)/
│   │   └── invite/
│   │       └── [token]/
│   │           ├── page.tsx           # MODIFICADO: Pasa isLoggedIn al form
│   │           └── AcceptInvitationForm.tsx  # REESCRITO: 3 flujos
│   │
│   └── (dashboard)/
│       └── ...
│
└── components/
    └── auth/
        ├── LoginForm.tsx              # MODIFICADO: Link a forgot-password
        ├── RegisterForm.tsx            # Sin cambios
        └── ...
```

---

## Server Actions

### 1. `setupPasswordAndAccept.ts`

**Ubicación:** `src/actions/invitations/setupPasswordAndAccept.ts`

```typescript
// Props: token, password, confirmPassword
// Returns: { success?: boolean; error?: string }

async function setupPasswordAndAccept(prevState, formData) {
  // 1. Validar input con Zod schema
  // 2. Verificar invitación (token, status='pending', no expirada)
  // 3. Intentear signUp:
  //    - Si "already exists" → return error con mensaje específico
  //    - Si otro error → return error
  //    - Si exitoso → continuar
  // 4. Vincular employee.user_id = auth.user.id
  // 5. Crear organization_members
  // 6. Marcar invitation.status = 'accepted'
  // 7. revalidatePath('/employees', '/calendar', '/dashboard')
  // 8. redirect('/calendar')
}
```

**Manejo de errores:**
- Token inválido/expirado → Mensaje claro + link para solicitar nueva invitación
- Email ya existe → Error específico → Frontend muestra "Ya tienes cuenta"
- Error de BD → Rollback de auth user creado

### 2. `sendPasswordResetEmail.ts`

**Ubicación:** `src/actions/auth/sendPasswordResetEmail.ts`

```typescript
// Props: email (via formData)
// Returns: { success?: boolean; error?: string }

async function sendPasswordResetEmail(prevState, formData) {
  // 1. Validar email con Zod
  // 2. supabase.auth.resetPasswordForEmail(email, {
  //      redirectTo: `${BASE_URL}/reset-password`
  //    })
  // 3. Retornar success
}
```

### 3. `resetPassword.ts`

**Ubicación:** `src/actions/auth/resetPassword.ts`

```typescript
// Props: password, confirmPassword
// Returns: { success?: boolean; error?: string }

async function resetPassword(prevState, formData) {
  // 1. Validar passwords (mín 6 chars, deben coincidir)
  // 2. Verificar usuario logueado (getUser)
  // 3. updateUser({ password: newPassword })
  // 4. Return success
}
```

---

## Componentes Frontend

### `AcceptInvitationForm.tsx`

**Ubicación:** `src/app/(public)/invite/[token]/AcceptInvitationForm.tsx`

**Props:**
```typescript
interface AcceptInvitationFormProps {
  token: string
  invitationEmail?: string | null
  isLoggedIn?: boolean
}
```

**Estados del formulario:**
```typescript
type FlowState = 'loading' | 'new_user' | 'existing_user' | 'logged_in'
```

**Lógica de renderizado:**
```tsx
// Si success → Mostrar "¡Bienvenido!" + redirect
if (localSuccess || setupState?.success) {
  return <SuccessView />
}

// Si error contiene "ya está registrado" → Existing user view
if (setupState?.error?.includes('ya está registrado')) {
  return <ExistingUserView />
}

// Si isLoggedIn → Logged in view (botón simple)
if (isLoggedIn) {
  return <LoggedInView />
}

// Default → New user view (form password)
return <NewUserForm />
```

### `LoginForm.tsx`

**Cambio:** El link "¿Olvidaste tu contraseña?" ahora apunta a `/forgot-password`

```tsx
// Antes
<Link href="#" className="...">¿Olvidaste tu contraseña?</Link>

// Después
<Link href="/forgot-password" className="...">¿Olvidaste tu contraseña?</Link>
```

---

## Esquema de Base de Datos

### Tabla: `employee_invitations`

```sql
CREATE TABLE employee_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    email VARCHAR(255),                    -- Email del invitado
    token VARCHAR(255) NOT NULL UNIQUE,   -- Token único para el link
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- Status: 'pending' | 'accepted' | 'cancelled'
    expires_at TIMESTAMPTZ NOT NULL,       -- Expiración del token (7 días)
    accepted_at TIMESTAMPTZ,               -- Cuándo se aceptó
    resend_count INT DEFAULT 0,
    last_resend_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(organization_id, email, status)
);
```

### Tabla: `employees`

```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),  -- Nullable: NULL = sin cuenta
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `organization_members`

```sql
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),
    role VARCHAR(50) NOT NULL,  -- 'owner' | 'admin' | 'staff'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);
```

---

## Consideraciones de Seguridad

### 1. Validación de Input
- Todos los inputs se validan con Zod schema en server actions
- Contraseñas: mínimo 6 caracteres
- Tokens: UUID válido

### 2. Rate Limiting
- Invitaciones: Máximo 10 reenvíos por hora (`can_resend_invitation` function)
- Reset password: Supabase maneja rate limiting internamente

### 3. Expiración de Tokens
- Tokens de invitación expiran en 7 días
- Tokens de reset password expiran en 1 hora (Supabase)

### 4. Row Level Security (RLS)
```sql
-- Policy: Solo owner/admin pueden ver/invitar
CREATE POLICY "Owners can manage invitations" ON employee_invitations
    FOR ALL 
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Policy: Cualquiera puede verificar token (solo lectura)
CREATE POLICY "Anyone can verify token" ON employee_invitations
    FOR SELECT 
    USING (status = 'pending' AND expires_at > NOW());
```

### 5. Rollback en Caso de Error
Si falla la creación de `organization_members` después de crear el auth user:
```typescript
// 1. Delete auth user
await supabase.auth.admin.deleteUser(user.id)

// 2. Limpiar employee.user_id
await supabase.from('employees').update({ user_id: null })
```

---

## Guía de Pruebas

### Prueba 1: Empleado Nuevo (Camino Feliz)

```bash
# 1. Crear empleado
- Ir a /employees
- Click "Nuevo Empleado"
- Completar: Nombre, Teléfono
- Guardar

# 2. Enviar invitación
- Click "Invitar" en el empleado recién creado
- Modal: Seleccionar rol (staff/admin)
- Opcional: Ingresar email
- Click "Enviar invitación"

# 3. Verificar en Supabase
SELECT * FROM employee_invitations WHERE employee_id = '<id>';

# 4. Simular empleado (incognito)
- Abrir link /invite/{token}
- Verificar: "Crea tu contraseña" (formulario)
- Completar contraseña
- Click "Crear cuenta"

# 5. Verificar resultado
SELECT * FROM employees WHERE id = '<id>';  -- user_id debería estar lleno
SELECT * FROM organization_members WHERE user_id = '<auth_user_id>';
SELECT * FROM employee_invitations WHERE token = '<token>';  -- status = 'accepted'

# 6. Verificar login
- Ir a /login
- Credenciales creadas
- Debería entrar y ver /calendar
```

### Prueba 2: Empleado Existente (Ya Tiene Cuenta)

```bash
# 1. Crear auth user manualmente o usar uno existente
# (supabase.auth.admin.createUser)

# 2. Crear empleado + enviar invitación con ese email

# 3. Simular empleado (incognito)
- Abrir link /invite/{token}
- Verificar: Mensaje "Ya tienes cuenta"
- Click "Iniciar sesión"

# 4. Login con credenciales existentes
- Should redirect back to /invite/{token}
- Should show "Aceptar invitación"

# 5. Click "Aceptar invitación"
- Should redirect to /calendar
```

### Prueba 3: Recuperación de Contraseña

```bash
# 1. Ir a /login

# 2. Click "¿Olvidaste tu contraseña?"

# 3. Ingresar email de usuario existente
- Click "Enviar enlace"

# 4. Verificar en email (console.log de Supabase o邮件)
- Should have email with link /reset-password?token=xxx

# 5. Click link del email
- Should open /reset-password

# 6. Ingresar nueva contraseña
- Click "Guardar contraseña"

# 7. Should redirect to /login
- Message: "password_reset_success"

# 8. Login con nueva contraseña
- Should work
```

### Checklist de Verificación

```markdown
[ ] El empleado NUEVO puede crear cuenta desde /invite/{token}
[ ] El empleado EXISTENTE es redirigido a login y luego puede aceptar
[ ] El usuario YA LOGUEADO ve botón simple de "Aceptar invitación"
[ ] La invitación se marca como 'accepted' al aceptar
[ ] El employee.user_id se vincula correctamente
[ ] El organization_members se crea con el rol correcto
[ ] El usuario llega a /calendar después de aceptar
[ ] "¿Olvidaste tu contraseña?" funciona
[ ] El email de reset se envía
[ ] El link de reset funciona y permite cambiar password
[ ] No se puede usar un token de invitación expirado
[ ] No se puede aceptar una invitación ya aceptada
```

---

## APIs de Supabase Utilizadas

| Función | Uso |
|---------|-----|
| `supabase.auth.signUp()` | Crear cuenta de empleado |
| `supabase.auth.signInWithPassword()` | Login normal |
| `supabase.auth.resetPasswordForEmail()` | Enviar email de recuperación |
| `supabase.auth.updateUser()` | Actualizar password |
| `supabase.auth.getUser()` | Verificar sesión activa |
| `supabase.auth.admin.deleteUser()` | Rollback en caso de error |
| `supabase.auth.admin.getUserById()` | No usado (alternativa) |

---

## Configuración de Supabase

### Email Templates (Dashboard de Supabase)
Para que los emails de recuperación funcionen, configurar en Supabase Dashboard:
- **URL de Redirección**: Agregar el dominio de producción
- **Template de Reset Password**: Personalizable

### Auth Settings
```json
{
  "site_url": "http://localhost:3000",
  "additional_redirect_urls": ["https://tu-dominio.com"],
  "email_security": {
    "enable_signup": true,
    "enable_confirmations": false  // Para empleados
  }
}
```

---

## Métricas de Éxito

- [ ] 100% de invitaciones enviadas resultan en cuenta creada
- [ ] Tiempo promedio de onboarding de empleado < 2 minutos
- [ ] 0% de errores de "cuenta ya existe" sin manejo apropiado
- [ ] Rate de recuperación de contraseña > 90%

---

## Roadmap Futuro

1. **Email templates personalizados** - Mejorar emails de invitación
2. **Notificaciones push** - Para empleados sin email
3. **Magic links** - Alternativa a contraseñas
4. **SSO/OAuth** - Google, Microsoft para empresas
5. **Audit log** - Tracking de quién aceptó qué invitación

---

*Documento generado: Marzo 2026*
*Versión del sistema: 1.0*
