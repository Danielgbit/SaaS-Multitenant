DROP TRIGGER IF EXISTS trg_commission_accrued_from_confirmation_log ON confirmation_logs;
DROP FUNCTION IF EXISTS fn_commission_accrued_from_confirmation_log();

UPDATE financial_events
SET status = 'reversed'
WHERE event_type = 'commission_accrued'
  AND source_table = 'confirmation_logs'
  AND status = 'settled'
  AND id IN (
    SELECT id FROM (
      SELECT id, entity_id, metadata->>'service_id' AS service_id,
        ROW_NUMBER() OVER (
          PARTITION BY entity_id, metadata->>'service_id'
          ORDER BY occurred_at ASC
        ) AS rn
      FROM financial_events
      WHERE event_type = 'commission_accrued'
        AND source_table = 'confirmation_logs'
        AND status = 'settled'
    ) ranked
    WHERE rn > 1
  );

UPDATE appointments
SET confirmation_status = 'completed'
WHERE status IN ('cancelled', 'no_show')
  AND confirmation_status IN ('scheduled', 'pending_confirmation', 'needs_review');
