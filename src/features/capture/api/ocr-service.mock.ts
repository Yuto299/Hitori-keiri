/**
 * OCRサービスのモック実装(フェーズ2)
 *
 * Claude API 本実装の前に、UI/保存フローを通すためのダミー。
 * それらしい抽出結果を少し遅延させて返す。確認画面(S-03)の確度ハイライトも
 * 試せるよう confidence を含める。
 */

import { CATEGORIES } from '@/constants/categories';
import type { OcrExtraction } from '@/shared/types/receipt';

import type { OcrInput, OcrService } from './ocr-service';

const SAMPLE_STORES = [
  'ファミリーマート',
  'スターバックス',
  'Amazon.co.jp',
  'セブン-イレブン',
  'JR東日本',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export const mockOcrService: OcrService = {
  async extract(_input: OcrInput): Promise<OcrExtraction> {
    // OCR待ちの体感を再現
    await new Promise((r) => setTimeout(r, 800));
    const candidates = CATEGORIES.slice(0, 3).map((c) => c.id);
    return {
      date: today(),
      amountYen: Math.floor(Math.random() * 3000) + 100,
      store: pick(SAMPLE_STORES),
      categoryCandidates: candidates,
      confidence: { date: 0.95, amount: 0.9, store: 0.7 },
    };
  },
};
