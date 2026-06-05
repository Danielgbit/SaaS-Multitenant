-- ============================================================
-- Sprint 4 — Enhance inventory_divergences with occurrence tracking
-- ============================================================

ALTER TABLE inventory_divergences
  ADD COLUMN IF NOT EXISTS occurrence_count INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ALTER COLUMN detected_at SET DEFAULT NOW();
