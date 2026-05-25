# ひとり経理(Hitori Keiri)要件定義書

- バージョン: 0.10 (Draft)
- 最終更新: 2026-05-26
- ステータス: 第1〜4章確定 / 第5〜8章ドラフト(全8章そろい)

本要件定義書は章ごとにファイルを分割している。各章の最新ステータスは下表を参照。

## 目次

| 章 | タイトル | ステータス | ファイル |
|---|---|---|---|
| 1 | プロダクト概要 | 確定 | [01-product-overview.md](./01-product-overview.md) |
| 2 | ターゲットユーザー(ペルソナ) | 確定 | [02-personas.md](./02-personas.md) |
| 3 | 機能要件 / ユーザーストーリー | 確定 | [03-functional-requirements.md](./03-functional-requirements.md) |
| 4 | 画面設計 / UXフロー | 確定 | [04-screen-design.md](./04-screen-design.md) |
| 5 | データモデル / CSV仕様 | ドラフト | [05-data-model-csv.md](./05-data-model-csv.md) |
| 6 | OCR / AI学習の技術方針 | ドラフト | [06-ocr-ai.md](./06-ocr-ai.md) |
| 7 | 非機能要件(性能・セキュリティ・プライバシー) | ドラフト | [07-non-functional.md](./07-non-functional.md) |
| 8 | 収支シミュレーション | ドラフト | [08-financials.md](./08-financials.md) |

## 章構成の方針

- 1ファイル=1章。ファイル名は `NN-英語スラッグ.md`(章番号ゼロ埋め2桁)。
- 章をまたぐ参照は相対リンクで張る(例:第2章から第1章の節へ)。
- 各章の末尾に「確認事項/確定事項」を置き、レビューの状態を可視化する。

## 関連ドキュメント

- 開発まわり(技術スタック・フォルダ構成)は [docs/development](../development/) を参照。
- 確定UIモック等のデザイン資産は [docs/design](../design/README.md) を参照。

※章立ては確定ではなく、執筆の進行に応じて調整する。
