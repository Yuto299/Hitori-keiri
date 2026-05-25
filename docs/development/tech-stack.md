# 技術スタック / アーキテクチャ選定

> ひとり経理(Hitori Keiri)の開発技術選定。要件定義は [docs/requirements](../requirements/README.md) を参照。
> 最終更新: 2026-05-25 / ステータス: 確定(MVP)

---

## 1. 確定スタック

| レイヤ | 採用技術 | バージョン目安 | 備考 |
|---|---|---|---|
| アプリ基盤 | Expo (SDK 55) | RN 0.83 / React 19.2 | Development Build 前提 |
| 言語 | TypeScript | 5.x | strict 有効 |
| ルーティング | Expo Router | SDK 55同梱 | `src/app` ファイルベース |
| ナビゲーション | Native Tabs(Expo Router) | - | 4タブ(ホーム/レシート/出力/設定) |
| バックエンド | Supabase | - | Auth / Postgres / Storage |
| 認証 | Supabase Auth | - | Apple / Google / メール |
| OCR・抽出 | Claude API | Vision + Structured Outputs | レシート→構造化JSON |
| ローカルDB | expo-sqlite | SDK 55同梱 | オフライン保持・同期前段 |
| 状態管理 | (後述・最小構成) | - | まずReact Query + Context |
| ビルド/配布 | EAS Build / EAS Submit | - | App Store / Google Play |

## 2. なぜこの構成か(意思決定の根拠)

### 2.1 Expo SDK 55 + Development Build
- SDK 55 は最新安定版(2026-02-25)。**`src/` ディレクトリ構成が標準テンプレート化**され、保守性の高い構成が公式に裏付けられている。
- `expo-camera`(動画手ぶれ補正・サイズ削減)、`expo-sqlite`(DevToolsプラグイン・型安全SQL)、`expo-crypto`(AES-GCM)が強化され、**レシート撮影・ローカル保存・暗号化**という本アプリの核と直結。
- 公式は**本番アプリに Development Build を明確推奨**(Expo Go は学習用)。App Store公開([要件 FR-25](../requirements/03-functional-requirements.md))が前提なので、最初から Dev Build に寄せる。
- トレードオフ: Expo Go で即起動できない(ビルドが要る)。個人開発1名でも、カメラ等のネイティブ機能を使う以上どのみち Dev Build へ移行するため、最初から採用するのが結局シンプル。

### 2.2 Supabase
- Postgres + Auth + Storage が1つに揃い、**Apple/Google/メール認証・データ同期・画像保存**を単一サービスでまかなえる。
- 行レベルセキュリティ(RLS)でユーザーごとのデータ分離が宣言的に書け、個人開発でもセキュリティを担保しやすい。
- OSSベースでローカル開発(`supabase` CLI)も可能。コスト面も個人開発初期に優しい。

### 2.3 Claude API(OCR・構造化抽出)
- Vision でレシート画像を解釈し、**Structured Outputs**(`structured-outputs-2025-11-13` beta / Sonnet 4.5・Opus 4.1〜)で「日付・金額・店名・勘定科目候補」を**スキーマ準拠のJSON**で受け取れる。OCR+項目抽出+科目推定を一気通貫で処理。
- プロンプトは**画像→テキストの順**に置くのが公式推奨。
- 重要: **API鍵をアプリに埋め込まない**。Claude呼び出しは Supabase Edge Function 経由のサーバサイドで行う(鍵保護 + レート制御 + 枚数カウント[FR-22]の信頼境界)。

### 2.4 状態管理(最小構成で開始)
- サーバ状態は **TanStack Query (React Query)**、画面横断のUI状態は **React Context** で開始。Redux等は導入しない(MVPの規模に対し過剰)。
- 必要が出たら Zustand 等を後付けする方針。**最初から重い状態管理を入れない**。

## 3. OCR処理のデータフロー(概要)

```
[アプリ] レシート撮影(expo-camera)
   │ 画像をアップロード(Pro/Lightは保存、Freeは処理後削除)
   ▼
[Supabase Storage] 一時保存(プランに応じた保持ポリシー = FR-12)
   │
   ▼
[Supabase Edge Function] Claude API を呼び出し(鍵はサーバ保持)
   │ Vision + Structured Outputs → {date, amount, store, category候補}
   ▼
[アプリ] 確認画面(S-03)で承認/修正 → [Postgres + ローカルSQLite] 保存
```

- Freeプランは抽出完了後ただちに画像を削除([要件 1.7 注1](../requirements/01-product-overview.md#172-機能比較))。
- 枚数カウント([FR-22](../requirements/03-functional-requirements.md))は Edge Function 側で集計し、クライアント改ざんを防ぐ。

## 4. 採用予定の主要ライブラリ(MVP)

| 目的 | ライブラリ | 備考 |
|---|---|---|
| ルーティング | `expo-router` | SDK同梱 |
| カメラ | `expo-camera` | レシート撮影(FR-01/03) |
| 画像選択 | `expo-image-picker` | 端末画像取込(FR-02) |
| ローカルDB | `expo-sqlite` | オフライン保持 |
| セキュアストレージ | `expo-secure-store` | トークン等 |
| バックエンドSDK | `@supabase/supabase-js` | Auth/DB/Storage |
| セッション永続化 | `@react-native-async-storage/async-storage` | Supabase Auth用 |
| URLポリフィル | `react-native-url-polyfill` | Supabase必須 |
| サーバ状態 | `@tanstack/react-query` | フェッチ/キャッシュ |
| フォーム | `react-hook-form` + `zod` | 確認画面の検証 |
| 音声入力(Pro) | `expo-speech` / 音声認識系 | FR-10(要検証) |
| CSV生成 | 自前ユーティリティ | freee/マネフォ/弥生/汎用(FR-15〜18) |
| 課金 | `react-native-purchases` (RevenueCat) | サブスク・購入復元(FR-20/25)。要検証 |

> バージョンは `npx expo install` で SDK 55 互換版に解決する。ネイティブ依存は必ず `expo install` 経由で入れる。

## 5. 環境変数(クライアント)

Expo はクライアント公開変数を `EXPO_PUBLIC_` 接頭辞で扱う。**秘密鍵は置かない**。

| 変数 | 用途 | 公開可否 |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL | 公開可 |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon キー(RLS前提) | 公開可 |
| `ANTHROPIC_API_KEY` | Claude API キー | **サーバ専用**(Edge Function) |

## 6. 未確定・要検証(後続タスク)

- 課金基盤:RevenueCat 採用是非(App Store/Play の両対応・購入復元の手間を吸収できるか)。
- 音声入力(FR-10):Expo純正で足りるか、ネイティブ音声認識が要るか。
- OCRコスト試算:Claude API の単価 × プラン別枚数([要件 1.10](../requirements/01-product-overview.md#110-収支シミュレーションの前提詳細は第8章))。
- データ同期戦略:SQLite(ローカル)↔ Supabase(リモート)の同期方式(楽観更新・競合解決)。
