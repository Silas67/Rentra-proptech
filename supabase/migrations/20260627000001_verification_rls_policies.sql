-- RLS for the verification module tables.
--
-- Decision: the browser (anon/authenticated client) only ever SELECTs.
-- Every insert/update across all 6 tables happens in Supabase Edge
-- Functions using the service_role key, which bypasses RLS and does its
-- own authorization in code. Reasons:
--   1. There's no per-request "assigned surveyor/lawyer" column, so RLS
--      alone can't scope a surveyor to "their" job — that needs
--      application logic anyway.
--   2. Several of these writes (extracted_data, agis_results.verdict,
--      verification_reports) are produced by the Claude API, which must
--      already be called server-side per the project's build rules.
--   3. One consistent write path (edge functions) is easier to reason
--      about than per-table client write policies with partial-field
--      restrictions.
--
-- Tenants are intentionally not granted access here — the public-facing
-- verification signal is properties.verificationTier, not these tables,
-- which can contain surveyor notes and legal documents.

create or replace function can_access_verification_request(req_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from verification_requests vr
    left join properties p on p.id = vr.property_id
    where vr.id = req_id
      and (
        vr.created_by = auth.uid()
        or p.landlord_id = auth.uid()
        or p.agent_id = auth.uid()
        or (select role from profiles where id = auth.uid()) in ('surveyor', 'lawyer')
      )
  );
$$;

create policy "select own property or staff" on verification_requests
for select using (
  created_by = auth.uid()
  or auth.uid() in (select landlord_id from properties where properties.id = verification_requests.property_id)
  or auth.uid() in (select agent_id from properties where properties.id = verification_requests.property_id)
  or (select role from profiles where id = auth.uid()) in ('surveyor', 'lawyer')
);

create policy "select via parent request" on uploaded_documents
for select using (can_access_verification_request(request_id));

create policy "select via parent request" on surveyor_reports
for select using (can_access_verification_request(request_id));

create policy "select via parent request" on agis_submissions
for select using (can_access_verification_request(request_id));

create policy "select via parent request" on agis_results
for select using (can_access_verification_request(request_id));

create policy "select via parent request" on verification_reports
for select using (can_access_verification_request(request_id));
