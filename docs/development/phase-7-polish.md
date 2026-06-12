# フェーズ7 細部の作り込み

> 関連: 要件 [第3章 機能要件](../requirements/03-functional-requirements.md) / [roadmap.md](./roadmap.md) フェーズ7
> ステータス: 設計(未着手・外部依存なし)
> 最終更新: 2026-05-26

---

## 0. ゴール

外部サービス登録なしで進められる UX 仕上げタスクをまとめる。優先度順に並べた。

| # | タスク | FR | 規模 | 優先度 |
|---|---|---|---|---|
| 1 | オンボーディング(初回起動) | FR-24 | 小 | 高(初回体験の質に直結) |
| 2 | レシート検索(Pro限定) | FR-13 | 中 | 中 |
| 3 | 詳細画面からの編集再利用 | FR-08, 14 | 中 | 中 |
| 4 | CSV 出力の期間指定(月/任意範囲) | FR-19 | 小 | 中 |
| 5 | 連続撮影(複数枚) | FR-03 | 中 | 低(枚数多いユーザー向け) |
| 6 | アップグレード画面 S-07(課金壁の遷移先) | FR-23 | 小 | 中(課金フェーズ前提だが UI 先行可能) |

---

## 1. オンボーディング(FR-24 / S-01)

### ゴール
初回起動時にだけ、3タップの流れと **Free画像即削除** を事前明示する。

### 設計

- 初回起動判定:AsyncStorage に `hk:onboarding:completed:v1` フラグを保存
- 未完了なら全画面オーバーレイで `OnboardingScreen` を表示し、完了したらタブ画面に切り替え
- ルートに `_layout.tsx` でゲートを置く形(以前試したが、あなたの LPプレビュー画面と相性が悪いので**設定画面から開く形に変える**選択肢も)

### 実装上の判断ポイント

**A. ルートに強制オーバーレイ(初回必須)**
- メリット:確実に見せられる
- デメリット:あなたが作り込んだ LPプレビュー画面と競合する可能性。前回これでpushを失敗させた

**B. ホーム画面の上部に「使い方ガイド」リンクを置き、設定画面から再表示可能**
- メリット:既存の見た目を壊さない
- デメリット:ユーザーが踏まないかも

**Web は B、ネイティブは A** の使い分けが現実解。

### コンテンツ(画面案)

1ページ目: 「撮るだけ。3タップで完了」(撮影→確認→保存のイラスト)
2ページ目: 「申告期にCSVで書き出すだけ」(freee/MF/弥生 ロゴ)
3ページ目: **【重要】** 「Freeは画像をテキスト化後すぐ削除します」(目立つ警告デザイン)
末尾: 「はじめる」ボタン(完了フラグを立てる)

### 既存コードへの影響

- 新規: `src/features/auth/components/onboarding-screen.tsx`
- 新規: `src/features/auth/hooks/use-onboarding.ts`
- 修正: `src/app/_layout.tsx`(ゲート or ホームへのリンク)

---

## 2. レシート検索(FR-13 / Pro限定)

### ゴール
レシート一覧画面(S-04)で日付・金額・店名で検索・絞り込みできる。Free/Light は検索バーをタップしたら**アップグレード画面 S-07**へ。

### 設計

```tsx
// receipt-list-screen.tsx
{plan === 'pro' ? (
  <SearchBar value={query} onChange={setQuery} />
) : (
  <Pressable onPress={() => router.push({ pathname: '/upgrade', params: { context: 'search' } })}>
    <View style={styles.lockedSearch}>
      <ThemedText>🔍 検索(Proで利用可)</ThemedText>
    </View>
  </Pressable>
)}
```

### 検索ロジック

- ローカルDB の `receipts` テーブルに対し、SQLの LIKE で店名、日付範囲、金額範囲を絞り込む
- 既存の `listReceipts(userId, limit)` を `searchReceipts(userId, query)` に拡張
- 入力にデバウンス(300ms)を入れる

```typescript
// receipt-repository.ts に追加
export async function searchReceipts(
  userId: string,
  q: { keyword?: string; dateFrom?: string; dateTo?: string; amountMin?: number; amountMax?: number }
): Promise<Receipt[]> {
  // 動的にWHERE組み立て + バインド
}
```

### 既存コードへの影響

- 修正: `lib/db/receipt-repository.ts`(ネイティブ・Web両方)
- 修正: `features/receipts/components/receipt-list-screen.tsx`
- 新規: `features/receipts/components/search-bar.tsx`

---

## 3. 詳細画面からの編集再利用(FR-08, FR-14)

### ゴール
詳細画面(S-05)で「編集」ボタンを押したら、確認画面(S-03)を再利用してフィールドを編集・上書き保存できる。

### 設計

- 確認画面(`review-screen.tsx`)を「新規 / 編集」両モード対応に
- URL パラメータで `mode=edit&id=<uuid>` を渡す
- 編集モード時は既存レシートを読み込んで初期値に設定、保存時は `updateReceipt` を呼ぶ(新規 `createReceipt` ではなく)
- 既存の `updateReceipt` は repository に未実装なので追加

```typescript
// receipt-repository.ts に追加
export async function updateReceipt(id: string, patch: Partial<Receipt>): Promise<void>
```

### 同期との関係

- update も Supabase に upsert で push する(`createReceiptSynced` と同じ流れ)
- ID が同じなので upsert すれば更新になる

### 既存コードへの影響

- 修正: `lib/db/receipt-repository.ts`(updateReceipt 追加)
- 修正: `lib/sync/receipt-sync.ts`(updateReceiptSynced 追加)
- 修正: `features/receipt-review/components/review-screen.tsx`(mode/id パラメータ対応)
- 修正: `features/receipts/components/receipt-detail-screen.tsx`(編集ボタン追加)

---

## 4. CSV 出力の期間指定(FR-19)

### ゴール
出力画面 S-06 で「年/月/任意範囲」を選んで対象レシートを絞れる。

### 設計(UI)

```
[期間] (年で絞る)
  ○ 全期間
  ○ 今年(2026)
  ○ 去年(2025)
  ○ 月を選ぶ → [2026年 ▼] [5月 ▼]
  ○ 任意範囲 → [開始日] 〜 [終了日]
```

### ロジック

- `listReceipts` を拡張するか、フィルタを別関数で `filterReceiptsByPeriod(receipts, period)` で実装
- 既存の `fileName({year})` を `fileName({year?, month?})` 等に拡張

### 既存コードへの影響

- 修正: `features/export/components/export-screen.tsx`(期間UI追加)
- 修正: `features/export/formatters/types.ts`(fileName の引数拡張)
- 各フォーマッタの `fileName` 実装を期間情報に合わせて変更

---

## 5. 連続撮影(FR-03)

### ゴール
撮影画面 S-02 で「連続モード」ON → 1枚撮影 → 次々撮影できる。撮り終わって「完了」を押すと、撮影分が確認キューに入る。

### 設計

- 撮影画面に連続モードトグル
- ON の時は撮影後に確認画面に飛ばず、撮影画面に戻って次撮影
- 撮ったレシートはローカル state に積む
- 「完了」ボタンで一括 OCR → 確認画面のキューを表示
- 確認画面はスワイプで次へ進める形式に拡張

### 注意

- 連続撮影は Light/Pro 向け(店舗系自営業 F のニーズ)。Free は枚数制限が即刻発動するため、ほぼ意味なし
- OCR コストが嵩むため、連続枚数の上限(例:10枚/回)を設けるか検討

### 既存コードへの影響

- 修正: `features/capture/components/capture-screen.tsx`(連続モード追加)
- 新規: `features/capture/hooks/use-capture-queue.ts`(撮影キュー管理)
- 修正: `features/receipt-review/components/review-screen.tsx`(キュー受け取り・スワイプ進行)

---

## 6. アップグレード画面 S-07(FR-23)

### ゴール
各課金壁(Free→Light, Light→Pro)から遷移する画面。文脈別に見出しを出し分け、プラン比較表 + 「このプランで続ける」ボタン。

### 設計

URLパラメータで発火文脈を受け取る:
- `/upgrade?context=csv` → 「freee形式で書き出すには Light 以上が必要です」
- `/upgrade?context=search` → 「過去のレシートを検索するには Pro が必要です」
- `/upgrade?context=limit` → 「今月の枚数上限に達しました」
- `/upgrade?context=image` → 「画像を残すには Light 以上が必要です」
- `/upgrade?context=voice` → 「音声でメモを記録するには Pro が必要です」

### 注意

- フェーズ6(課金 IAP)が入るまでは購入処理は未実装 → 「現状は開発確認用」と注記し、選択プランへ設定切替で代用
- 前回これを作って `/sign-in` と同様にタブ外ルートで詰まった経験あり。今は `(tabs)/` グループ化で解消済みなので、新規ルート `src/app/upgrade.tsx` として作れる

### 既存コードへの影響

- 新規: `src/app/upgrade.tsx`
- 新規: `src/features/billing/components/upgrade-screen.tsx`
- 修正: 各課金壁ポイント([review-screen.tsx](../../src/features/receipt-review/components/review-screen.tsx) の枚数上限、[export-screen.tsx](../../src/features/export/components/export-screen.tsx) のCSV選択時など)から `router.push({ pathname: '/upgrade', params: { context: ... } })`

---

## 推奨実装順序

1. **アップグレード画面 S-07**(他の課金壁から呼ばれる先・先に作る)
2. **オンボーディング**(初回体験の質に直結・小規模)
3. **CSV 期間指定**(小規模・申告期に直結)
4. **詳細画面からの編集**(中規模・useful)
5. **レシート検索 (Pro)**(中規模)
6. **連続撮影**(最後・大規模)

着手時にはこのドキュメントを参照しつつ、必要に応じて要件側にもフィードバックする。
