-- ================================================================
-- Migration: Employee Availability Overrides + Spa Hours
-- Purpose: 
--   1. employee_availability_overrides: Excepciones por fecha específica
--   2. spa_opening_time/closing_time: Horario general del spa
-- Date: 2026-04-24
-- ================================================================

-- ================================================================
-- PART 1: employee_availability_overrides
-- Tabla para manejar excepciones de disponibilidad por fecha
-- ================================================================

CREATE TABLE IF NOT EXISTS employee_availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_day_off BOOLEAN DEFAULT false,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_employee_date UNIQUE (employee_id, date),
  CONSTRAINT check_override_times CHECK (
    (is_day_off = true) OR 
    (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
  )
);

-- Índice para búsqueda eficiente por empleado y fecha
CREATE INDEX IF NOT EXISTS idx_overrides_employee_date 
  ON employee_availability_overrides(employee_id, date);

-- Índice parcial para días libres (facilita encontrar días off rápidamente)
CREATE INDEX IF NOT EXISTS idx_overrides_day_off 
  ON employee_availability_overrides(date) 
  WHERE is_day_off = true;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_availability_overrides_updated_at
  BEFORE UPDATE ON employee_availability_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- PART 2: booking_settings - Horario del Spa
-- Añadir columnas spa_opening_time y spa_closing_time
-- ================================================================

ALTER TABLE booking_settings
ADD COLUMN IF NOT EXISTS spa_opening_time TIME DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS spa_closing_time TIME DEFAULT '20:00';

-- Comentarios para documentación
COMMENT ON COLUMN booking_settings.spa_opening_time IS 'Hora de apertura del spa (ej: 09:00)';
COMMENT ON COLUMN booking_settings.spa_closing_time IS 'Hora de cierre del spa (ej: 20:00)';
COMMENT ON TABLE employee_availability_overrides IS 'Overrides de disponibilidad para empleados - permite excepciones por fecha específica';

-- ================================================================
-- RLS Policies (Row Level Security)
-- ================================================================

-- Habilitar RLS
ALTER TABLE employee_availability_overrides ENABLE ROW LEVEL SECURITY;

-- Política: Empleados pueden ver sus propios overrides
CREATE POLICY "employees_can_view_own_overrides" ON employee_availability_overrides
  FOR SELECT
  USING (employee_id IN (
    SELECT e.id FROM employees e WHERE e.user_id = auth.uid()
  ));

-- Política: Admin/Owner pueden ver todos los overrides de su organización
CREATE POLICY "admins_can_view_all_overrides" ON employee_availability_overrides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'assistant')
    )
  );

-- Política: Admin/Owner pueden crear overrides
CREATE POLICY "admins_can_create_overrides" ON employee_availability_overrides
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'assistant')
    )
  );

-- Política: Admin/Owner pueden actualizar overrides
CREATE POLICY "admins_can_update_overrides" ON employee_availability_overrides
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'assistant')
    )
  );

-- Política: Admin/Owner pueden eliminar overrides
CREATE POLICY "admins_can_delete_overrides" ON employee_availability_overrides
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'assistant')
    )
  );
