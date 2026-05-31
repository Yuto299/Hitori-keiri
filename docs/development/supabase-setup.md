# Supabase セットアップ手順

> ひとり経理(Hitori Keiri)の認証・データ同期に Supabase を使う。
> 関連: [tech-stack.md](./tech-stack.md) / 要件 [FR-25](../requirements/03-functional-requirements.md) / [非機能 7.4](../requirements/07-non-functional.md)
> 最終更新: 2026-05-26

このドキュメントは**オーナー(yuto)が手を動かす手順**と、**Claude(私)が用意済みの成果物**を1枚で見渡せるようにしている。

---

## 0. 全体の流れ

```
[1] Supabase プロジェクト作成(あなた)
        ↓ URL/anonキー取得
[2] .env.local に環境変数を設定(あなた)
        ↓
[3] マイグレーション SQL を適用(あなた・ダッシュボード or CLI)
        ↓
[4] アプリで動作確認(あなた + 私で実装)
```

私が用意するもの:
- `supabase/migrations/` 配下の SQL(receipts/subscriptions テーブル + RLS)
- 認証フック・認証画面・同期処理(コード)

---

## 1. Supabase プロジェクトを作る(あなた)

1. https://supabase.com にアクセスして無料アカウント作成(GitHub認証が早い)
2. 「New project」 → 任意の名前(例: `hitori-keiri`)、リージョンは `Northeast Asia (Tokyo)`、DB password は強めに設定して保存
3. 作成完了後、左メニュー **Project Settings → API** から以下をコピー
   - **Project URL**(`https://xxxx.supabase.co`)
   - **anon public** キー(クライアント公開可)
   - **service_role** キー(**絶対にクライアントに置かない**。Edge Function 用に保管)

> 課金について:**Free プランの範囲で始める**。Free は500MB DB / 1GB Storage / 月50,000 MAU。MVPの個人利用なら十分。アップグレードは将来必要になったら確認します(オーナー確認なしには進めません)。

## 2. 環境変数を設定(あなた)

リポジトリ直下に `.env.local` を作る(`.env.example` をコピー)。

```bash
cp .env.example .env.local
```

`.env.local` を編集し、上で取得した値を入れる:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...(anon publicキー)
```

> `.env.local` は git 管理外([.gitignore](../../.gitignore))。**service_role キーや Anthropic API キーはここに書かない**(クライアントに漏れる)。

## 3. マイグレーションを適用(あなた)

**選択肢A:ダッシュボードに貼り付け(CLI不要・お勧め)**

1. Supabase ダッシュボード → 左メニュー **SQL Editor**
2. リポジトリの [supabase/migrations/](../../supabase/migrations/) 配下のSQLを、ファイル名の若い順に開いて中身をコピー&貼り付け → `Run`
3. 完了後、**Table Editor** で `receipts` / `subscriptions` テーブルが見えれば成功

**選択肢B:supabase CLI を使う(慣れたら)**

```bash
brew install supabase/tap/supabase   # 初回のみ
supabase login                        # ブラウザでログイン
supabase link --project-ref <xxxx>    # Project URL の xxxx 部分
supabase db push                      # migrations をリモートへ
```

## 4. メール認証の有効化(あなた)

Supabase ダッシュボード → **Authentication → Providers**
- **Email** を有効化(デフォルトON)
- 開発段階では「Confirm email」を**オフ**にしておくと、確認メールなしですぐ動作確認できる(本番直前にオンに戻す)

## 5. アプリで動作確認

`npm run web` で起動 → サインアップ画面でメール+パスワード → アプリにログイン → レシートを保存して、Supabase ダッシュボードの **Table Editor → receipts** に行が見えれば同期成功。

---

## あなたが詰まったら教えてほしいこと

- どのステップで止まったか(1〜5の番号)
- エラーメッセージ(あれば)
- Supabase の画面のスクショ(可能なら)

→ 私が手順を補足します。**アカウント作成やキー入手は私には代行できないので、ここはあなたにしかできない作業**。
