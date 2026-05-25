/**
 * OCRサービスの選択ポイント
 *
 * 現在(フェーズ2)はモックを返す。フェーズ4で Claude API 実装
 * (Edge Function 呼び出し)に差し替える。呼び出し側は getOcrService() だけ使う。
 */

import { mockOcrService } from './ocr-service.mock';
import type { OcrService } from './ocr-service';

export type { OcrService, OcrInput } from './ocr-service';

export function getOcrService(): OcrService {
  // TODO(フェーズ4): 本番は Claude API 実装に差し替え
  return mockOcrService;
}
