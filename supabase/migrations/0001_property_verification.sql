-- Property/land pre-AGIS and post-AGIS verification workflow
-- Run this in the Supabase SQL editor (or via the CLI) against your project.

-- ─── Storage bucket for uploaded verification documents ───────────────────
insert into storage.buckets (id, name, public)
values ('verification-documents', 'verification-documents', true)
on conflict (id) do nothing;

-- ─── Verification requests (one per property going through the pipeline) ──
create table if not exists property_verifications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  requested_by uuid not null references profiles(id),
  assigned_surveyor_id uuid references profiles(id),
  assigned_lawyer_id uuid references profiles(id),
  status text not null default 'documents_pending'
    check (status in (
      'documents_pending',
      'under_analysis',
      'awaiting_inspection',
      'pre_agis_ready',
      'agis_submitted',
      'agis_returned',
      'completed'
    )),
  pre_agis_report jsonb,
  final_report jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_property_verifications_property on property_verifications(property_id);
create index if not exists idx_property_verifications_surveyor on property_verifications(assigned_surveyor_id);
create index if not exists idx_property_verifications_lawyer on property_verifications(assigned_lawyer_id);

-- ─── Uploaded documents + manually keyed-in extracted fields ───────────────
create table if not exists property_verification_documents (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references property_verifications(id) on delete cascade,
  doc_type text not null
    check (doc_type in (
      'title_deed',
      'survey_plan',
      'deed_of_assignment',
      'governors_consent',
      'tax_clearance',
      'certificate_of_occupancy',
      'other'
    )),
  file_url text not null,
  file_name text,
  uploaded_by uuid not null references profiles(id),
  extracted_fields jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_pvd_verification on property_verification_documents(verification_id);

-- ─── Surveyor's offline site inspection, entered after the visit ───────────
create table if not exists property_site_inspections (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references property_verifications(id) on delete cascade,
  surveyor_id uuid not null references profiles(id),
  inspected_at date not null,
  gps_lat numeric,
  gps_lng numeric,
  boundary_matches_docs boolean,
  structure_matches_docs boolean,
  encumbrances_observed text,
  photos text[] not null default '{}',
  findings text,
  recommendation text check (recommendation in ('proceed', 'flag', 'reject')),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_psi_verification on property_site_inspections(verification_id);

-- ─── Lawyer's manual AGIS submission + the official result ────────────────
create table if not exists property_agis_submissions (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references property_verifications(id) on delete cascade,
  submitted_by uuid not null references profiles(id),
  agis_reference text,
  submitted_at date not null,
  result_status text check (result_status in ('pending', 'clear', 'flagged', 'rejected')) default 'pending',
  result_summary text,
  result_received_at date,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_pas_verification on property_agis_submissions(verification_id);

-- ─── updated_at bookkeeping ─────────────────────────────────────────────────
create or replace function set_property_verifications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_property_verifications_updated_at on property_verifications;
create trigger trg_property_verifications_updated_at
  before update on property_verifications
  for each row execute function set_property_verifications_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table property_verifications enable row level security;
alter table property_verification_documents enable row level security;
alter table property_site_inspections enable row level security;
alter table property_agis_submissions enable row level security;

-- A user can see a verification if they requested it, are assigned to it as
-- surveyor/lawyer, or own/manage the underlying property.
create policy "view own or assigned verifications" on property_verifications
  for select using (
    auth.uid() = requested_by
    or auth.uid() = assigned_surveyor_id
    or auth.uid() = assigned_lawyer_id
    or auth.uid() in (
      select landlord_id from properties where properties.id = property_verifications.property_id
      union
      select agent_id from properties where properties.id = property_verifications.property_id
    )
  );

create policy "create verification for own property" on property_verifications
  for insert with check (auth.uid() = requested_by);

create policy "update own or assigned verifications" on property_verifications
  for update using (
    auth.uid() = requested_by
    or auth.uid() = assigned_surveyor_id
    or auth.uid() = assigned_lawyer_id
  );

create policy "view documents of accessible verification" on property_verification_documents
  for select using (
    exists (
      select 1 from property_verifications v
      where v.id = property_verification_documents.verification_id
    )
  );

create policy "insert documents on accessible verification" on property_verification_documents
  for insert with check (auth.uid() = uploaded_by);

create policy "view inspections of accessible verification" on property_site_inspections
  for select using (true);

create policy "surveyor manages own inspection" on property_site_inspections
  for all using (auth.uid() = surveyor_id) with check (auth.uid() = surveyor_id);

create policy "view agis submissions of accessible verification" on property_agis_submissions
  for select using (true);

create policy "lawyer manages own agis submission" on property_agis_submissions
  for all using (auth.uid() = submitted_by) with check (auth.uid() = submitted_by);

create policy "verification documents bucket read" on storage.objects
  for select using (bucket_id = 'verification-documents');

create policy "verification documents bucket write" on storage.objects
  for insert with check (bucket_id = 'verification-documents' and auth.uid() is not null);
