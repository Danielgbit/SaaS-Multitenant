---
name: supabase-db-migrations
description: Usa esta skill cuando necesites ejecutar cambios de esquema (DDL) en la base de datos de Supabase, como crear tablas, añadir columnas, crear índices o modificar restricciones. También para verificar el estado del esquema o consultar datos directamente.
---

# Skill: Migraciones de Base de Datos Supabase

Esta skill guía al agente para ejecutar cambios en la base de datos de Supabase del proyecto Prügressy SaaS.

## Escenario Común

Cuando necesitas modificar el esquema de la base de datos (crear tablas, añadir columnas, crear índices, etc.) no puedes usar Server Actions regulares porque `supabase-js` solo permite **DML** (SELECT, INSERT, UPDATE, DELETE). Para **DDL** necesitas la CLI de Supabase.

## Pasos para Ejecutar una Migración

### 1. Verificar el Estado del Proyecto

Antes de hacer cambios, verifica que el proyecto está vinculado:

```bash
npx supabase projects list
```

Deberías ver el proyecto "SaaS" marcado con `●` indicando que es el proyecto actual.

### 2. Crear el Archivo de Migración

Crea el archivo en `supabase/migrations/` con el formato:
`YYYYMMDDHHMMSS_nombre_descriptivo.sql`

Ejemplo: `20260505000000_agregar_tabla_payroll_items.sql`

**Importante:** El archivo debe tener un nombre único y descriptivo.

### 3. Enviar la Migración a Supabase

Usa el comando:

```bash
echo Y | npx supabase db push --linked
```

- `echo Y` auto-confirma la pregunta interactiva
- `--linked` usa el proyecto configurado en `supabase/config.toml`
- Si hay múltiples migraciones pendientes, se ejecutarán en orden

### 4. Verificar que se Aplicó

Consulta directamente la base de datos para confirmar:

```bash
npx supabase db query --linked "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

## Comandos Útiles de Supabase CLI

### Consultas Directas (SELECT, INSERT, UPDATE, DELETE)

```bash
npx supabase db query --linked "SELECT * FROM tabla LIMIT 10;"
```

Este comando es **solo lectura** y permite verificar datos.

### Ver Migraciones Pendientes

```bash
npx supabase db push --dry-run --linked
```

### Ver Historial de Migraciones Aplicadas

```bash
npx supabase migration list --linked
```

### Resetear la Base de Datos (¡PELIGRO!)

```bash
npx supabase db reset --linked
```

**Advertencia:** Esto elimina TODOS los datos y reaplica todas las migraciones desde cero.

## Estructura de Archivos del Proyecto

```
saas/
├── supabase/
│   ├── config.toml          # Configuración del proyecto
│   └── migrations/          # Archivos de migración SQL
│       └── 20260505000000_ejemplo.sql
└── .env.local               # Variables de entorno (contiene service_role_key)
```

## Frontmatter Requerido para Migraciones

Al inicio del archivo SQL, incluye comentarios descriptivos:

```sql
-- =====================================================
-- NOMBRE DE LA MIGRACIÓN
-- Fecha: YYYY-MM-DD
-- Descripción: Qué hace esta migración
-- =====================================================
```

## Ejemplo: Crear una Nueva Tabla

```sql
-- supabase/migrations/20260505000000_crear_tabla_ejemplo.sql

-- =====================================================
-- Crear tabla de ejemplo
-- Fecha: 2026-05-05
-- =====================================================

CREATE TABLE IF NOT EXISTS ejemplo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ejemplo_name ON ejemplo(name);

-- Habilitar RLS (Row Level Security)
ALTER TABLE ejemplo ENABLE ROW LEVEL SECURITY;

-- Política básica de acceso
CREATE POLICY "Usuarios autenticados pueden ver" ON ejemplo
    FOR SELECT USING (true);
```

## Errores Comunes y Soluciones

### Error: "column 'X' does not exist"

El esquema local está desincronizado con el remoto. Verifica con:

```bash
npx supabase db query --linked "SELECT column_name FROM information_schema.columns WHERE table_name = 'nombre_tabla';"
```

### Error: "relation already exists"

La migración ya fue aplicada. Verifica el historial:

```bash
npx supabase migration list --linked
```

### Error: "syntax error at or near IF"

PostgreSQL no soporta `ALTER TABLE ... RENAME COLUMN ... IF EXISTS` directamente. Usa bloques `DO $$` para verificaciones condicionales:

```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empleados' AND column_name = 'nueva_columna') THEN
        ALTER TABLE empleados ADD COLUMN nueva_columna VARCHAR(100);
    END IF;
END $$;
```

## Recomendaciones de Seguridad

1. **Nunca ejecutes migrations en producción sin antes probar en desarrollo**
2. **Siempre usa `IF NOT EXISTS` o bloques `DO $$` para verificaciones condicionales**
3. **No modifiques migraciones ya aplicadas** - crea una nueva en su lugar
4. **Respeta el orden de las migraciones** - PostgreSQL las ejecuta secuencialmente

## Cuándo Usar Cada Herramienta

| Herramienta | Uso | Ejemplo |
|-------------|-----|---------|
| `db push` | Enviar migrations DDL | Crear tablas, añadir columnas |
| `db query` | Consultar datos o verificar esquema | SELECT, INSERT, UPDATE, DELETE |
| `db reset` | Resetear toda la base de datos | ¡Solo en desarrollo! |

## Scripts de Referencia Disponibles

En el proyecto existen scripts de referencia en:
- `supabase/migrations/` - Migraciones aplicadas anteriormente
- `src/types/` - Tipos TypeScript que mapean las tablas

Siempre verifica que los tipos TypeScript coincidan con el esquema real de la base de datos después de aplicar migraciones.