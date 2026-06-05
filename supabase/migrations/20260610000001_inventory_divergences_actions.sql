-- ============================================================
-- Sprint 6 — Assisted reconciliation columns
-- ============================================================

ALTER TABLE inventory_divergences
  ADD COLUMN IF NOT EXISTS suggested_action TEXT
    CHECK (suggested_action IN ('align_to_ledger', 'investigate')),

  ADD COLUMN IF NOT EXISTS action_taken TEXT NOT NULL DEFAULT 'none'
    CHECK (action_taken IN ('none', 'aligned', 'investigated', 'dismissed')),

  ADD COLUMN IF NOT EXISTS action_taken_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS action_taken_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS dismiss_reason TEXT;
