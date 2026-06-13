# フォルダ構成

> ひとり経理(Hitori Keiri)のディレクトリ設計。技術選定は [tech-stack.md](./tech-stack.md) を参照。
> 最終更新: 2026-05-25 / ステータス: 確定(MVP)

---

## 1. 設計の考え方(保守性のための3原則)

1. **ルート(`src/app/`)は「画面の地図」だけ**。公式どおり `src/app` は Expo Router のルート定義専用。画面の中身のロジックは置かない([Expo公式](https://docs.expo.dev/router/reference/src-directory/))。
2. **機能ごとにまとめる(feature-based)**。「撮影」「確認」「一覧」「出力」「課金」「認証」といった**機能の単位**でフォルダを切る。1つの機能を直す時に触るファイルが1箇所に集まり、どこを見ればいいか迷わない。
3. **共有は `shared/`、横断は `lib/`**。複数機能で使う部品だけを共有層に上げる。最初から共有に置かず、2箇所で必要になってから上げる(早すぎる共通化を避ける)。

> なぜ feature-based か: 画面数・機能が増えても「機能名のフォルダを開けば全部ある」状態を保てる。type-based(components/ hooks/ ... に全機能を混ぜる)は小規模なうちは楽だが、増えると「この画面の関連ファイルがあちこちに散る」ため、本アプリの規模(8画面+課金+同期)では feature-based を採る。

## 2. 全体構成

```
hitori-keiri/
├── app.json / app.config.ts      # Expo 設定(ルート固定)
├── package.json
├── tsconfig.json                 # @/* → ./src/*
├── metro.config.js
├── eas.json                      # EAS Build/Submit 設定
├── .env.example                  # 環境変数のテンプレ(値は入れない)
├── .env.local                    # 実値(gitignore)
├── assets/                       # 画像・フォント・アイコン
├── supabase/                     # Supabase 関連(CLI管理)
│   ├── migrations/               # DBマイグレーション(SQL)
│   └── functions/                # Edge Functions
│       └── ocr-receipt/          # Claude API 呼び出し(鍵はここ=サーバ側)
├── docs/                         # 要件定義・設計・デザイン
└── src/
    ├── app/                      # ★ルート定義のみ(Expo Router)
    │   ├── _layout.tsx           # ルートレイアウト(Provider/フォント/テーマ)
    │   ├── index.tsx             # 起動時の振り分け(認証状態でリダイレクト)
    │   ├── (onboarding)/         # 初回オンボーディング(S-01)
    │   │   ├── _layout.tsx
    │   │   └── index.tsx
    │   ├── (auth)/               # ログイン関連
    │   │   ├── _layout.tsx
    │   │   └── sign-in.tsx
    │   └── (tabs)/               # 4タブ(ホーム/レシート/出力/設定)
    │       ├── _layout.tsx       # Native Tabs 定義
    │       ├── index.tsx         # ホーム(S-09)
    │       ├── receipts/         # レシート(一覧S-04・詳細S-05)
    │       │   ├── index.tsx
    │       │   └── [id].tsx
    │       ├── export.tsx        # CSV出力(S-06)
    │       └── settings.tsx      # 設定・プラン(S-08)
    │
    ├── features/                 # ★機能ごとのロジック・UI・hooks
    │   ├── capture/              # 撮影・OCR取り込み(S-02)
    │   │   ├── components/       # CameraView, ShutterButton, FreeBanner...
    │   │   ├── hooks/            # useCamera, useReceiptScan...
    │   │   └── api/              # OCR呼び出し(Edge Function 経由)
    │   ├── receipt-review/       # 確認・編集(S-03)
    │   ├── receipts/             # 一覧・詳細・検索(S-04/05)
    │   ├── export/               # CSV生成・共有(S-06)
    │   │   └── formatters/       # freee / mf / yayoi / generic
    │   ├── billing/              # プラン・課金・枚数制限(S-07, FR-20〜23)
    │   └── auth/                 # 認証(Apple/Google/メール)
    │
    ├── shared/                   # ★複数機能で共有するUI・hooks
    │   ├── components/           # Button, Card, Screen, EmptyState...
    │   ├── hooks/                # useColorScheme, useDebounce...
    │   └── types/                # 横断的な型(Receipt, Plan, Category...)
    │
    ├── lib/                      # ★外部サービス・基盤(副作用の入口)
    │   ├── supabase/             # クライアント初期化・型
    │   ├── db/                   # expo-sqlite ラッパ・スキーマ
    │   ├── query/                # React Query クライアント設定
    │   └── env.ts                # 環境変数の型付き読み出し
    │
    ├── constants/                # 色・サイズ・勘定科目マスタ等
    │   ├── theme.ts              # デザインA(グリーン/ライト)トークン
    │   └── categories.ts         # 勘定科目の初期セット
    │
    └── config/                   # アプリ全体の設定値(プラン定義等)
        └── plans.ts              # Free/Light/Pro の枚数・機能フラグ
```

## 3. 各層の責務(どこに何を書くか)

| 層 | 置くもの | 置かないもの |
|---|---|---|
| `src/app/` | ルート(画面)定義・レイアウト・画面間遷移 | ビジネスロジック、複雑なUI実装 |
| `src/features/<機能>/` | その機能専用のUI・hooks・API呼び出し | 他機能から使う共有部品 |
| `src/shared/` | 2つ以上の機能で使うUI・hooks・型 | 特定機能だけのもの |
| `src/lib/` | Supabase/SQLite/Query等の初期化・薄いラッパ | 画面固有のロジック |
| `src/constants/` | 変わらない値(色・科目・サイズ) | 動的な状態 |
| `src/config/` | プラン定義などアプリ全体の方針値 | UI |

### 画面(app)と機能(features)の関係
`src/app/(tabs)/receipts/index.tsx` は薄く、実体は `src/features/receipts/` を呼ぶだけにする。

```tsx
// src/app/(tabs)/receipts/index.tsx — 画面は「組み立て」に徹する
import { ReceiptListScreen } from "@/features/receipts/components/receipt-list-screen";
export default ReceiptListScreen;
```

## 4. 命名・配置のルール

- **ルートファイル名は kebab-case・小文字**(`sign-in.tsx`、`[id].tsx`)。Expo Router の規約。
- **コンポーネントファイルも kebab-case**(`shutter-button.tsx`)、export する React コンポーネントは PascalCase(`ShutterButton`)。
- **コロケーション優先**:あるコンポーネント専用のhook/型/テストは、その隣に置く。共有が必要になった時だけ `shared/` へ昇格。
- **バレルファイル(`index.ts`の再export)は最小限**。循環参照と意図しない巨大バンドルを避けるため、機能の「公開API」を明示したい所だけに置く。
- **import エイリアスは `@/`**(= `src/`)。相対パスの `../../../` を避ける。
- **色・角丸はトークンを使う**(hex直書き禁止)。`@/constants/theme` の `Palette`(MVPはライト固定の静的参照用)/ `Brand` / `Radius` / `Spacing` を参照する。例外はイラスト・アバターのパステル等、意図的なワンオフ装飾のみ。
- **押せるのに動かないUIを置かない**。未実装機能のボタン・タブは実装フェーズまで非表示にする。サンプルデータを見せる場合は必ず「サンプル」バッジで実データと区別する(`features/receipts/demo-receipts.ts`)。
- **`Alert.alert` を直接呼ばない**。react-native-web では未実装(無反応)のため、`@/shared/alert` の `showAlert` / `confirmAsync` を使う(Web は window.alert / window.confirm に振り分け)。
- **`router.back()` は `router.canGoBack()` でガード**する。URL直叩き・リロード(Web)では履歴がなく、戻る/閉じるボタンが無反応になるため、フォールバック先(`/` 等)へ `replace` する。

## 5. テスト・型・lint(MVPの最小)

```
hitori-keiri/
├── .eslintrc / eslint.config.js  # eslint-config-expo ベース
├── .prettierrc
└── src/**/__tests__/             # 各機能の隣にテストをコロケーション
```

- 型は `tsc --noEmit` で CI チェック。lint は `eslint-config-expo`。
- テストは MVP では **CSVフォーマッタ(`features/export/formatters/`)** と **プラン判定(`config/plans.ts`)** を優先的にカバー(壊れると課金・出力に直結するため)。

## 6. この構成のメリット(保守の観点)

- **修正の起点が予測可能**:「出力がおかしい」→ `features/export/` を見ればよい。
- **削除も安全**:機能を1つ落とす時はそのフォルダごと消せる(依存が局所化)。
- **公式テンプレと整合**:SDK 55 の `src/` 標準に乗るため、Expo のアップグレード手順やドキュメントがそのまま使える。
- **AI(Claude Code)との相性**:機能フォルダ単位でコンテキストが閉じるため、変更時に読むべき範囲が明確になり、的確な実装・レビューがしやすい。
