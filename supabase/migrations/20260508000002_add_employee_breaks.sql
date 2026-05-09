-- ================================================================
-- Migration: Employee Break Times (Descansos)
-- Purpose:
--   1. employee_availability: Descanso recurrente por día de semana
--   2. employee_availability_overrides: Descanso único por fecha específica
-- Date: 2026-05-08
-- ================================================================

-- ================================================================
-- PART 1: employee_availability - Descanso recurrente
-- ================================================================

ALTER TABLE employee_availability
ADD COLUMN IF NOT EXISTS break_start TIME,
ADD COLUMN IF NOT EXISTS break_end TIME,
ADD COLUMN IF NOT EXISTS break_reason TEXT DEFAULT 'Hora de almuerzo';

COMMENT ON COLUMN employee_availability.break_start IS 'Inicio del descanso recurrente (ej: 13:00)';
COMMENT ON COLUMN employee_availability.break_end IS 'Fin del descanso recurrente (ej: 14:00)';
COMMENT ON COLUMN employee_availability.break_reason IS 'Motivo del descanso (ej: Hora de almuerzo, Descanso)';

-- ================================================================
-- PART 2: employee_availability_overrides - Descanso fecha específica
-- ================================================================

ALTER TABLE employee_availability_overrides
ADD COLUMN IF NOT EXISTS break_start TIME,
ADD COLUMN IF NOT EXISTS break_end TIME;

COMMENT ON COLUMN employee_availability_overrides.break_start IS 'Inicio del descanso para esta fecha específica';
COMMENT ON COLUMN employee_availability_overrides.break_end IS 'Fin del descanso para esta fecha específica';
