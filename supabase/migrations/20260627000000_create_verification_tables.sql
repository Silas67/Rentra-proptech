-- Land verification module (AGIS pre/post verification workflow)
-- See CLAUDE.md for the 8-step workflow this schema supports.

-- ============ profiles.role: add surveyor + lawyer ============
-- Assumes the default Postgres-generated constraint name for an inline
-- CHECK on profiles.role (i.e. it was never given an explicit name).
-- If this fails, profiles.role uses a different constraint name or a
-- real enum type — tell me which and I'll adjust this migration.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('tenant', 'agent', 'landlord', 'surveyor', 'lawyer'));

-- ============ Enums ============

create type verification_status as enum (
  'PENDING',
  'DOCS_UPLOADED',
  'AI_ANALYZED',
  'SURVEY_DONE',
  'PRE_REPORT_READY',
  'AGIS_SUBMITTED',
  'AGIS_RECEIVED',
  'FINAL_REPORT_READY'
);

create type document_type as enum (
  'certificate_of_occupancy',
  'right_of_occupancy',
  'survey_plan',
  'deed_of_assignment',
  'governors_consent',
  'building_approval_plan',
  'tax_clearance_certificate',
  'other'
);

create type agis_verdict as enum (
  'clean_title',
  'encumbrance',
  'ownership_dispute',
  'revoked'
);

create type risk_level as enum ('low', 'medium', 'high', 'critical');

-- ============ Tables ============
-- The workflow is single-pass per property: one verification_request per
-- property, and one row per request in every downstream table except
-- uploaded_documents (multiple files per request).

create table verification_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references properties(id),
  status verification_status not null default 'PENDING',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references verification_requests(id) on delete cascade,
  file_url text not null,
  doc_type document_type not null,
  extracted_data jsonb,
  created_at timestamptz not null default now()
);
create index idx_uploaded_documents_request on uploaded_documents(request_id);

create table surveyor_reports (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references verification_requests(id) on delete cascade,
  surveyor_id uuid not null references profiles(id),
  findings jsonb not null,
  submitted_at timestamptz not null default now()
);

create table agis_submissions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references verification_requests(id) on delete cascade,
  submitted_by uuid not null references profiles(id),
  submitted_at timestamptz not null default now(),
  tracking_ref text
);

create table agis_results (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references verification_requests(id) on delete cascade,
  result_file_url text not null,
  verdict agis_verdict not null,
  raw_data jsonb,
  uploaded_at timestamptz not null default now()
);

create table verification_reports (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references verification_requests(id) on delete cascade,
  risk_level risk_level not null,
  verdict text not null,
  report_pdf_url text,
  generated_at timestamptz not null default now()
);

-- ============ RLS ============
-- Enabled with no policies yet: default-deny until access rules are
-- defined (who can read/write as tenant/agent/landlord/surveyor/lawyer).
-- Tables are otherwise open to the anon key once RLS is off, which is
-- not acceptable for legal documents.
alter table verification_requests enable row level security;
alter table uploaded_documents enable row level security;
alter table surveyor_reports enable row level security;
alter table agis_submissions enable row level security;
alter table agis_results enable row level security;
alter table verification_reports enable row level security;
