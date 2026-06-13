# 開発ドキュメント

ひとり経理(Hitori Keiri)の開発まわりのドキュメント。要件定義は [docs/requirements](../requirements/README.md)、デザイン資産は [docs/design](../design/README.md)。

| ドキュメント | 内容 |
|---|---|
| **[todo.md](./todo.md)** | **やることリスト(オーナー作業・残実装・ストア準備)** |
| [tech-stack.md](./tech-stack.md) | 技術スタック選定と根拠(Expo SDK 55 / Supabase / Claude API) |
| [folder-structure.md](./folder-structure.md) | feature-based のフォルダ構成と設計意図 |
| [roadmap.md](./roadmap.md) | 実装ロードマップ(フェーズ・タスク・進捗ログ) |
| [supabase-setup.md](./supabase-setup.md) | Supabase プロジェクト作成・接続の手順(オーナー作業) |
| [sync-strategy.md](./sync-strategy.md) | ローカル ↔ Supabase 同期戦略(設計) |
| [device-testing.md](./device-testing.md) | 実機テスト(iPhone/Android)の選択肢メモ |
| [ocr-implementation.md](./ocr-implementation.md) | OCR本実装(Claude API)の設計・着手前準備 |
| [social-auth-setup.md](./social-auth-setup.md) | Apple/Google サインイン追加の設計・準備 |
| [image-storage.md](./image-storage.md) | 画像 Storage 同期と保存ポリシー(FR-12)の設計 |
| [phase-7-polish.md](./phase-7-polish.md) | フェーズ7(オンボーディング/検索/連続撮影など)の設計 |

開発時の規約は、リポジトリ直下の [AGENTS.md](../../AGENTS.md)(= CLAUDE.md が参照)に集約している。
