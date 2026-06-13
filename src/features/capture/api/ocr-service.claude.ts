/**
 * Claude API による OCR 本実装(フェーズ4)
 *
 * 画像をクライアントでリサイズ・JPEG化(アップロードとAPIコストの最適化)→
 * base64 にして Supabase Edge Function `ocr-receipt` に送る。
 * Claude API キーはサーバ側のみ。クライアントは Supabase のセッショントークンで認証する。
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { env } from '@/lib/env';
import { getSupabase } from '@/lib/supabase/client';
import type { OcrExtraction } from '@/shared/types/receipt';

import type { OcrInput, OcrService } from './ocr-service';

/**
 * リサイズ後の幅。レシートは縦長が多いため幅基準で縮小する
 * (Claude Vision は長辺 1568px 超を自動縮小するので、それ以下に収めて転送量を抑える)
 */
const RESIZE_WIDTH = 1280;

async function toBase64Jpeg(imageUri: string): Promise<string> {
  const context = ImageManipulator.manipulate(imageUri);
  context.resize({ width: RESIZE_WIDTH, height: null });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    base64: true,
    compress: 0.8,
    format: SaveFormat.JPEG,
  });
  if (!saved.base64) {
    throw new Error('画像の変換に失敗しました');
  }
  return saved.base64;
}

function asConfidence(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

/** Edge Function の応答を防御的に OcrExtraction へ正規化する */
function normalizeExtraction(data: unknown): OcrExtraction {
  const raw = (data ?? {}) as Record<string, unknown>;
  const confidence = (raw.confidence ?? {}) as Record<string, unknown>;
  return {
    date: typeof raw.date === 'string' ? raw.date : null,
    amountYen: typeof raw.amountYen === 'number' ? raw.amountYen : null,
    store: typeof raw.store === 'string' ? raw.store : null,
    categoryCandidates: Array.isArray(raw.categoryCandidates)
      ? raw.categoryCandidates.filter((id): id is string => typeof id === 'string')
      : [],
    confidence: {
      date: asConfidence(confidence.date),
      amount: asConfidence(confidence.amount),
      store: asConfidence(confidence.store),
    },
  };
}

export const claudeOcrService: OcrService = {
  async extract({ imageUri }: OcrInput): Promise<OcrExtraction> {
    const supabase = getSupabase();
    if (!supabase || !env.supabase) {
      throw new Error('Supabase が未設定です(.env.local を確認してください)');
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('OCRを使うには、設定画面からサインインしてください');
    }

    const imageBase64 = await toBase64Jpeg(imageUri);

    const response = await fetch(`${env.supabase.url}/functions/v1/ocr-receipt`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: env.supabase.anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64, mediaType: 'image/jpeg' }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
      throw new Error(
        typeof body?.message === 'string'
          ? body.message
          : '読み取りに失敗しました。もう一度お試しください',
      );
    }

    return normalizeExtraction(await response.json());
  },
};
