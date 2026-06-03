-- =============================================================================
-- FIX: slugify() - lowercase AFTER removing accents
-- =============================================================================
-- La versión anterior aplicaba lower() antes del regex, lo que causaba
-- que el regex [^a-z0-9\s-] eliminara las mayúsculas prematuramente.
-- Resultado: 'Candela Barbería' → 'andela-arberia' en lugar de 'candela-barberia'

CREATE OR REPLACE FUNCTION public.slugify(input TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  IF input IS NULL OR trim(input) = '' THEN
    RETURN 'negocio';
  END IF;

  result := regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(unaccent(trim(input))),
        '[^a-z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ),
    '-{2,}', '-', 'g'
  );

  result := trim(both '-' from result);

  IF result = '' THEN
    result := 'negocio';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
