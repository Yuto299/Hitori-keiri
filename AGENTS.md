# ひとり経理(Hitori Keiri)— AI開発ガイド

このファイルは Claude Code / AI エージェントがこのリポジトリで作業する際の規約。
人間の開発者(オーナー1名)が読んでも全体像が掴める内容にしている。

---

## 0. まず読むもの(Expo は変化が速い)

コードを書く前に、必ず該当バージョンの公式ドキュメントを確認すること。
**Expo SDK 55** を使用。versioned docs: https://docs.expo.dev/versions/v55.0.0/

## 1. このプロダクトは何か

個人事業主・副業向けの「撮るだけ経理」アプリ。レシートを撮影 → OCRで日付/金額/店名/勘定科目を抽出 → 確定申告期に freee/マネフォ/弥生 形式の CSV を書き出す。**会計ソフトには接続せず、出口は CSV のみ**。

- コンセプト・料金・スコープ → [docs/requirements/01-product-overview.md](docs/requirements/01-product-overview.md)
- **要件定義は全8章が確定済み** → [docs/requirements/README.md](docs/requirements/README.md)

## 2. 技術スタック(確定)

| レイヤ | 技術 |
|---|---|
| アプリ | Expo SDK 55(RN 0.83 / React 19.2)+ Development Build |
| ルーティング | Expo Router(`src/app` ファイルベース)+ Native Tabs |
| バックエンド | Supabase(Auth / Postgres / Storage / Edge Functions) |
| OCR | Claude API(Vision + Structured Outputs)※サーバ側 Edge Function 経由 |
| ローカルDB | expo-sqlite |
| サーバ状態 | TanStack Query |
| フォーム検証 | react-hook-form + zod |

詳細 → [docs/development/tech-stack.md](docs/development/tech-stack.md)

## 3. よく使うコマンド

```bash
npm start            # Expo 開発サーバ起動
npm run ios          # iOS で起動(要 Development Build / Simulator)
npm run android      # Android で起動
npm run web          # Web で起動
npm run lint         # eslint-config-expo
npm run typecheck    # tsc --noEmit(型エラーチェック)
npm test             # jest(ロジックの単体テスト)
npx expo install <pkg>   # ネイティブ依存は必ず expo install で(SDK互換版に解決)
```

## 4. フォルダ構成(feature-based)

```
src/
  app/          # ★ルート定義のみ(Expo Router)。中身のロジックは置かない
  features/     # ★機能ごと: capture / receipt-review / receipts / export / billing / auth
  shared/       # 2つ以上の機能で使う UI・hooks・型
  lib/          # 外部サービス基盤: supabase / db / query / env
  constants/    # 色(theme)・勘定科目など固定値
  config/       # プラン定義などアプリ全体の方針値
supabase/       # migrations / functions(Edge Function: ocr-receipt)
```

- 画面(`app/`)は薄く、実体は `features/<機能>/` を呼ぶだけにする。
- 共有は早すぎる共通化を避け、**2箇所で必要になってから** `shared/` へ昇格。
- import は相対パスではなく `@/`(= `src/`)エイリアスを使う。
- 詳細・設計意図 → [docs/development/folder-structure.md](docs/development/folder-structure.md)

## 5. コーディング規約

- TypeScript strict。`any` を避ける。
- ファイル名は **kebab-case**(`shutter-button.tsx`)。React コンポーネントは PascalCase。
- 1コンポーネント=1責務。専用の hook/型はその隣にコロケーション。
- **秘密鍵をクライアントに置かない**。Claude API キーは Supabase Edge Function のみ。
  クライアント公開変数は `EXPO_PUBLIC_` 接頭辞(→ `src/lib/env.ts` で型付き読み出し)。
- データ分離は Supabase RLS で担保(`user_id = auth.uid()`)。

## 6. 作業のしかた(重要)

- **要件に関わる仕様判断は勝手に決めない**。要件定義(docs/requirements)に未確定なら、実装を進める前に確認する。
- **課金・外部公開が絡む操作は必ずオーナー確認**(EAS Build/Submit、ストア申請、外部サービスの課金変更など)。
- **変更したらドキュメントに記録する**(ブラックボックスにしない)。コード構成・方針を変えたら docs/development を更新。
- コミットはこまめに、メッセージで「何を・なぜ」が分かるように。
- テストは **ロジック優先**(CSVフォーマッタ・プラン判定・枚数カウント・店名正規化)。型チェックと lint は常時通す。

## 7. 現在のフェーズ

要件定義 v1.0 完了 → **環境整備 → 実装着手**。
実装の進め方・タスク順序 → [docs/development/roadmap.md](docs/development/roadmap.md)
