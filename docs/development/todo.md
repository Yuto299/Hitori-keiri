# やることリスト(リリースまでの残タスク)

> 最終更新: 2026-06-13 / 前提: フェーズ4(OCR本実装)までコード側完了
> 進捗の経緯は [roadmap.md](./roadmap.md)、各タスクの設計は個別ドキュメントを参照。

## 現在の状態(検証済み)

- コアフロー一式が動作: カメラ撮影 → OCR → 確認・編集 → 保存 → 一覧/検索/詳細/削除 → CSV出力(4形式・プラン制限つき)→ 認証・同期
- 検証: expo-doctor 19/19 / 本番Webビルド成功 / typecheck・lint / jest 16件 / Playwright E2E 9本(実ブラウザ)
- OCR は Supabase 未設定 or `EXPO_PUBLIC_OCR_MOCK=1` で自動的にモックになる(開発時のコストゼロ)

---

## 1. オーナー作業: これだけで全機能が動く 🔑

### 1.1 環境変数(済んでいれば飛ばす)

```bash
cp .env.example .env.local
# EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY を記入
```

### 1.2 実OCRの有効化(1回だけ・課金が発生)

手順詳細: [ocr-implementation.md §2.1](./ocr-implementation.md)

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <ref>     # ダッシュボードURLの英数字部分

# console.anthropic.com でAPIキー発行 + プリペイド入金
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy ocr-receipt
```

- [ ] デプロイ後、実レシート10枚で精度とコストを実測(→ 要件 第8章の前提 ¥0.8/枚 を実値で更新)
- [ ] 精度が不足する場合: `supabase secrets set OCR_MODEL=claude-sonnet-4-6` で上位モデルに切替(再デプロイ不要)

### 1.3 iPhone実機での確認(EAS = 外部サービス登録)

SDK 55 は Expo Go 非対応のため Development Build が必要。手順: [device-testing.md](./device-testing.md)

- [ ] `eas build --profile development --platform ios` → 実機でカメラ・SQLite・共有シートを確認

---

## 2. 残実装(コード側・着手指示待ち)📋

ストアに出す前に本質的に必要なのは **2.1 と 2.2 の2つ**。

### 2.1 画像のStorage保存(FR-12)— 設計: [image-storage.md](./image-storage.md)

現状 Light/Pro の画像は端末ローカル参照のみ(機種変更でテキストは同期されるが画像は残らない)。

- [ ] Supabase Storage バケット + RLS(マイグレーション)
- [ ] 保存時アップロード / 詳細画面は署名URLで表示
- [ ] 保存ポリシー: Free 即削除 / Light 30日 / Pro 無期限(30日削除はスケジュール処理)

### 2.2 課金(フェーズ6)— ⚠ RevenueCat 採用是非のオーナー判断が先

- [ ] RevenueCat か StoreKit/Billing 直か決める(→ [tech-stack.md §6](./tech-stack.md))
- [ ] アップグレード画面 S-07(課金壁の遷移先。UIは先行実装可: [phase-7-polish.md §6](./phase-7-polish.md))
- [ ] 購入・復元(FR-20/25)、設定画面の開発用プラン切替を購入フローに差し替え
- [ ] subscriptions テーブルとプランの同期(現状プランはローカル状態のみ)

### 2.3 仕上げ(フェーズ7)— 設計: [phase-7-polish.md](./phase-7-polish.md)

- [ ] オンボーディング S-01(FR-24。Free画像即削除の事前明示)
- [ ] Apple / Google サインイン(FR-25 → [social-auth-setup.md](./social-auth-setup.md)。Apple Developer 登録が前提)
- [ ] 詳細画面からの編集(確認画面の再利用)
- [ ] CSV期間指定(月/任意範囲。現状は全期間+年付きファイル名)
- [ ] 一覧の未出力/出力済みフィルタ(出力履歴の記録が前提)
- [ ] 連続撮影(FR-03。Light/Pro向け・優先度低)
- [ ] Pro機能: 検索の正式ゲート(FR-13)/ 音声メモ(FR-10)/ AI学習(FR-06)
- [ ] freee/マネフォ/弥生の正確な列定義を最新仕様で確定(現状は暫定列)

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
npm run test:e2e                                 # Playwright E2E(9本・OCRモック・フェイクカメラ)
npx expo-doctor                                  # 設定健全性
npx expo export --platform web                   # 本番ビルド確認
```
