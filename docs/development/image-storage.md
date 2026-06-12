# 画像 Storage 同期(Supabase Storage)

> 関連: 要件 [FR-12 画像保存ポリシー](../requirements/03-functional-requirements.md) / [第5章 5.6](../requirements/05-data-model-csv.md#56-画像とストレージfr-12-との整合)
> ステータス: 設計(未着手)
> 最終更新: 2026-05-26

---

## 0. ゴール

レシート画像を Supabase Storage に保存し、**プラン別の保存ポリシー(FR-12)** を満たす:

| プラン | 画像保存 |
|---|---|
| Free | OCR完了後ただちに削除(画像は持たない) |
| Light | 30日間保存。30日経過で自動削除 |
| Pro | 無期限保存 |

## 1. 現状

`Receipt` 型は `imageStatus: 'stored' \| 'deleted'` と `imagePath: string?` を既に持っている。しかし:
- 現状の `imagePath` は **端末ローカルの URI**(`file://...`)であり、サーバには上がっていない
- リモート同期した時、別端末では画像が見えない
- Free の「ただちに削除」も、Light の「30日後削除」もまだ走っていない

これを Supabase Storage 連動で完成させる。

## 2. オーナー作業(コンソール側)

1. Supabase ダッシュボード → **Storage** → **Create bucket**
   - 名前: `receipts`
   - **Public**: OFF(プライベートバケット)
   - File size limit: 5MB 程度
2. RLS ポリシーを設定(下記 4.2 のSQLを SQL Editor で実行)

## 3. ストレージのパス設計

```
receipts/<user_id>/<receipt_id>.jpg
```

- `user_id` は Supabase Auth の `auth.uid()`
- `receipt_id` はレシートの UUID(ローカル=リモート同一、sync-strategy.md 参照)
- 拡張子は `.jpg`(撮影時に統一)

## 4. RLS ポリシー(Storage)

### 4.1 アップロード(自分のフォルダだけ書き込み可)

```sql
create policy "Users can upload own receipt images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 4.2 取得・削除(自分の画像だけ)

```sql
create policy "Users can read own receipt images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own receipt images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 5. アプリ側の実装

### 5.1 アップロード(撮影 → 保存時)

```typescript
// lib/supabase/image-storage.ts
export async function uploadReceiptImage(
  receiptId: string,
  userId: string,
  imageUri: string,
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const response = await fetch(imageUri);
  const blob = await response.blob();
  const path = `${userId}/${receiptId}.jpg`;

  const { error } = await supabase.storage
    .from('receipts')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path; // imagePath として Receipt に保存
}
```

### 5.2 画像URLの取得(詳細画面で表示)

Storage は private なので**署名付きURL**を都度発行する:

```typescript
export async function getReceiptImageUrl(path: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from('receipts')
    .createSignedUrl(path, 60 * 5); // 5分有効
  if (error) return null;
  return data.signedUrl;
}
```

### 5.3 削除

```typescript
export async function deleteReceiptImage(path: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.storage.from('receipts').remove([path]);
}
```

## 6. 保存ポリシー(FR-12)の適用

### 6.1 Free: OCR完了後ただちに削除

```typescript
// review-screen で保存時
if (plan === 'free') {
  // OCR は既に完了しているので Storage に上げず、imageStatus='deleted' で記録
  await createReceiptSynced({ ..., imageStatus: 'deleted', imagePath: undefined });
} else {
  const path = await uploadReceiptImage(id, userId, uri);
  await createReceiptSynced({ ..., imageStatus: 'stored', imagePath: path });
}
```

### 6.2 Light: 30日後の自動削除

選択肢:
- **A. Supabase Edge Function + cron**(`supabase functions deploy --schedule` で日次実行)
- **B. クライアント側でアクセス時判定**(画像取得時に created_at + 30日 を超えていたら削除して `imageStatus='deleted'`)

**MVP は B 推奨**(サーバの cron インフラを増やさない)。デメリットは「アプリを開かないと削除されない」だが、ユーザー体験上の問題は小さい。

```typescript
// 詳細画面で画像を見る時
if (plan === 'light' && receipt.imageStatus === 'stored') {
  const ageMs = Date.now() - new Date(receipt.createdAt).getTime();
  if (ageMs > 30 * 24 * 60 * 60 * 1000) {
    await deleteReceiptImage(receipt.imagePath!);
    await updateReceipt(receipt.id, { imageStatus: 'deleted', imagePath: null });
  }
}
```

### 6.3 Pro: 無期限

何もしない。

## 7. プランダウングレード時の扱い

Pro → Light に下げた場合、過去30日より前の画像はどうする?

選択肢:
- **A. 即削除**(厳格)
- **B. 既存は保持し、新規からは30日ルール適用**(緩い)

要件にない判断なので、**着手前にオーナー確認**。当面は B(緩い)で実装し、将来必要なら厳格化、を提案。

## 8. ストレージ容量とコスト

| プラン | レシート1枚あたり画像サイズ(リサイズ後・JPEG 70%) | 月100枚で | 1ユーザー1年で |
|---|---|---|---|
| 画像 | 約 150〜300 KB | 30 MB | 360 MB |

Supabase Free プランは Storage 1 GB まで → 個人開発初期は十分。Pro ユーザーが増えてきたら有料プラン($25/月で100GB)を検討。

## 9. 段階的な実装順序

1. Supabase Storage バケット作成(オーナー作業)
2. RLS ポリシー適用(SQL Editor / マイグレーション)
3. `uploadReceiptImage` / `getReceiptImageUrl` / `deleteReceiptImage` 実装
4. review-screen 保存処理にプラン別アップロード分岐を追加
5. 詳細画面で署名付きURL経由で画像表示 + Light の期限切れ判定
6. 同期時に画像も pull(必要なら)
7. プランダウングレード時の挙動を最終確定(オーナー確認後)

## 10. 既存コードへの影響

- 新規: `src/lib/supabase/image-storage.ts`
- 修正: [review-screen.tsx](../../src/features/receipt-review/components/review-screen.tsx) — 保存時のアップロード呼び出し
- 修正: [receipt-detail-screen.tsx](../../src/features/receipts/components/receipt-detail-screen.tsx) — 署名付きURLでの画像表示
- 新規: マイグレーション(Storage RLS) `supabase/migrations/*_storage_policies.sql`
