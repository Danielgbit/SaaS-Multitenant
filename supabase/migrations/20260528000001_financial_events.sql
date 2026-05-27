-- =====================================================
-- FINANCIAL EVENTS — Canonical Financial Layer
-- Fecha: 2026-05-28
-- Descripción:
--   Tabla unificada de eventos financieros.
--   Append-only: nunca UPDATE/DELETE, solo nuevos eventos
--   o status = 'reversed' para correcciones.
--
--   La verdad canónica vive aquí.
--   payment_status, balances, dashboards son derivados.
-- =====================================================

CREATE TABLE IF NOT EXISTS financial_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Taxonomía
    event_type VARCHAR NOT NULL,
    -- Operational: appointment_confirmed, appointment_completed, appointment_cancelled
    -- Financial:   payment_received, refund_processed, commission_settled, adjustment_applied

    -- Trazabilidad técnica (tabla + ID de origen)
    source_table VARCHAR NOT NULL,
    source_id UUID NOT NULL,

    -- Trazabilidad de negocio (independiente de tabla origen)
    entity_type VARCHAR NOT NULL, -- appointment | client | payroll | invoice
    entity_id UUID NOT NULL,

    -- Quién originó el evento
    occurred_by_type VARCHAR DEFAULT 'system', -- user | worker | system
    occurred_by_id UUID,

    -- Monetario (signo: payments=+, refunds=-, commissions=-, adjustments=±)
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR DEFAULT 'COP',

    -- Idempotencia (protege contra retries, doble trigger, reprocessing)
    idempotency_key TEXT UNIQUE,

    -- Estado (append-only)
    status VARCHAR NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'settled', 'reversed')),

    version INTEGER NOT NULL DEFAULT 1,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE financial_events IS
    'Canonical financial event log. Append-only. Source of truth for all financial state.';
COMMENT ON COLUMN financial_events.event_type IS
    'Operational: appointment_confirmed/completed/cancelled. Financial: payment_received/refund_processed/commission_settled/adjustment_applied';
COMMENT ON COLUMN financial_events.entity_type IS
    'Business entity type (appointment, client, payroll, invoice) for cross-domain queries';
COMMENT ON COLUMN financial_events.amount IS
    'Sign convention: payments=positive, refunds=negative, commissions=negative, adjustments=bipolar';
COMMENT ON COLUMN financial_events.status IS
    'pending=recently created, settled=finalized, reversed=corrected. Never deleted.';

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_financial_events_org_occurred
    ON financial_events(organization_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_events_entity
    ON financial_events(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_financial_events_type
    ON financial_events(event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_events_status
    ON financial_events(status);

CREATE INDEX IF NOT EXISTS idx_financial_events_metadata
    ON financial_events USING GIN(metadata);

COMMENT ON INDEX idx_financial_events_org_occurred IS
    'Principal query pattern: org timelines';
COMMENT ON INDEX idx_financial_events_entity IS
    'Cross-domain lookups: all events for an appointment/client';
COMMENT ON INDEX idx_financial_events_type IS
    'Analytics: revenue trends, commission totals, refund rates';

-- RLS: solo lectura para miembros de la organización
ALTER TABLE financial_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_events_select ON financial_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = financial_events.organization_id
            AND user_id = auth.uid()
        )
    );

-- Service role puede insertar (workers, triggers)
CREATE POLICY financial_events_insert ON financial_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = financial_events.organization_id
            AND user_id = auth.uid()
        )
    );

GRANT SELECT, INSERT ON financial_events TO authenticated;
GRANT SELECT, INSERT ON financial_events TO service_role;
