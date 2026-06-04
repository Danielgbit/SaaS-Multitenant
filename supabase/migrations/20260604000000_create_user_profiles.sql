-- =====================================================
-- Create user_profiles table
-- Fecha: 2026-06-04
-- Descripción: Tabla pública de perfiles de usuario.
--   Reemplaza auth.admin.listUsers() para operaciones de plataforma.
--   Incluye trigger de sincronización para cambios de email.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Trigger: sync email when it changes in auth.users
CREATE OR REPLACE FUNCTION public.sync_user_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles
  SET email = COALESCE(NEW.email, '')
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_profile_email();

-- Backfill existing users (defensivo contra NULL)
INSERT INTO public.user_profiles (id, email)
SELECT id, COALESCE(email, '') FROM auth.users
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
