-- ============================================================
-- Sprint 1 — Inventory defensive constraints
-- ============================================================

ALTER TABLE inventory_items
  ALTER COLUMN quantity SET DEFAULT 0,
  ALTER COLUMN quantity SET NOT NULL,
  ADD CONSTRAINT inventory_items_quantity_non_negative
    CHECK (quantity >= 0);
