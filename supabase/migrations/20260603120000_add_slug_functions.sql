-- =============================================================================
-- SLUG FUNCTIONS
-- =============================================================================
-- Funciones para generar slugs limpios desde nombres de negocio.
-- Fuente de verdad: estas funciones deben coincidir con src/lib/slugify.ts

-- Función para convertir texto a slug
CREATE OR REPLACE FUNCTION public.slugify(input TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Manejar input vacío o NULL
  IF input IS NULL OR trim(input) = '' THEN
    RETURN 'negocio';
  END IF;

  -- Convertir a minúsculas, remover acentos, reemplazar espacios por guiones
  result := lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          unaccent(trim(input)),
          '[^a-z0-9\s-]', '', 'g'          -- remover caracteres especiales
        ),
        '\s+', '-', 'g'                      -- espacios → guiones
      ),
      '-{2,}', '-', 'g'                      -- guiones múltiples → uno solo
    )
  );

  -- Remover guiones al inicio y final
  result := trim(both '-' from result);

  -- Si el resultado queda vacío, usar valor por defecto
  IF result = '' THEN
    result := 'negocio';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para generar slug único (resuelve colisiones)
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  candidate TEXT;
  counter INT := 1;
BEGIN
  candidate := base_slug;

  -- El UNIQUE INDEX garantiza que no haya duplicados
  -- Esta función resuelve colisiones de forma determinista
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = candidate) LOOP
    counter := counter + 1;
    candidate := base_slug || '-' || counter;
  END LOOP;

  RETURN candidate;
END;
$$ LANGUAGE plpgsql;
