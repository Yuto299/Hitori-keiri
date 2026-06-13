# OCR 本実装(Claude API)

> 関連: 要件 [第6章 OCR / AI学習](../requirements/06-ocr-ai.md) / [tech-stack.md](./tech-stack.md)
> ステータス: **実装済み(コード側完了)**。残りはオーナー作業のみ(下記 §2.1)
> 最終更新: 2026-06-13

## 実装済みの内容(2026-06-13)

| 部品 | ファイル | 内容 |
|---|---|---|
| Edge Function | [supabase/functions/ocr-receipt/index.ts](../../supabase/functions/ocr-receipt/index.ts) | JWT認証 → 枚数上限チェック(FR-22・サーバ側が正)→ Claude API(Vision + Structured Outputs)→ OcrExtraction を返す |
| クライアント | [src/features/capture/api/ocr-service.claude.ts](../../src/features/capture/api/ocr-service.claude.ts) | expo-image-manipulator で幅1280px・JPEG(0.8)に縮小 → base64 → Edge Function を fetch |
| 切替 | [src/features/capture/api/index.ts](../../src/features/capture/api/index.ts) | Supabase 設定済みなら Claude、未設定 or `EXPO_PUBLIC_OCR_MOCK=1` ならモック |
| モデル | 既定 `claude-haiku-4-5`(コスト優先・第6章 6.3.3) | `supabase secrets set OCR_MODEL=...` で差し替え可能(再デプロイ不要) |

### 2.1 オーナーがやること(これだけで動く)

```bash
# 0. Supabase CLI(未インストールの場合)とプロジェクト紐づけ
brew install supabase/tap/supabase
supabase login                      # ブラウザで認証
supabase link --project-ref <ref>   # ref はダッシュボードURLの英数字部分

# 1. console.anthropic.com で API キー発行 + プリペイド入金(課金)

# 2. シークレット設定とデプロイ(プロジェクトルートで)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy ocr-receipt

# 3. アプリでサインインして撮影 → 実レシートで精度・コストを確認(§7)
```

注意: OCR は認証必須(枚数カウントをユーザーに紐づけるため)。未サインインだと
「OCRを使うには、設定画面からサインインしてください」と案内される。

---

## 0. ゴール

レシート画像から **日付・金額・店名・勘定科目候補** を Claude API で自動抽出し、確認画面(S-03)に初期値として渡す。現状の `mockOcrService` を本物に差し替える。

## 1. 全体フロー(再掲)

```
[アプリ] 撮影/取込(expo-image-picker)
   │ クライアントで画像リサイズ(長辺1568px相当)
   ▼
[アプリ] Supabase Edge Function を fetch
   │ Authorization: Bearer <Supabase session token>
   │ body: { imageBase64 }
   ▼
[Edge Function: ocr-receipt]
   │ Claude API(Vision + Structured Outputs)を呼び出し
   │ ANTHROPIC_API_KEY はサーバ環境変数(クライアントに置かない)
   │ レート制御・枚数カウント(FR-22)もここで実施
   ▼
[アプリ] OcrExtraction を受け取り、確認画面(S-03)へ
```

要点:
- **APIキーをクライアントに置かない**(第7章セキュリティ)
- **枚数カウントはサーバ側を正**(クライアント改ざん防止 / FR-22)
- 失敗は UI を止めず、空欄で確認画面に進めばユーザーが手入力できる

## 2. オーナーが必要な準備(着手前確認)

| 準備 | 内容 | 課金 |
|---|---|---|
| Anthropic アカウント作成 | console.anthropic.com で登録 | 無料 |
| API キー発行 | Console で発行・コピー | キー自体は無料 |
| 課金設定 | 従量課金(プリペイドが基本) | **発生する**(レシート1枚 ¥0.3〜0.8 想定) |
| Supabase Edge Function 有効化 | ダッシュボード → Edge Functions | 無料枠あり |

⚠ 課金が絡む。**API キー取得・プリペイド入金は私からはやらない**。オーナー作業。

## 3. Edge Function の実装(`supabase/functions/ocr-receipt/`)

枠は既に作ってある(空)。実装イメージ:

```typescript
// supabase/functions/ocr-receipt/index.ts
import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

serve(async (req) => {
  // 認証チェック(Supabase JWT)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // 枚数カウント(FR-22)— 今月の枚数を取得しプラン上限をチェック
  // ... (略)

  // Claude API 呼び出し
  const { imageBase64 } = await req.json();
  const result = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001', // コスト優先で開始(第6章 6.3.3)
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: PROMPT_TEMPLATE },
      ],
    }],
    // Structured Outputs(2025-11-13 beta)で JSON 強制
    // headers: { 'anthropic-beta': 'structured-outputs-2025-11-13' }
  });

  return new Response(JSON.stringify(parseExtraction(result)), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 環境変数(Edge Function 側)

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

クライアント(`.env.local`)には絶対に置かない。

## 4. 抽出スキーマ(再掲・第6章 6.3.2)

```json
{
  "date": "YYYY-MM-DD | null",
  "amount_yen": "integer | null",
  "store": "string | null",
  "category_candidates": ["category_id", "..."],
  "confidence": { "date": 0.0, "amount": 0.0, "store": 0.0 }
}
```

- `category_candidates`: [constants/categories.ts](../../src/constants/categories.ts) のIDを確度順に最大3件
- `confidence`: 0〜1 のスコア。0.8 未満は確認画面で「要確認」表示([review-screen.tsx](../../src/features/receipt-review/components/review-screen.tsx))

## 5. プロンプト(案)

```
このレシート画像から経費記録に必要な情報を抽出してください。

抽出項目:
- date: 利用日(YYYY-MM-DD形式)。和暦は西暦に変換
- amount_yen: 税込合計(整数の円)。お預り・お釣り・小計と取り違えないこと
- store: 店名(加盟店名)
- category_candidates: 勘定科目の候補(以下のIDから確度順に最大3件)
  consumables/supplies/travel/entertainment/meeting/communication/
  utilities/outsourcing/advertising/books/rent/misc
- confidence: 各項目の確度(0〜1)

不明な項目は null を返す。
```

## 6. クライアント側の差し替え

`src/features/capture/api/index.ts` の `getOcrService()` を、モック → Claude API 呼び出しに差し替える。

```typescript
// 現状(モック)
import { mockOcrService } from './ocr-service.mock';
export function getOcrService(): OcrService {
  return mockOcrService;
}

// 本実装後
import { claudeOcrService } from './ocr-service.claude';
import { mockOcrService } from './ocr-service.mock';
import { isSupabaseConfigured } from '@/lib/env';

export function getOcrService(): OcrService {
  // Supabase 未設定(ローカル開発)では引き続きモック
  return isSupabaseConfigured() ? claudeOcrService : mockOcrService;
}
```

`claudeOcrService` は Edge Function を fetch するだけ。画像のリサイズはここで行う(Claudeのコスト最適化)。

## 7. コスト試算手順(第8章の実測更新)

実装後にやること:
1. **実レシート10枚** で抽出を実行し、Anthropic Console の Usage で**実消費トークン**を確認
2. **1枚あたりの実コスト**を算出(モデル別:Haiku / Sonnet / Opus)
3. 第8章 8.2 の前提値(¥0.8/枚)を実値で更新
4. プラン別月間コストを再計算し、必要なら価格設定を見直す

## 8. 段階的な実装順序

1. Edge Function を `supabase/functions/ocr-receipt/` に実装
2. `supabase functions deploy ocr-receipt`(オーナー作業)
3. `ANTHROPIC_API_KEY` を Supabase secrets に設定
4. クライアント側 `claudeOcrService` 実装 + ファクトリ差し替え
5. 開発環境で実画像テスト → 精度・速度・コスト確認
6. confidence の閾値調整(0.8 → 適正値)
7. 第8章のコスト前提を実測で更新

## 9. 残課題

- **オンデバイスOCR併用**(将来):軽い OCR を端末で先に走らせ、不確実な時だけ Claude へ(コスト削減)。MVP は全件Claudeで割り切り(第6章 章末確定事項)
- **画像保存ポリシー(FR-12)との連動**: Free は OCR 完了後ただちに Storage から削除、Light は30日後、Pro は無期限
- **失敗時のリトライ**: 一時的なAPI障害でユーザーの撮影を無駄にしないため、ネット復帰後の再試行キュー(フェーズ8オフラインキューと統合)
