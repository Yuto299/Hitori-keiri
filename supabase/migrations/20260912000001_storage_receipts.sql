-- レシート画像の Storage バケットと RLS(FR-12 画像保存ポリシー)
-- 設計: docs/development/image-storage.md
--
-- * バケット `receipts` はプライベート。パスは <user_id>/<receipt_id>.jpg
-- * 自分のフォルダ(先頭セグメント = auth.uid())だけ読み書き削除できる
-- * 保存期間(Free 即削除 / Light 30日 / Pro 無期限)はアプリ側で適用する

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "Users can upload own receipt images" on storage.objects;
create policy "Users can upload own receipt images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- upsert(再アップロード)のため update も許可する
drop policy if exists "Users can update own receipt images" on storage.objects;
create policy "Users can update own receipt images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can read own receipt images" on storage.objects;
create policy "Users can read own receipt images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own receipt images" on storage.objects;
create policy "Users can delete own receipt images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
