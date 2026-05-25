# 第5章 データモデル / CSV仕様

> 親ドキュメント: [要件定義書インデックス](./README.md)
> ステータス: **確定**(CSV列定義のみ実装着手時に最終確定)

---

## 5.1 本章の方針

[第3章](./03-functional-requirements.md)の機能要件と[第4章](./04-screen-design.md)の画面で扱うデータを、**エンティティ(データモデル)**と**CSV出力仕様**として定義する。

- 論理モデルを示す(物理スキーマ=Supabase/SQLiteのDDLは実装時に確定)。
- CSV仕様は「MVPで保証する必須項目」を定義する。各会計ソフトのインポート仕様は更新されうるため、**正確な列順・ヘッダ文字列は実装時に各社の最新仕様で最終確定**する(本章はMVPの土台)。

## 5.2 エンティティ一覧

| エンティティ | 役割 | 主な参照元 |
|---|---|---|
| User | アカウント(認証) | FR-25 |
| Subscription | 現在のプラン・課金状態 | FR-20〜22 |
| Receipt | レシート1件(中核エンティティ) | FR-04〜14 |
| ReceiptMemo | レシートの任意メモ(Receiptに内包) | FR-09 |
| Category | 勘定科目マスタ | FR-05 |
| CategoryLearning | 店名→科目の採用履歴(Pro) | FR-06 |
| ExportJob | CSV出力の記録(任意) | FR-15〜19 |

## 5.3 各エンティティの定義

### 5.3.1 User
| フィールド | 型 | 説明 |
|---|---|---|
| id | uuid | Supabase Auth の user id |
| email | string? | メール認証時 |
| auth_provider | enum | `apple` / `google` / `email` |
| created_at | datetime | |

> 認証は Supabase Auth が管理。アプリ側は user id を外部キーとして参照する。

### 5.3.2 Subscription
| フィールド | 型 | 説明 |
|---|---|---|
| user_id | uuid (FK) | |
| plan | enum | `free` / `light` / `pro` |
| billing_cycle | enum? | `monthly` / `yearly`(有料時) |
| status | enum | `active` / `expired` / `in_grace` |
| current_period_end | datetime? | 期限(購入復元・失効判定) |
| store | enum? | `app_store` / `play_store` |

- 枚数上限・機能ゲートは `plan` から導出([第1章 1.7.2](./01-product-overview.md#172-機能比較))。判定ロジックは実装側で集中管理する。

### 5.3.3 Receipt(中核)
| フィールド | 型 | 説明 |
|---|---|---|
| id | uuid | |
| user_id | uuid (FK) | |
| date | date | 利用日(YYYY-MM-DD) |
| amount_yen | integer | 税込合計(円, 整数) |
| store | string | 店名(加盟店名) |
| category_id | string (FK) | 確定した勘定科目 |
| memo | json | ReceiptMemo(下記) |
| image_status | enum | `stored` / `deleted` |
| image_path | string? | Storage パス(stored 時のみ) |
| captured_plan | enum | 記録時点のプラン(集計・表示用) |
| ocr_raw | json? | OCR抽出の生データ(監査・再学習用、任意保持) |
| created_at | datetime | |
| updated_at | datetime | |

- `image_status` は保存ポリシー(FR-12)で遷移する。Free=記録直後に `deleted`、Light=30日経過で `deleted`、Pro=`stored` のまま。
- 金額は**整数(円)**で持つ。小数・通貨記号は持たない(消費税の内訳はMVPでは分解しない)。

### 5.3.4 ReceiptMemo(Receipt.memo に内包)
| フィールド | 型 | 説明 |
|---|---|---|
| note | string? | 自由記述メモ |
| attendees | string? | 同席者(交際費・会議費) |
| purpose | string? | 目的・用途 |
| project | string? | プロジェクト/案件名 |

- CSV出力時、これらは摘要欄へ反映する([第1章 1.7 注2](./01-product-overview.md#172-機能比較))。

### 5.3.5 Category(勘定科目マスタ)
| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 内部ID(例: `meeting`) |
| name | string | 科目名(例: 会議費) |
| hint | string? | ユーザー向けのやさしい補足 |

- MVPは個人事業主向けの代表的な科目セットを内蔵。簿記知識不要の方針([第1章 1.5](./01-product-overview.md#15-差別化なぜ勝てるか))に沿い、UIではやさしい呼称を併記。

### 5.3.6 CategoryLearning(Pro / FR-06)
| フィールド | 型 | 説明 |
|---|---|---|
| user_id | uuid (FK) | |
| store_key | string | 正規化した店名 |
| category_id | string (FK) | 採用された科目 |
| count | integer | 採用回数 |
| updated_at | datetime | |

- 「店名 × 科目」の採用回数を記録し、次回の第一候補を決める(実装はルールベース、[第1章 1.7.4](./01-product-overview.md#174-カテゴリai学習の実装方針参考))。

### 5.3.7 ExportJob(任意)
| フィールド | 型 | 説明 |
|---|---|---|
| id | uuid | |
| user_id | uuid (FK) | |
| format | enum | `generic` / `freee` / `moneyforward` / `yayoi` |
| period | json | 出力対象期間(年/月/範囲) |
| created_at | datetime | |

- 「未出力/出力済み」タブ([第4章 S-04](./04-screen-design.md#s-04-レシート一覧fr-11-13))の判定に使えるが、MVPでは省略可。

## 5.4 エンティティ関連(概念)

```
User ──1:1── Subscription
  │
  └──1:N── Receipt ──N:1── Category
                │
                └── memo(内包: note/attendees/purpose/project)

User ──1:N── CategoryLearning ──N:1── Category   (Pro)
User ──1:N── ExportJob                          (任意)
```

## 5.5 CSV出力仕様(FR-15〜19)

### 5.5.1 共通ルール
- 文字コード:**UTF-8(BOM付き)** を基本とする(Excel/会計ソフトでの文字化け回避)。弥生など Shift_JIS 前提の形式は実装時に個別対応。
- 区切り:カンマ。値にカンマ・改行・引用符を含む場合は **ダブルクォートで囲み、内部の " は "" にエスケープ**。
- 改行:CRLF を基本(会計ソフト互換重視)。
- 日付:`YYYY/MM/DD`(会計ソフト慣習)。内部保持は `YYYY-MM-DD`、出力時に変換。
- 金額:整数(円)、桁区切りなし。
- 期間指定(FR-19):年・月・任意範囲で対象 Receipt を絞って出力。

### 5.5.2 汎用CSV(generic / 全プラン)
会計ソフトに依存しない素直な列構成。Excel運用・税理士受け渡し用。

| 列 | 内容 |
|---|---|
| 日付 | YYYY/MM/DD |
| 金額 | 整数(円) |
| 店名 | |
| 勘定科目 | 科目名 |
| メモ | note |
| 同席者 | attendees |
| 目的 | purpose |
| 案件名 | project |

### 5.5.3 会計ソフト形式(Light/Pro / FR-16〜18)
freee / マネーフォワード / 弥生 の各インポート仕様に合わせる。**最小限、各社が「取込に必要とする必須項目」を満たす**ことをMVPの保証範囲とする。

| 形式 | 想定する必須項目(MVPの土台) | 備考 |
|---|---|---|
| freee | 発生日 / 勘定科目 / 金額(税込) / 取引先(店名) / 備考(メモ) | freee の「取引のインポート(振替伝票/取引)」形式に合わせる |
| マネーフォワード | 取引日 / 内容(店名) / 金額 / 勘定科目 / 備考 | MFクラウド会計の仕訳/家計簿インポート形式 |
| 弥生 | 取引日付 / 借方勘定科目 / 借方金額 / 摘要 | 弥生の「仕訳データ取込(汎用形式)」に合わせる。文字コードは要検証 |

> 注:上記の列名・列順・必須/任意の区分は各社の仕様更新で変わりうる。**実装着手時に各社の最新インポート仕様書を確認し、正式な列定義を確定**する。本章はMVPが満たすべき「最低限の意味的項目」を固定するもの。

### 5.5.4 摘要(備考)欄へのメモ反映
会計ソフト形式では摘要/備考は1列のことが多いため、メモ各項目を結合して1セルにまとめる。結合フォーマット案:

```
目的 / 同席者: ○○ / 案件: △△ / (自由メモ)
```

- 空の項目はスキップ。結合順・区切り文字は実装時に微調整。交際費の同席者は税務上重要なため、存在すれば必ず含める。

## 5.6 画像とストレージ(FR-12 との整合)
- 画像は Supabase Storage に保存(stored 時)。`image_path` で参照。
- Free:OCR完了 → `image_status = deleted` に更新し、Storage の実体を削除。
- Light:30日経過のバッチ(またはアクセス時判定)で削除し `deleted` に更新。
- Pro:保持。
- 削除後も Receipt のテキストデータは残る(詳細画面 S-05 は「画像は削除済み」と表示)。

---

## 章末:確定事項(第5章)

1. **CSV形式の確定タイミング** → **実装着手時に各社の最新インポート仕様で列定義を最終確定**(確定)。本章は「MVPが満たすべき必須の意味的項目」を固定するに留める。仕様変更リスクを避けるための方針。
2. **消費税の扱い** → 金額は**税込合計の整数のみ保持**し、消費税内訳は分解しない(確定)。取込時の税区分は固定値で割り切る。
3. **文字コード** → 汎用/freee/マネフォは UTF-8(BOM付き)、弥生は Shift_JIS を検討(実装時に各社仕様で確認、確定)。
4. **ocr_raw の保持** → 監査・再学習用に任意保持。プライバシー上の扱いは[第7章](./07-non-functional.md#75-プライバシーレシート個人の消費データ)に従う(確定)。

第5章は確定(CSV列の最終定義のみ実装着手時)。