-- =============================================================================
-- ENABLE EXTENSION: unaccent
-- =============================================================================
-- FINDING-001: Requerida por public.slugify() definida en
-- 20260603120000_add_slug_functions.sql.
-- Esta migración debe ejecutarse ANTES de 20260603120000.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS unaccent;
