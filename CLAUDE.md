# Rentra — Land Verification Module

## What this is
A property pre/post verification system embedded in the Rentra real estate platform.
It helps users verify land ownership and title legitimacy in FCT Abuja, Nigeria before
and after official government (AGIS) verification.

## Nigerian land context (critical)
- AGIS = Abuja Geographic Information Systems — the FCT land registry authority
- Common document types users upload:
  - Certificate of Occupancy (C of O) — strongest proof of ownership
  - Right of Occupancy (R of O)
  - Survey Plan — shows boundaries and coordinates
  - Deed of Assignment — proof of transfer between parties
  - Governor's Consent — required for valid property transfer in FCT
  - Building Approval Plan
  - Tax Clearance Certificate
- AGIS results can return: clean title, encumbrances, ownership disputes, revocations
- Lawyers physically submit to AGIS — there is no API, this is a manual step

## The 8-step workflow
1. User uploads documents (PDFs, images)
2. AI (Claude API) extracts key fields and flags anomalies
3. Surveyor performs offline site inspection — software captures their findings
4. AI generates pre-AGIS report (PDF) combining doc analysis + surveyor findings
5. Lawyer downloads report and submits to AGIS manually — software tracks this
6. Lawyer uploads AGIS official result back into the system
7. AI interprets the AGIS result — maps verdict to risk level
8. Final verification report generated (PDF) — determines listing approval on Rentra

## Human-in-the-loop steps (steps 3, 5, 6 are NOT automated)
- Step 3: Surveyor fills in an inspection form in the app
- Step 5: Lawyer is notified and marks submission as done
- Step 6: Lawyer uploads the AGIS result document manually

## Tech stack
- React + TypeScript + Vite (frontend)
- Supabase (auth, database, storage, edge functions)
- Claude API (claude-sonnet-4-6) for document extraction, analysis, report generation
- PDF generation for pre-AGIS report and final report

## Database tables needed
- verification_requests (id, property_id, status, created_by, created_at)
- uploaded_documents (id, request_id, file_url, doc_type, extracted_data jsonb)
- surveyor_reports (id, request_id, surveyor_id, findings jsonb, submitted_at)
- agis_submissions (id, request_id, submitted_by, submitted_at, tracking_ref)
- agis_results (id, request_id, result_file_url, verdict, raw_data jsonb, uploaded_at)
- verification_reports (id, request_id, risk_level, verdict, report_pdf_url, generated_at)

## Verification status flow
PENDING → DOCS_UPLOADED → AI_ANALYZED → SURVEY_DONE →
PRE_REPORT_READY → AGIS_SUBMITTED → AGIS_RECEIVED → FINAL_REPORT_READY

## Feature folder
src/features/verification/
  components/ hooks/ services/ types/ pages/

## Build rules
- Explain every architectural decision before writing code
- One file at a time unless asked otherwise
- Use Zod to validate all Claude API responses (AI output is unpredictable)
- Use TanStack Query for all server state
- The Claude API is called from Supabase Edge Functions, never from the browser