-- =====================================================
-- Agregar tipo de empleo y porcentaje para medio tiempo
-- =====================================================

-- Agregar employment_type (tipo de jornada)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20)
    DEFAULT 'full_time'
    CHECK (employment_type IN ('full_time', 'part_time'));

-- Agregar part_time_percentage (porcentaje del salario mínimo para medio tiempo)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS part_time_percentage NUMERIC(5,2)
    DEFAULT 100.00
    CHECK (part_time_percentage > 0 AND part_time_percentage <= 100);

-- Comentario para documentar
COMMENT ON COLUMN employees.employment_type IS 'Tipo de jornada: full_time (completa) o part_time (parcial)';
COMMENT ON COLUMN employees.part_time_percentage IS 'Porcentaje del SMMLV para empleados part_time (ej: 50 = medio salario mínimo)';

-- Hacer las columnas nullable si ya existían
ALTER TABLE employees ALTER COLUMN employment_type DROP NOT NULL;
ALTER TABLE employees ALTER COLUMN part_time_percentage DROP NOT NULL;