-- ============================================================
-- Sprint 4 — Inventory SKU unique constraint
-- ============================================================

-- Add unique constraint on (organization_id, sku)
-- where sku is not null to allow multiple nulls per organization
ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_items_org_sku_unique
  UNIQUE (organization_id, sku)
  WHERE sku IS NOT NULL;