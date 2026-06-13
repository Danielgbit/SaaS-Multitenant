-- =============================================================================
-- SET SEARCH_PATH ON SECURITY DEFINER FUNCTIONS (FINDING-003)
-- =============================================================================
-- FINDING-003: handle_new_user() se ejecuta con SECURITY DEFINER pero sin
--   SET search_path. Cuando Supabase Auth crea un auth.users, la sesión del
--   trigger opera con search_path = auth (no incluye public). Esto rompe
--   DOS rutas en la función:
--
--   Bug 1 (línea 16): SELECT 1 FROM employees WHERE user_id = NEW.id
--     → 42P01 relation "employees" does not exist
--   Bug 2 (líneas 26, 38): CALL slugify(...), CALL generate_unique_slug(...)
--     → 42883 function slugify(unknown) / generate_unique_slug(unknown) does not exist
--     → 42883 function unaccent(text) does not exist (dentro de slugify)
--
--   Ambos bugs revierten la transacción de signup y la invitación de
--   empleados, retornando "Database error creating new user".
--
-- Esta migración ancla el search_path de las 3 funciones involucradas en
-- la cadena de fallo, alineándose con la best practice de PostgreSQL para
-- SECURITY DEFINER y con el patrón ya aplicado en 7 migraciones previas
-- del proyecto (inventory RPCs, has_org_role helper).
--
-- Defensa en profundidad: slugify() y generate_unique_slug() son funciones
-- utility del schema public. Aunque FINDING-003 se origina en
-- handle_new_user(), blindar también a las utility functions previene
-- recurrencia del bug si un trigger SECURITY DEFINER futuro las invoca
-- desde una sesión con search_path patológico.
--
-- Idempotente: usa CREATE OR REPLACE FUNCTION.
-- =============================================================================

-- FINDING-003: SET search_path
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
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp;

-- FINDING-003: SET search_path
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
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- FINDING-003: SET search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    is_invited_employee BOOLEAN;
    base_slug TEXT;
BEGIN
    -- Check if this user is already linked to an employee (i.e., invited employee)
    SELECT EXISTS(
        SELECT 1 FROM employees WHERE user_id = NEW.id
    ) INTO is_invited_employee;

    -- If user is an invited employee, skip organization creation
    IF is_invited_employee THEN
        RAISE NOTICE 'User % is an invited employee, skipping org creation', NEW.id;
        RETURN NEW;
    END IF;

    -- Generar slug desde business_name (no usar slug del cliente)
    base_slug := slugify(
        COALESCE(
            NEW.raw_user_meta_data->>'business_name',
            NEW.raw_user_meta_data->>'full_name',
            'negocio'
        )
    );

    -- 1. Create Organization with unique slug
    INSERT INTO public.organizations (name, slug)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
        generate_unique_slug(base_slug)
    ) RETURNING id INTO new_org_id;

    -- 2. Add Owner Member
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');

    -- 3. Add default Booking Settings
    INSERT INTO public.booking_settings (
        organization_id, slot_interval, buffer_minutes, max_days_ahead, min_notice_hours, timezone, online_booking_enabled
    ) VALUES (
        new_org_id, 30, 0, 60, 24, 'UTC', true
    );

    -- 4. Add disabled WhatsApp Integration
    INSERT INTO public.integrations (organization_id, type, status)
    VALUES (new_org_id, 'whatsapp', 'disabled');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
