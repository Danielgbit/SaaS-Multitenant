ALTER TABLE employees ADD COLUMN email text NULL;

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees (email);
