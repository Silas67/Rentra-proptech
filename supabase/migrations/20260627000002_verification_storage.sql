-- Private bucket for verification documents (C of O, survey plans, AGIS
-- results, etc.) — never public, unlike the existing "property-images"
-- bucket. Files are read back via signed URLs, not getPublicUrl.
insert into storage.buckets (id, name, public)
values ('verification-documents', 'verification-documents', false)
on conflict (id) do nothing;

-- Path convention is {request_id}/{filename} — enforced by the
-- register-document edge function, relied on here to scope access.

create policy "verification docs upload by request creator"
on storage.objects for insert
with check (
  bucket_id = 'verification-documents'
  and exists (
    select 1 from verification_requests
    where id = ((storage.foldername(name))[1])::uuid
      and created_by = auth.uid()
  )
);

create policy "verification docs select via request access"
on storage.objects for select
using (
  bucket_id = 'verification-documents'
  and can_access_verification_request(((storage.foldername(name))[1])::uuid)
);
