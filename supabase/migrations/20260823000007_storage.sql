-- Where an uploaded chart lives.
--
-- Private, not public: these are a learner's own files and there is no reason for them to
-- be fetchable by anyone holding a guessed URL. The result screen mints a short-lived
-- signed URL when it needs to show one.
--
-- The image is stored so a learner can look back at what they were reporting on. It is
-- not sent to the model (CLARIFICATION.md D-4) — the mark is based on the description
-- they typed. That means a misread chart is not caught, which is a real limitation of
-- Task 1 marking today and is tracked in TODO.md rather than papered over.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chart-images',
  'chart-images',
  false,
  5242880,                                              -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Objects are stored as `{user_id}/{filename}`, so ownership is the first path segment.
-- Matching on the folder rather than on a metadata column means a learner cannot write
-- into someone else's prefix even by crafting the request by hand.

create policy "learners upload into their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chart-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "learners read their own charts"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'chart-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "learners delete their own charts"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'chart-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
