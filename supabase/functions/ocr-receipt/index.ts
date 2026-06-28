/**
 * OCR Edge Function(フェーズ4・FR-04/05/22)
 *
 * レシート画像(base64)を受け取り、Vision + Structured Outputs で
 * 日付・金額・店名・勘定科目候補を抽出して返す。
 *
 * プロバイダーは切替式(secrets の OCR_PROVIDER で選ぶ):
 *   - 'anthropic'(既定): Claude API。キーは ANTHROPIC_API_KEY
 *   - 'openai'         : OpenAI API。 キーは OPENAI_API_KEY
 *   どちらでもクライアント側は無改修(この関数が同じ形に正規化して返す)。
 *
 * - APIキーはこの関数のシークレットのみ(クライアントに置かない)
 * - 認証必須(Supabase JWT)。枚数上限(FR-22)もサーバ側でチェックする
 * - デプロイ: `supabase functions deploy ocr-receipt`
 *   例(OpenAI): `supabase secrets set OCR_PROVIDER=openai OPENAI_API_KEY=sk-...`
 *   例(Claude): `supabase secrets set OCR_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-...`
 *
 * ※ Deno ランタイム。tsconfig / eslint の対象外(アプリ側とは別世界)。
 */

import Anthropic from 'npm:@anthropic-ai/sdk';
import OpenAI from 'npm:openai';
import { createClient } from 'npm:@supabase/supabase-js@2';

type Provider = 'anthropic' | 'openai';

const PROVIDER = ((Deno.env.get('OCR_PROVIDER') ?? 'anthropic').toLowerCase()) as Provider;

/** プロバイダー別の既定モデル。OCR_MODEL を設定すればそちらが優先される */
const DEFAULT_MODEL: Record<Provider, string> = {
  anthropic: 'claude-haiku-4-5', // コスト優先(第6章 6.3.3)
  openai: 'gpt-4o-mini', // コスト優先。精度優先なら gpt-4o
};
const MODEL = Deno.env.get('OCR_MODEL') ?? DEFAULT_MODEL[PROVIDER];

/** src/constants/categories.ts と同期すること */
const CATEGORY_IDS = [
  'consumables',
  'supplies',
  'travel',
  'entertainment',
  'meeting',
  'communication',
  'utilities',
  'outsourcing',
  'advertising',
  'books',
  'rent',
  'misc',
];

/** src/config/plans.ts の monthlyReceiptLimit と同期すること(null = 無制限) */
const MONTHLY_LIMITS: Record<string, number | null> = {
  free: 5,
  light: 30,
  pro: null,
};

/** 抽出結果の生形(プロバイダー共通) */
interface RawExtraction {
  date: string | null;
  amount_yen: number | null;
  store: string | null;
  category_candidates: string[];
  confidence: { date: number; amount: number; store: number };
}

/** confidence オブジェクトの共通スキーマ片 */
const CONFIDENCE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['date', 'amount', 'store'],
  properties: {
    date: { type: 'number' },
    amount: { type: 'number' },
    store: { type: 'number' },
  },
};

/** Anthropic 用スキーマ(nullable は anyOf) */
const ANTHROPIC_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['date', 'amount_yen', 'store', 'category_candidates', 'confidence'],
  properties: {
    date: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    amount_yen: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    store: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    category_candidates: { type: 'array', items: { type: 'string', enum: CATEGORY_IDS } },
    confidence: CONFIDENCE_SCHEMA,
  },
};

/** OpenAI strict 用スキーマ(nullable は型配列。全フィールド required・additionalProperties:false) */
const OPENAI_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['date', 'amount_yen', 'store', 'category_candidates', 'confidence'],
  properties: {
    date: { type: ['string', 'null'] },
    amount_yen: { type: ['integer', 'null'] },
    store: { type: ['string', 'null'] },
    category_candidates: { type: 'array', items: { type: 'string', enum: CATEGORY_IDS } },
    confidence: CONFIDENCE_SCHEMA,
  },
};

const PROMPT = `このレシート画像から経費記録に必要な情報を抽出してください。

抽出項目:
- date: 利用日(YYYY-MM-DD形式)。和暦は西暦に変換
- amount_yen: 税込合計(整数の円)。お預り・お釣り・小計と取り違えないこと
- store: 店名(加盟店名)
- category_candidates: 勘定科目の候補IDを確度順に最大3件
- confidence: date / amount / store それぞれの確度(0〜1)

読み取れない・判別できない項目は null を返す(推測で埋めない)。`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
/** base64 で約 9MB(元画像 ~6.7MB)まで。クライアントはリサイズ済みのはず */
const MAX_BASE64_LENGTH = 9_000_000;

class OcrError extends Error {}

/** Claude API で抽出(画像はテキストより前に置く= 公式推奨) */
async function extractWithAnthropic(
  apiKey: string,
  imageBase64: string,
  mediaType: string,
): Promise<RawExtraction> {
  const anthropic = new Anthropic({ apiKey });
  const result = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    output_config: { format: { type: 'json_schema', schema: ANTHROPIC_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  });
  if (result.stop_reason !== 'end_turn') {
    throw new OcrError(`anthropic stop_reason=${result.stop_reason}`);
  }
  const textBlock = result.content.find((b: { type: string }) => b.type === 'text');
  if (!textBlock?.text) throw new OcrError('anthropic empty content');
  return JSON.parse(textBlock.text) as RawExtraction;
}

/** OpenAI Chat Completions(Vision + Structured Outputs strict) */
async function extractWithOpenAI(
  apiKey: string,
  imageBase64: string,
  mediaType: string,
): Promise<RawExtraction> {
  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'receipt_extraction', strict: true, schema: OPENAI_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          {
            type: 'image_url',
            image_url: { url: `data:${mediaType};base64,${imageBase64}` },
          },
        ],
      },
    ],
  });
  const choice = completion.choices[0];
  if (choice?.message?.refusal) throw new OcrError(`openai refusal: ${choice.message.refusal}`);
  if (choice?.finish_reason !== 'stop') {
    throw new OcrError(`openai finish_reason=${choice?.finish_reason}`);
  }
  const text = choice.message?.content;
  if (!text) throw new OcrError('openai empty content');
  return JSON.parse(text) as RawExtraction;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  const apiKey = Deno.env.get(PROVIDER === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY');
  if (!apiKey) {
    const keyName = PROVIDER === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
    return jsonResponse(500, {
      error: 'not_configured',
      message: `サーバのOCR設定が未完了です(${keyName} 未設定)`,
    });
  }

  // --- 認証(Supabase JWT) ---
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse(401, { error: 'unauthorized', message: 'サインインが必要です' });
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonResponse(401, { error: 'unauthorized', message: 'サインインが必要です' });
  }

  // --- 枚数上限チェック(FR-22。サーバ側を正とする) ---
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .maybeSingle();
  const plan = subscription?.plan ?? 'free';
  const limit = MONTHLY_LIMITS[plan] ?? MONTHLY_LIMITS.free;
  if (limit !== null) {
    const yearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    // date は 'YYYY-MM-DD' と 'YYYY/MM/DD' が混在しうるため両方でマッチ
    const { count } = await supabase
      .from('receipts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .or(`date.like.${yearMonth}-%,date.like.${yearMonth.replace('-', '/')}/%`);
    if ((count ?? 0) >= limit) {
      return jsonResponse(403, {
        error: 'monthly_limit',
        message: `今月の上限(${limit}枚)に達しました。アップグレードで増やせます`,
      });
    }
  }

  // --- 入力検証 ---
  let imageBase64: string;
  let mediaType: string;
  try {
    const body = await req.json();
    imageBase64 = body.imageBase64;
    mediaType = body.mediaType ?? 'image/jpeg';
  } catch {
    return jsonResponse(400, { error: 'invalid_body' });
  }
  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    return jsonResponse(400, { error: 'invalid_image' });
  }
  if (imageBase64.length > MAX_BASE64_LENGTH) {
    return jsonResponse(413, { error: 'image_too_large', message: '画像が大きすぎます' });
  }
  if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
    return jsonResponse(400, { error: 'invalid_media_type' });
  }

  // --- 抽出(プロバイダー切替) ---
  let raw: RawExtraction;
  try {
    raw =
      PROVIDER === 'openai'
        ? await extractWithOpenAI(apiKey, imageBase64, mediaType)
        : await extractWithAnthropic(apiKey, imageBase64, mediaType);
  } catch (e) {
    console.error(`[ocr] ${PROVIDER} error`, e);
    return jsonResponse(502, {
      error: 'ocr_failed',
      message: '読み取りに失敗しました。もう一度お試しください',
    });
  }

  // --- 応答の正規化(クライアントの OcrExtraction 形式) ---
  const confidence = raw.confidence ?? ({} as RawExtraction['confidence']);
  return jsonResponse(200, {
    date: typeof raw.date === 'string' ? raw.date : null,
    amountYen: Number.isInteger(raw.amount_yen) ? raw.amount_yen : null,
    store: typeof raw.store === 'string' ? raw.store : null,
    categoryCandidates: Array.isArray(raw.category_candidates)
      ? raw.category_candidates.filter((id) => CATEGORY_IDS.includes(id)).slice(0, 3)
      : [],
    confidence: {
      date: typeof confidence.date === 'number' ? confidence.date : 0,
      amount: typeof confidence.amount === 'number' ? confidence.amount : 0,
      store: typeof confidence.store === 'number' ? confidence.store : 0,
    },
  });
});
