# Guía de Testing: Sistema de Invitación de Empleados

## Objetivo
Probar el flujo completo desde que un admin invita a un empleado hasta que este accede a su cuenta vinculada a la organización.

---

## Pre-requisitos

- [ ] Tener acceso a Supabase (dashboard o SQL editor)
- [ ] Tener la app corriendo en `localhost:3000`
- [ ] Tener un usuario Owner/Admin creado
- [ ] Opcional: Extensión de Chrome "EditThisCookie" para ver cookies

---

## Escenario 1: Empleado Nuevo (Sin cuenta previa)

### Paso 1: Crear empleado como Admin

```
1. Ir a http://localhost:3000/calendar
2. Iniciar sesión como Owner/Admin
3. Ir a http://localhost:3000/employees
4. Click "Nuevo Empleado"
5. Completar:
   - Nombre: "María García"
   - Teléfono: "+57 300 123 4567"
6. Click "Guardar"
7. Guardar el employee_id mostrado (o buscarlo después)
```

### Paso 2: Enviar invitación

```
1. En la lista de empleados, buscar "María García"
2. Click en el botón "Invitar" (icono de sobre o "Invitar al sistema")
3. Modal debería aparecer
4. Verificar:
   - Email mostrado (debe coincidir con el employee)
   - Rol: "staff" (default)
5. Click "Enviar invitación"
6. Verificar en toast/feedback: "Invitación enviada"
```

### Paso 3: Verificar en Base de Datos

```sql
-- Ejecutar en Supabase SQL Editor
SELECT 
  ei.id,
  ei.email,
  ei.token,
  ei.status,
  ei.expires_at,
  e.name as employee_name,
  o.name as org_name
FROM employee_invitations ei
JOIN employees e ON e.id = ei.employee_id
JOIN organizations o ON o.id = ei.organization_id
WHERE e.name = 'María García'
AND ei.status = 'pending';
```

**Resultado esperado:**
- `status` = 'pending'
- `token` = string UUID largo
- `expires_at` = fecha futura (7 días)

### Paso 4: Simular empleado (navegador incognito)

```
1. Abrir ventana de incognito (Ctrl+Shift+N en Chrome)
2. Ir a http://localhost:3000/invite/{TOKEN}
   (reemplazar {TOKEN} con el token de la consulta SQL)
3. Verificar página de invitación:
   - Título: "Te han invitado"
   - Nombre de organización visible
   - Nombre del empleado visible
   - Rol: "staff"
```

### Paso 5: Crear contraseña (formulario)

```
1. En el formulario, verificar que muestre:
   - "Crea tu contraseña"
   - Email deshabilitado (mostrando el email correcto)
   - Campo contraseña
   - Campo confirmar contraseña

2. Completar:
   - Contraseña: "Test123!"
   - Confirmar: "Test123!"

3. Click "Crear cuenta"

4. Esperar redirect a /calendar (1-2 segundos)
```

### Paso 6: Verificar vinculación en DB

```sql
-- Ejecutar en Supabase SQL Editor
SELECT 
  e.name,
  e.user_id,
  om.role,
  o.name as org_name
FROM employees e
JOIN organization_members om ON om.user_id = e.user_id
JOIN organizations o ON o.id = om.organization_id
WHERE e.name = 'María García';
```

**Resultado esperado:**
- `user_id` = UUID (no NULL)
- `role` = 'staff'
- employee vinculado a organización correcta

### Paso 7: Verificar invitación marcada

```sql
SELECT status, accepted_at 
FROM employee_invitations 
WHERE token = '{TOKEN}';
```

**Resultado esperado:**
- `status` = 'accepted'
- `accepted_at` = timestamp reciente

### Paso 8: Verificar acceso del empleado

```
1. En el navegador incognito, verificar que está en /calendar
2. Navegar a diferentes páginas:
   - /calendar → Debería ver el calendario
   - /clients → Debería ver la lista de clientes (solo de su org)
3. Ir a /employees → Debería ver solo su propio perfil, NO la lista completa
```

### Paso 9: Logout y login del empleado

```
1. Click en dropdown de usuario (esquina superior derecha)
2. Click "Cerrar sesión"
3. Verificar redirect a /login
4. Intentar login con:
   - Email: (el email del empleado)
   - Contraseña: "Test123!"
5. Debería entrar y redirigir a /calendar
```

---

## Escenario 2: Empleado Existente (Ya tiene cuenta)

### Paso 1: Crear usuario manualmente en Supabase (o usar uno existente)

```sql
-- Opción A: Crear usuario directamente (para testing)
-- Ir a Supabase Dashboard > Authentication > Users > Add User

-- Opción B: Usar SQL (requiere admin rights)
INSERT INTO auth.users (id, email, created_at)
VALUES ('generate-uuid-here', 'empleado_existente@test.com', NOW());
```

### Paso 2: Crear empleado y vincular al usuario existente

```
1. Como Admin, ir a /employees
2. Crear empleado "Carlos López" con:
   - Email: empleado_existente@test.com
   - Teléfono: +57 300 654 3210
3. Vincular manualmente el user_id en la DB:
```

```sql
UPDATE employees 
SET user_id = 'uuid-del-usuario-existente'
WHERE email = 'empleado_existente@test.com';
```

### Paso 3: Enviar invitación

```
1. En /employees, buscar "Carlos López"
2. Click "Invitar"
3. Enviar invitación
```

### Paso 4: Simular empleado existente

```
1. Abrir ventana incognito
2. Ir a http://localhost:3000/invite/{TOKEN}
3. Verificar mensaje: "Ya tienes una cuenta"
4. Click "Iniciar sesión"
5. Debería redirigir a: /login?email=empleado_existente@test.com&redirect=/invite/{TOKEN}
```

### Paso 5: Login con cuenta existente

```
1. Verificar que el campo email está precargado con: empleado_existente@test.com
2. Ingresar contraseña de ese usuario
3. Click "Iniciar sesión"
4. Debería redirigir a: /invite/{TOKEN}
5. Mostrar botón "Aceptar invitación" (porque ya está logueado)
```

### Paso 6: Aceptar invitación

```
1. Click "Aceptar invitación"
2. Esperar redirect a /calendar
3. Verificar en DB que organization_members fue creado
```

---

## Escenario 3: Usuario ya logueado recibe invitación

### Paso 1: Estar logueado como usuario normal

```
1. Abrir navegador normal (NO incognito)
2. Ir a /login
3. Login con credenciales de empleado (María García de Escenario 1)
```

### Paso 2: Admin envía invitación a ese email

```
1. En otro browser/incognito, como Admin
2. Crear nuevo empleado "Juan Pérez"
3. Usar el mismo email del empleado ya logueado
4. Enviar invitación
```

### Paso 3: Abrir link de invitación

```
1. En el navegador donde está logueado "María García"
2. Abrir el link de invitación de "Juan Pérez"
3. Verificar que muestra directamente:
   - "Aceptar invitación" (sin formulario de password)
   - Texto: "Te unirás como email@ejemplo.com"
```

### Paso 4: Aceptar y verificar multi-org

```
1. Click "Aceptar invitación"
2. Verificar redirect a /calendar
3. Ir a /dashboard
4. Verificar que puede ver datos de AMBAS organizaciones
   (o verificar que el switcher de orgs muestra ambas)
```

---

## Escenario 4: Recuperación de Contraseña

### Paso 1: Solicitar recuperación

```
1. Ir a /login
2. Click "¿Olvidaste tu contraseña?"
3. Verificar que está en /forgot-password
4. Ingresar email de un usuario existente (María García)
5. Click "Enviar enlace"
```

### Paso 2: Verificar en Supabase

```sql
-- En Authentication > Users > Maria Garcia
-- O buscar en auth.users
-- El campo last_sign_in_at debería estar vacío o ser antiguo
-- Verificar que recibe el email (en producción)
```

**Nota local:** Para testing local, Supabase typically muestra los emails en su dashboard o logs.

### Paso 3: Simular click en email

```
1. Copiar el link de reset del email o Supabase dashboard
2. Pegar en navegador: http://localhost:3000/reset-password?token=XXX
3. Verificar página: "Nueva contraseña"
```

### Paso 4: Cambiar contraseña

```
1. Ingresar nueva contraseña: "NuevaTest456!"
2. Confirmar: "NuevaTest456!"
3. Click "Guardar contraseña"
4. Esperar redirect a /login?message=password_reset_success
5. Verificar banner verde: "Contraseña actualizada correctamente"
```

### Paso 5: Login con nueva contraseña

```
1. Verificar email precargado
2. Ingresar: "NuevaTest456!"
3. Click "Iniciar sesión"
4. Debería entrar correctamente
```

---

## Checklist de Verificación Final

### Flujo de Invitación
- [ ] Admin puede crear empleado
- [ ] Admin puede enviar invitación
- [ ] Token se genera y guarda en DB
- [ ] Email con link se envía (verificar en Supabase)
- [ ] Link funciona y muestra página correcta
- [ ] Empleado NUEVO puede crear contraseña
- [ ] Cuenta se crea en auth.users
- [ ] employee.user_id se vincula
- [ ] organization_members se crea con rol correcto
- [ ] Invitation se marca como 'accepted'
- [ ] Redirect a /calendar funciona
- [ ] Empleado ve datos de su organización

### Flujo Login Post-Invitación
- [ ] Login detecta redirect_to del form
- [ ] Redirect funciona después de login
- [ ] Email se precarga desde URL
- [ ] Empleado EXISTENTE ve mensaje correcto
- [ ] Link a login incluye redirect correcto
- [ ] post-login redirige al invite
- [ ] Botón "Aceptar invitación" visible

### Flujo Recuperación Password
- [ ] Link "¿Olvidaste tu contraseña?" funciona
- [ ] /forgot-password muestra formulario
- [ ] Email se valida
- [ ] Email de reset se envía
- [ ] Link en email abre /reset-password
- [ ] Token se valida
- [ ] Nueva contraseña se guarda
- [ ] Redirect a /login con mensaje de éxito
- [ ] Banner verde visible
- [ ] Login con nueva contraseña funciona

---

## Posibles Errores y Soluciones

### Error: "Token inválido"
- Token mal copiado → Verificar en DB el token exacto
- Token expirado → Verificar `expires_at` en DB
- Invitación ya aceptada → `status` = 'accepted'

### Error: "Usuario ya registrado"
- Normal si el usuario ya tiene cuenta → Flujo B

### Error: "No se pudo vincular tu cuenta"
- Error de RLS → Verificar policies en employee_invitations
- Error de FK → Verificar que employee_id existe

### Error: "Debes iniciar sesión"
- En acceptInvitation → El usuario no está logueado
- Solución: Hacer login primero

### Error: Redirect no funciona
- `redirect()` en server action ignora query params → Ahora usa campo hidden (verificado)
- Verificar que el form incluye `<input type="hidden" name="redirect_to" ...>`

---

## Scripts SQL de Cleanup (Para repetir testing)

```sql
-- 1. Eliminar invitación
DELETE FROM employee_invitations 
WHERE employee_id IN (
  SELECT id FROM employees WHERE name = 'María García'
);

-- 2. Desvincular empleado
UPDATE employees SET user_id = NULL WHERE name = 'María García';

-- 3. Eliminar membresía
DELETE FROM organization_members 
WHERE user_id IN (
  SELECT user_id FROM employees WHERE name = 'María García'
);

-- 4. Eliminar usuario (CUIDADO - esto es irreversible)
-- Solo si creaste el usuario para testing
DELETE FROM auth.users WHERE email = 'maria@test.com';

-- 5. Eliminar empleado
DELETE FROM employees WHERE name = 'María García';
```

---

*Documento creado: 2026-03-28*
*Versión del sistema: 1.0 MVP*
