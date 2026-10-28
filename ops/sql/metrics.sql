-- Weekly funnel metrics. Aggregates only — never select names, emails,
-- addresses, or per-case amounts. Run with the read-only role (ops/SETUP.md).
-- Output is one JSON row; the review tick appends it to ops/METRICS.md.

select json_build_object(
  'as_of', now()::date,
  'users_total', (select count(*) from profiles where not coalesce(is_admin, false)),
  'users_new_7d', (select count(*) from profiles where created_at > now() - interval '7 days' and not coalesce(is_admin, false)),
  'cases_total', (select count(*) from cases),
  'cases_new_7d', (select count(*) from cases where created_at > now() - interval '7 days'),
  'cases_by_status', (select json_object_agg(status, n) from (select status, count(*) n from cases group by status) s),
  'letters_dispatched_total', (select count(*) from case_messages where message_type = 'tribune_letter' and dispatch_channel is not null),
  'landlord_replies_total', (select count(*) from case_messages where message_type = 'landlord_reply'),
  'cases_past_deadline_open', (select count(*) from cases where statutory_deadline < now()::date and status not in ('resolved', 'closed', 'declined')),
  'recovered_cents_total', (select coalesce(sum(deposit_returned_cents), 0) from cases where status = 'resolved'),
  'recovered_cents_30d', (select coalesce(sum(deposit_returned_cents), 0) from cases where status = 'resolved' and updated_at > now() - interval '30 days'),
  'invoices_by_status', (select json_object_agg(status, n) from (select status, count(*) n from invoices group by status) s),
  'fees_paid_cents_total', (select coalesce(sum(amount_cents), 0) from invoices where status = 'paid'),
  'median_days_to_resolution', (select percentile_cont(0.5) within group (order by extract(epoch from (updated_at - created_at)) / 86400) from cases where status = 'resolved')
) as metrics;
