-- =====================================================
-- CLIENT CONFIRMATION SYSTEM
-- Fecha: 2026-03-25
-- Descripción: Sistema de método de confirmación para clientes
-- para integrarse con N8N y WhatsApp
-- =====================================================

-- 1. Crear enum para método de confirmación
CREATE TYPE confirmation_method AS ENUM (
  'whatsapp',    -- Confirmación por WhatsApp automático
  'phone_call',  -- Confirmado por llamada del staff
  'in_person',   -- Confirmado presencialmente
  'none'         -- No se requiere confirmación
);

-- 2. Crear enum para contacto preferido
CREATE TYPE preferred_contact AS ENUM (
  'whatsapp',    -- Prefiere WhatsApp
  'phone',       -- Prefiere llamada telefónica
  'email'        -- Prefiere email
);

-- 3. Agregar campos a tabla clients
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS confirmation_method confirmation_method DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS confirmations_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_contact preferred_contact DEFAULT 'whatsapp';

-- 4. Actualizar clientes existentes según телефон y email
-- Los que tienen teléfono -> confirmation_method = 'whatsapp', confirmations_enabled = true
-- Los que NO tienen teléfono -> confirmation_method = 'in_person', confirmations_enabled = false
UPDATE clients 
SET 
  confirmation_method = CASE 
    WHEN phone IS NOT NULL AND phone != '' THEN 'whatsapp'::confirmation_method
    ELSE 'in_person'::confirmation_method
  END,
  confirmations_enabled = CASE 
    WHEN phone IS NOT NULL AND phone != '' THEN true
    ELSE false
  END
WHERE confirmation_method IS NULL;

-- 5. Agregar índice para consultas por método de confirmación
CREATE INDEX IF NOT EXISTS idx_clients_confirmation_method 
  ON clients(organization_id, confirmation_method);

CREATE INDEX IF NOT EXISTS idx_clients_confirmations_enabled 
  ON clients(organization_id, confirmations_enabled) 
  WHERE confirmations_enabled = true;

-- 6. Agregar comentarios a las columnas para documentación
COMMENT ON COLUMN clients.confirmation_method IS 'Método de confirmación: whatsapp, phone_call, in_person, none';
COMMENT ON COLUMN clients.confirmations_enabled IS 'Si están habilitadas las confirmaciones automáticas para este cliente';
COMMENT ON COLUMN clients.preferred_contact IS 'Canal preferido de contacto: whatsapp, phone, email';

-- 7. Actualizar RLS si es necesario (generalmente ya existe)
-- Las políticas RLS existentes deberían funcionar porque solo estamos agregando columnas

-- 8. Verificar que no hay errores
DO $$
BEGIN
  -- Verificar que las columnas existen
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'confirmation_method'
  );
  
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'confirmations_enabled'
  );
  
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'preferred_contact'
  );
  
  RAISE NOTICE 'Migration completed successfully';
END $$;
