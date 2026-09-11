# やることリスト(リリースまでの残タスク)

> 最終更新: 2026-09-12 / 前提: フェーズ4(OCR本実装)+ フェーズ7の主要タスクまでコード側完了
> 進捗の経緯は [roadmap.md](./roadmap.md)、各タスクの設計は個別ドキュメントを参照。

## 現在の状態(検証済み)

- コアフロー一式が動作: カメラ撮影 → OCR → 確認・編集 → 保存 → 一覧/検索(Pro)/詳細/編集/削除 → CSV出力(4形式・期間指定・プラン制限つき)→ 認証・同期・画像Storage
- 課金壁はすべてアップグレード画面 S-07 に結線済み(購入処理のみ未実装)
- 検証: typecheck・lint / jest 27件 / Playwright E2E 12本(実ブラウザ)
- OCR は Supabase 未設定 or `EXPO_PUBLIC_OCR_MOCK=1` で自動的にモックになる(開発時のコストゼロ)

---

## 1. オーナー作業: これだけで全機能が動く 🔑

### 1.1 環境変数(済んでいれば飛ばす)

```bash
cp .env.example .env.local
# EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY を記入
```

### 1.2 実OCRの有効化(1回だけ・課金が発生)

OCRプロバイダーは切替式(OpenAI / Claude)。手順詳細: [ocr-implementation.md §2.1](./ocr-implementation.md)

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <ref>     # ダッシュボードURLの英数字部分

# OpenAI を使う場合(残クレジット消化。既定モデル gpt-4o-mini)
supabase secrets set OCR_PROVIDER=openai OPENAI_API_KEY=sk-...
supabase functions deploy ocr-receipt

# Claude を使う場合(既定モデル claude-haiku-4-5)
#   supabase secrets set OCR_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-...
#   supabase functions deploy ocr-receipt
```

- [ ] デプロイ後、実レシート10枚で精度とコストを実測(→ 要件 第8章の前提 ¥0.8/枚 を実値で更新)
- [ ] 精度が不足する場合: `supabase secrets set OCR_MODEL=gpt-4o`(OpenAI)/ `=claude-sonnet-4-6`(Claude)で上位モデルに切替(再デプロイ不要)
- [ ] 本番化時に Claude に戻すなら `OCR_PROVIDER=anthropic` に変えるだけ(コード変更不要)

### 1.3 画像Storage のマイグレーション適用(1回だけ)

Storage バケット `receipts` と RLS はマイグレーション化済み([image-storage.md](./image-storage.md))。

```bash
supabase db push     # 20260912000001_storage_receipts.sql を適用
```

- [ ] 適用後、Light/Pro でサインインして保存 → 別端末(または再インストール)で詳細画面に画像が出ることを確認

### 1.4 iPhone実機での確認(EAS = 外部サービス登録)

SDK 55 は Expo Go 非対応のため Development Build が必要。手順: [device-testing.md](./device-testing.md)

- [ ] `eas build --profile development --platform ios` → 実機でカメラ・SQLite・共有シートを確認

---

## 2. 残実装(コード側・着手指示待ち)📋

ストアに出す前に本質的に必要なのは **2.1 課金** のみ(画像Storage は実装済み・要マイグレーション適用)。

### 2.1 課金(フェーズ6)— ⚠ RevenueCat 採用是非のオーナー判断が先

- [ ] RevenueCat か StoreKit/Billing 直か決める(→ [tech-stack.md §6](./tech-stack.md))
- [x] アップグレード画面 S-07(課金壁の遷移先)— 2026-09-12 実装。購入ボタンは「準備中」表示+開発確認用の切替
- [ ] 購入・復元(FR-20/25)、S-07 と設定画面の開発用プラン切替を購入フローに差し替え
- [ ] subscriptions テーブルとプランの同期(現状プランはローカル状態のみ)

### 2.2 実装済み(2026-09-12)

- [x] 画像のStorage保存(FR-12): アップロード / 署名URL表示 / 保存ポリシー(Free 即削除・Light 30日・Pro 無期限、閲覧時判定)→ [image-storage.md](./image-storage.md)
- [x] 検索の Pro ゲート(FR-13)。Free/Light は検索バーをタップすると S-07 へ
- [x] 詳細画面からの編集(FR-14)+ 同席者/目的/案件名メモ(FR-09)
- [x] CSV期間指定(FR-19): 全期間 / 年 / 月 / 任意範囲

### 2.3 仕上げ(フェーズ7)— 設計: [phase-7-polish.md](./phase-7-polish.md)

- [ ] オンボーディング S-01(FR-24。Free画像即削除の事前明示)
- [ ] Apple / Google サインイン(FR-25 → [social-auth-setup.md](./social-auth-setup.md)。Apple Developer 登録が前提)
- [ ] 一覧の未出力/出力済みフィルタ(出力履歴の記録が前提)
- [ ] 連続撮影(FR-03。Light/Pro向け・優先度低)
- [ ] Pro機能: 音声メモ(FR-10)/ AI学習(FR-06。category_learning テーブルはあるがクライアント未実装)
- [ ] freee/マネフォ/弥生の正確な列定義を最新仕様で確定(現状は暫定列)
- [ ] Light 30日削除のサーバ側スケジュール処理(現状は「アプリで開いた時」に削除。開かない限り Storage に残る)

### 2.4 非機能(フェーズ8)

- [ ] オフライン撮影キュー(要件 第7章 7.3。OCR失敗時の再試行と統合)
- [ ] エラー監視(Sentry)
- [ ] 退会・データ削除導線

---

## 3. ストア申請までのオーナー準備 🏪

- [ ] Apple Developer Program / Google Play Console 登録(課金)
- [ ] アプリアイコン・スクリーンショット・ストア文言(現状アイコンはテンプレ由来)
- [ ] プライバシーポリシー(カメラ・写真・レシートデータ・Claude API送信の開示)
- [ ] App Store の IAP 審査要件(課金実装とセット)

---

## 4. 開発時の検証コマンド

```bash
npm run typecheck && npm run lint && npm test   # 静的検証 + 単体
npm run test:e2e                                 # Playwright E2E(12本・OCRモック・フェイクカメラ)
npx expo-doctor                                  # 設定健全性
npx expo export --platform web                   # 本番ビルド確認
```
