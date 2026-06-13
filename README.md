# ひとり経理(Hitori Keiri)

> **ひとりで経理をやる人を、ひとりにしない**
>
> レシートを撮るだけ。確定申告前の絶望を、3タップで終わらせる。

個人事業主・副業従事者向けの「撮るだけ経理」モバイルアプリ。レシートをスマホで撮影すると OCR が日付・金額・店名・勘定科目候補を抽出し、確定申告期に freee / マネーフォワード / 弥生 形式の CSV を書き出せる。**会計ソフトには接続せず、出口は CSV のみ**に絞ることで、開発スコープを最小化しつつ「会計ソフトを使っていない層」まで顧客にする。

## 概要

| 項目 | 内容 |
|---|---|
| プラットフォーム | iOS / Android(Expo + React Native) |
| コアバリュー | 3タップで完結する「撮る→確認→出力」体験 |
| 料金プラン | Free(¥0) / Light(¥480・月) / Pro(¥780・月) |
| ターゲット | 個人事業主・副業フリーランス(MVPは法人対象外) |
| 開発制約 | 開発者1名 / MVPは約1ヶ月 |

## ドキュメント

- **[要件定義書(全8章・確定 v1.0)](./docs/requirements/README.md)**
- **[開発ドキュメント](./docs/development/README.md)** — [技術スタック](./docs/development/tech-stack.md) / [フォルダ構成](./docs/development/folder-structure.md) / [実装ロードマップ](./docs/development/roadmap.md)
- **[デザイン資産](./docs/design/README.md)** — 確定UIモック
- 開発規約は [AGENTS.md](./AGENTS.md)(= CLAUDE.md が参照)

## 動かし方

```bash
npm install
cp .env.example .env.local   # Supabase の URL / anon key を記入(無くてもローカル限定で動く)
npm run web
```

`npm run web` は Expo の開発サーバを起動し、ブラウザを開く。URL はターミナルに表示されたものを使う。
多くの場合は `http://localhost:8081` だが、ポートが埋まっている場合は別ポートになる。

Chromeで開きたい場合:

```bash
BROWSER="Google Chrome" npm run web
```

うまく開かない場合:

```bash
npm start
# 起動後、ターミナルで w を押して Web を開く
```

それでも `8081` が使用中と出る場合は、既存の Expo/Node プロセスを止めてから再実行する。

静的ビルドでUIだけ確認する場合:

```bash
npx expo export --platform web --clear
npx expo serve dist
```

`python3 -m http.server` などの素の静的サーバでは `/explore` などのExpo Routerパスが404になることがあるため、`npx expo serve dist` を使う。

iOS/Android 実機は Development Build が必要(SDK 55 は Expo Go 非対応)。

## テスト

```bash
npm run typecheck   # TypeScript 型チェック
npm run lint        # ESLint
npm test            # ロジック単体テスト(jest)
npm run test:e2e    # Playwright E2E(Webサーバ自動起動・OCRモック・フェイクカメラ)
```

E2E はカメラ撮影 → OCR → 確認 → 保存 → 一覧 → CSVダウンロード → 設定の全フローと、
全画面のボタン・ダイアログを実ブラウザで検証する。

## ステータス

要件定義 v1.0 完了。**フェーズ4(OCR本実装)までコード側完了**。
Webで「カメラ撮影→確認→保存→一覧→CSV出力」のコアフローが動作。認証・同期(Supabase)実装済み。

実OCRを有効化するにはオーナー作業が1回だけ必要(Anthropic APIキー):
→ [ocr-implementation.md §2.1](./docs/development/ocr-implementation.md)

残りのタスクは **[やることリスト](./docs/development/todo.md)** に集約(オーナー作業/残実装/ストア準備)。経緯は[ロードマップ](./docs/development/roadmap.md)。

---

🤖 [Claude Code](https://claude.com/claude-code) を使用
