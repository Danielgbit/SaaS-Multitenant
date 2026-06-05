-- ============================================================
-- Sprint 2 — Immutable inventory audit ledger
-- Append-only. Never UPDATE or DELETE rows.
-- ============================================================

CREATE TYPE inventory_movement_type AS ENUM (
  'purchase', 'sale', 'consumption', 'adjustment', 'void', 'return'
);

CREATE TYPE inventory_reference_type AS ENUM (
  'transaction', 'purchase', 'adjustment', 'consumption'
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,

  movement_type inventory_movement_type NOT NULL,

  quantity_change INT NOT NULL,
  quantity_before INT NOT NULL,
  quantity_after INT NOT NULL,
  CONSTRAINT inventory_movements_quantity_consistency
    CHECK (quantity_after = quantity_before + quantity_change),

  source_operation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  reference_type inventory_reference_type,
  reference_id UUID,

  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deterministic "last movement" lookup
CREATE INDEX idx_inv_mov_item_latest
  ON inventory_movements(inventory_item_id, created_at DESC, id DESC);

CREATE INDEX idx_inv_mov_org
  ON inventory_movements(organization_id, created_at DESC);

CREATE INDEX idx_inv_mov_source
  ON inventory_movements(source_operation_id);

-- Note: partial index for recent movements requires IMMUTABLE predicate.
-- If needed later, create with a timestamp constant at deploy time:
-- CREATE INDEX ... WHERE created_at > '2026-01-01'::timestamptz;
