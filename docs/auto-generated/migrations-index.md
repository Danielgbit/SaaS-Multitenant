# Migrations Index

> AUTO-GENERATED — DO NOT EDIT MANUALLY
> Regenerar con: `pnpm docs:gen`
> Generated: 2026-06-04

Total: 73 migrations

| File | Description |
|------|-------------|
| `20260306181052_initial_schema.sql` | Initial Schema |
| `20260306182423_rls_policies.sql` | Rls Policies |
| `20260307143800_fix_rls_infinite_recursion.sql` | Fix Rls Infinite Recursion |
| `20260314180000_billing_subscriptions.sql` | Billing Subscriptions |
| `20260315100000_whatsapp_integration.sql` | Whatsapp Integration |
| `20260316100000_email_integration.sql` | Email Integration |
| `20260316120000_add_notes_to_appointments.sql` | Add Notes To Appointments |
| `20260317000000_daily_analytics.sql` | Daily Analytics |
| `20260318000000_inventory.sql` | Inventory |
| `20260318170000_fix_invited_employee_org_trigger.sql` | Fix Invited Employee Org Trigger |
| `20260319000000_confirmations.sql` | Confirmations |
| `20260320000000_employee_invitations.sql` | Employee Invitations |
| `20260321164211_rebrand_plans_cop.sql` | Rebrand Plans Cop |
| `20260323000000_payroll_system.sql` | Payroll System |
| `20260324000000_client_accounts_receivable.sql` | Client Accounts Receivable |
| `20260325000000_client_confirmation_system.sql` | Client Confirmation System |
| `20260326000000_employee_permanent_delete_support.sql` | Employee Permanent Delete Support |
| `20260420000000_confirmation_audit_and_notifications.sql` | Confirmation Audit And Notifications |
| `20260420000001_fix_confirmation_logs_metadata.sql` | Fix Confirmation Logs Metadata |
| `20260421000000_services_price_to_integer.sql` | Services Price To Integer |
| `20260424000000_employee_availability_overrides_and_spa_hours.sql` | Employee Availability Overrides And Spa Hours |
| `20260426000000_spa_availability_overrides.sql` | Spa Availability Overrides |
| `20260427000000_data_retention_settings.sql` | Data Retention Settings |
| `20260503000000_payroll_v2_new_model.sql` | Payroll V2 New Model |
| `20260505000000_promo_codes.sql` | Promo Codes |
| `20260506000000_add_payment_columns_to_payroll_receipts.sql` | Add Payment Columns To Payroll Receipts |
| `20260507000000_payroll_auto_add_to_period.sql` | Payroll Auto Add To Period |
| `20260508000000_normalize_payment_type.sql` | Normalize Payment Type |
| `20260508000002_add_employee_breaks.sql` | Add Employee Breaks |
| `20260510000000_add_employment_type_to_employees.sql` | Add Employment Type To Employees |
| `20260513000000_notification_system_v2.sql` | Notification System V2 |
| `20260513000001_seed_notification_templates.sql` | Seed Notification Templates |
| `20260514000000_notification_v2_1_hardening.sql` | Notification V2 1 Hardening |
| `20260516000000_create_shadow_validation_logs.sql` | Create Shadow Validation Logs |
| `20260517000000_add_source_path_to_shadow_logs.sql` | Add Source Path To Shadow Logs |
| `20260517000001_add_classification_to_shadow_logs.sql` | Add Classification To Shadow Logs |
| `20260520000000_notification_queue_worker.sql` | Notification Queue Worker |
| `20260521010000_remove_notification_event_type_check.sql` | Remove Notification Event Type Check |
| `20260522000000_notification_dashboard_indexes.sql` | Notification Dashboard Indexes |
| `20260523000000_create_shadow_notification_logs.sql` | Create Shadow Notification Logs |
| `20260524000000_add_use_notification_v2.sql` | Add Use Notification V2 |
| `20260525000000_notification_observability.sql` | Notification Observability |
| `20260526000000_add_replay_columns.sql` | Add Replay Columns |
| `20260526000001_sprint2_message_details.sql` | Sprint2 Message Details |
| `20260527000000_fix_payroll_security.sql` | Fix Payroll Security |
| `20260527000001_fix_invalid_trigger_and_dead_code.sql` | Fix Invalid Trigger And Dead Code |
| `20260527000002_align_schema_names.sql` | Align Schema Names |
| `20260527000003_fix_employee_availability_cross_org_rls.sql` | Fix Employee Availability Cross Org Rls |
| `20260527000004_notification_worker_heartbeats.sql` | Notification Worker Heartbeats |
| `20260527000005_notification_alert_events.sql` | Notification Alert Events |
| `20260527000006_fix_evaluate_worker_alerts_ambiguity.sql` | Fix Evaluate Worker Alerts Ambiguity |
| `20260527000007_notification_alert_delivery.sql` | Notification Alert Delivery |
| `20260527000008_seed_worker_heartbeats.sql` | Seed Worker Heartbeats |
| `20260528000001_financial_events.sql` | Financial Events |
| `20260528000002_seed_financial_events.sql` | Seed Financial Events |
| `20260528000003_financial_events_triggers.sql` | Financial Events Triggers |
| `20260529000001_appointment_payment_status.sql` | Appointment Payment Status |
| `20260530000001_link_transactions_to_appointments.sql` | Link Transactions To Appointments |
| `20260531000001_protect_financial_events.sql` | Protect Financial Events |
| `20260531000002_commission_accrued_trigger.sql` | Commission Accrued Trigger |
| `20260531000003_backfill_appointment_payment_status.sql` | Backfill Appointment Payment Status |
| `20260531000004_create_cash_operations.sql` | Create Cash Operations |
| `20260601000001_release2_inventory_entries.sql` | Release2 Inventory Entries |
| `20260603000000_fix_payment_caja_constraints.sql` | Fix Payment Caja Constraints |
| `20260603000001_trigger_adjustment_support.sql` | Trigger Adjustment Support |
| `20260603000002_void_transaction_support.sql` | Void Transaction Support |
| `20260603000003_edit_audit_columns.sql` | Edit Audit Columns |
| `20260603120000_add_slug_functions.sql` | Add Slug Functions |
| `20260603120001_update_trigger_slug.sql` | Update Trigger Slug |
| `20260603130000_fix_slugify_lowercase.sql` | Fix Slugify Lowercase |
| `20260603140000_add_email_to_employees.sql` | Add Email To Employees |
| `20260603150000_create_platform_admins_and_org_status.sql` | Create Platform Admins And Org Status |
| `20260604000000_create_user_profiles.sql` | Create User Profiles |