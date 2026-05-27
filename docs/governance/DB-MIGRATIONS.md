> STATUS: CURRENT IMPLEMENTATION
> Source of truth: supabase/migrations/
> Last updated: 2026-05-27

# DB Migrations — Conventions

> Append-only log. Never rename or squash applied migrations.

## Naming

```
YYYYMMDDHHMMSS_description.sql
```

- Timestamp UTC obligatorio (14 dígitos)
- snake_case para la descripción
- Sufijo opcional: `_fix_`, `_seed_`, `_backfill_`
- Preferir `supabase migration new` para generar archivos

## Rules

1. **Append-only** — nunca renombrar migrations mergeadas o aplicadas en algún ambiente
2. **Nunca hacer squash** del historial (solo en resets coordinados)
3. **Timestamp real** — si necesitas insertar entre dos existentes, usar timestamp real, no `000000`
4. **Idempotencia** donde sea razonable (`IF NOT EXISTS`, `DROP IF EXISTS`, guards defensivos)
5. **Nunca editar** el contenido de migrations históricas ya mergeadas
6. **Backfills pesados** deben documentar impacto operacional (locks, duración, batches, ventana de mantenimiento)
7. **Auto-generated docs** deben mantenerse sincronizados (`pnpm docs:gen`)

## Qué NO hacer

- Editar SQL de migrations ya aplicadas en cualquier ambiente
- Renombrar archivos de migrations mergeadas
- Squash migrations activas sin reset coordinado de todos los ambientes
- Usar sufijos `000000` para "mismo día" — preferir timestamp real
