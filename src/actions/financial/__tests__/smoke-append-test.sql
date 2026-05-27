-- Smoke test: append-only, constraint, reversal
-- Runs in transaction that auto-rolls back

BEGIN;

CREATE TEMP TABLE _smoke_results (test TEXT, status TEXT, detail TEXT);

DO $$
DECLARE
    v_org_id UUID;
    v_event_id UUID;
BEGIN
    INSERT INTO organizations (id, name, slug)
    VALUES (gen_random_uuid(), 'Smoke Test Org', 'smoke-' || gen_random_uuid()::text)
    RETURNING id INTO v_org_id;

    INSERT INTO financial_events (organization_id, event_type, source_table, source_id, entity_type, entity_id, amount, idempotency_key, status, version, metadata, occurred_at)
    VALUES (v_org_id, 'payment_received', 'test', gen_random_uuid(), 'appointment', gen_random_uuid(), 100, 'smoke-append-test', 'settled', 1, '{}', NOW())
    RETURNING id INTO v_event_id;

    INSERT INTO _smoke_results VALUES ('1. Event created', 'PASS', v_event_id::text);

    BEGIN
        DELETE FROM financial_events WHERE id = v_event_id;
        INSERT INTO _smoke_results VALUES ('2. DELETE blocked', 'FAIL', 'Was not blocked');
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO _smoke_results VALUES ('2. DELETE blocked', 'PASS', SQLERRM);
    END;

    BEGIN
        UPDATE financial_events SET status = 'pending' WHERE id = v_event_id;
        INSERT INTO _smoke_results VALUES ('3. UPDATE (non-rev) blocked', 'FAIL', 'Was not blocked');
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO _smoke_results VALUES ('3. UPDATE (non-rev) blocked', 'PASS', SQLERRM);
    END;

    BEGIN
        UPDATE financial_events SET status = 'reversed' WHERE id = v_event_id AND status != 'reversed';
        INSERT INTO _smoke_results VALUES ('4. Reversal allowed', 'PASS', 'Status changed to reversed');
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO _smoke_results VALUES ('4. Reversal allowed', 'FAIL', SQLERRM);
    END;

    BEGIN
        UPDATE financial_events SET status = 'reversed' WHERE id = v_event_id;
        INSERT INTO _smoke_results VALUES ('5. Double reversal blocked', 'FAIL', 'Was not blocked');
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO _smoke_results VALUES ('5. Double reversal blocked', 'PASS', SQLERRM);
    END;

    BEGIN
        INSERT INTO financial_events (organization_id, event_type, source_table, source_id, entity_type, entity_id, amount, idempotency_key, status, version, metadata, occurred_at)
        VALUES (v_org_id, 'payment_received', 'test', gen_random_uuid(), 'appointment', gen_random_uuid(), 200, 'smoke-append-test', 'settled', 1, '{}', NOW());
        INSERT INTO _smoke_results VALUES ('6. UNIQUE idempotency_key', 'FAIL', 'Was not blocked');
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO _smoke_results VALUES ('6. UNIQUE idempotency_key', 'PASS', SQLERRM);
    END;
END;
$$;

SELECT * FROM _smoke_results;

ROLLBACK;
