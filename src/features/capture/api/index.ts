/**
 * OCRサービスの選択ポイント
 *
 * 本番: Claude API(Edge Function 経由)。
 * Supabase 未設定のローカル開発、または EXPO_PUBLIC_OCR_MOCK=1 のときはモック。
 * 呼び出し側は getOcrService() だけ使う(実装を意識しない)。
 */

import { env, isSupabaseConfigured } from '@/lib/env';

import { claudeOcrService } from './ocr-service.claude';
import { mockOcrService } from './ocr-service.mock';
import type { OcrService } from './ocr-service';

export type { OcrService, OcrInput } from './ocr-service';

export function getOcrService(): OcrService {
  if (env.ocrMock || !isSupabaseConfigured()) {
    return mockOcrService;
  }
  return claudeOcrService;
}
