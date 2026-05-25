/**
 * OCRサービスの抽象インターフェース
 *
 * レシート画像から構造化データ(OcrExtraction)を得る処理を抽象化する。
 * - MVP本実装(フェーズ4): Claude API(Supabase Edge Function 経由)
 * - 現在(フェーズ2): モック実装で UI/フローを先に通す
 *
 * 差し替えは getOcrService() の戻り値を変えるだけ。呼び出し側は実装を意識しない。
 */

import type { OcrExtraction } from '@/shared/types/receipt';

export interface OcrInput {
  /** 画像のローカルURI(camera/picker が返すもの) */
  imageUri: string;
}

export interface OcrService {
  extract(input: OcrInput): Promise<OcrExtraction>;
}
