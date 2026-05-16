# Observability

> **Part of the Prügressy Architecture Handbook**  
> **Previous:** [Payroll Architecture](13-payroll-architecture.md)  
> **Next:** [Event Replay Operations](15-event-replay-operations.md)  
> **Index:** [README.md](README.md)

---

## Audit Logging

Every domain event is recorded in the `domain_events` table with full metadata:

```
domain_events
├── event_id          (unique identifier for traceability)
├── event_name        (machine-readable event type)
├── event_version     (for schema evolution)
├── correlation_id    (entire business flow trace)
├── causation_id      (parent event link)
├── organization_id   (tenant isolation)
├── aggregate_id      (entity ID, e.g., appointment_id)
├── aggregate_type    (entity type)
├── actor_id          (WHO did it)
├── actor_role        (WHAT role did they have)
├── actor_source      (WHERE from: web_app, employee_app, cron, etc.)
├── occurred_at       (WHEN it happened in business time)
├── recorded_at       (WHEN the system recorded it)
├── data              (WHAT changed - full payload)
├── metadata          (HOW - request_id, ip, user_agent, retry info)
├── status            (pending | processing | completed | failed)
├── retry_count       (how many times it was retried)
└── last_error        (failure information if failed)
```

## Trace an Appointment Lifecycle

```sql
-- Get full lifecycle for a specific appointment
SELECT event_name, actor_role, actor_source, occurred_at, data->>'status' as new_status
FROM domain_events
WHERE aggregate_id = 'appointment-uuid-here'
  AND aggregate_type = 'appointment'
ORDER BY occurred_at ASC;

-- Response:
-- appointment.created        | client    | public_booking | pending
-- notification.requested     | system    | orchestrator   | null
-- service.completed          | employee  | employee_app   | completed
-- notification.requested     | system    | orchestrator   | null
-- payment.confirmed          | staff     | web_app        | confirmed
-- payroll.generation_requested | system | orchestrator    | null
-- payroll.generated          | system    | payroll_listener | null
-- appointment.execution_completed | system | orchestrator  | null
```

## Debug Failures

```sql
-- Find all failed events in the last 24 hours
SELECT event_name, aggregate_id, last_error, retry_count, occurred_at
FROM domain_events
WHERE status = 'failed'
  AND recorded_at > NOW() - INTERVAL '24 hours'
ORDER BY recorded_at DESC;

-- Find an appointment's failed retries
SELECT event_name, metadata->>'retry_attempt' as attempt, last_error, recorded_at
FROM domain_events
WHERE correlation_id = (
  SELECT correlation_id FROM domain_events
  WHERE event_name = 'appointment.created'
    AND aggregate_id = 'appointment-uuid-here'
  LIMIT 1
)
AND status = 'failed'
ORDER BY recorded_at ASC;
```

## Detect Stuck Workflows

```sql
-- Appointments that never reached terminal state within time limit
SELECT a.id, a.status, a.confirmation_status, a.created_at,
       CASE
         WHEN a.confirmation_status = 'scheduled'
           AND a.end_time < NOW() - INTERVAL '60 minutes'
           THEN 'STUCK: waiting for employee mark'
         WHEN a.confirmation_status = 'needs_review'
           AND a.end_time < NOW() - INTERVAL '120 minutes'
           THEN 'STUCK: waiting for confirmation or auto-complete'
         WHEN a.status = 'completed'
           AND a.confirmation_status = 'confirmed'
           AND NOT EXISTS (
             SELECT 1 FROM domain_events de
             WHERE de.aggregate_id = a.id
               AND de.event_name = 'payroll.generated'
           )
           THEN 'STUCK: payroll not generated'
         ELSE 'normal'
       END AS workflow_status
FROM appointments a
WHERE a.status NOT IN ('cancelled')
  AND a.created_at > NOW() - INTERVAL '7 days'
ORDER BY a.created_at DESC;
```

## Monitoring Dashboard Queries

```sql
-- Events per minute (real-time throughput)
SELECT date_trunc('minute', recorded_at) as minute,
       event_name,
       COUNT(*) as count
FROM domain_events
WHERE recorded_at > NOW() - INTERVAL '1 hour'
GROUP BY minute, event_name
ORDER BY minute DESC;

-- Failed events per hour
SELECT date_trunc('hour', recorded_at) as hour,
       COUNT(*) as failures
FROM domain_events
WHERE status = 'failed'
  AND recorded_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Dead-letter queue size
SELECT COUNT(*) as dead_letter_count
FROM payroll_dead_letter
WHERE status = 'pending';

-- Listener lag (time between event recorded and processed)
SELECT event_name,
       AVG(EXTRACT(EPOCH FROM (processed_at - recorded_at))) as avg_lag_seconds,
       MAX(EXTRACT(EPOCH FROM (processed_at - recorded_at))) as max_lag_seconds
FROM domain_events
WHERE status = 'completed'
  AND processed_at IS NOT NULL
  AND recorded_at > NOW() - INTERVAL '1 hour'
GROUP BY event_name
ORDER BY avg_lag_seconds DESC;
```

## Dead-Letter Queue Dashboard

A realtime dashboard provides:

| Metric | Source | Refresh |
|---|---|---|
| Total dead-lettered events | `payroll_dead_letter` | 30s |
| Events per appointment | `domain_events` | Real-time |
| Failed transitions | `state_transition.rejected` events | Real-time |
| Average transition latency | `domain_events.processed_at - recorded_at` | 1min |
| Stuck appointments | Query from stuck workflows | 5min |

---

## Navigation

- **Previous:** [Payroll Architecture](13-payroll-architecture.md)
- **Next:** [Event Replay Operations](15-event-replay-operations.md)
- **Index:** [README.md](README.md)
