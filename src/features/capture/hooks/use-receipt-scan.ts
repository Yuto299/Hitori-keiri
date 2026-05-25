/**
 * 撮影/取り込んだ画像を OCR にかけるフック
 *
 * 画像URI を受け取り、OCRサービス(現在モック)で OcrExtraction を得る。
 * 確認画面(S-03)はこの結果を初期値に編集・承認する。
 */

import { useState } from 'react';

import { getOcrService } from '@/features/capture/api';
import type { OcrExtraction } from '@/shared/types/receipt';

interface ScanState {
  loading: boolean;
  error: string | null;
  result: OcrExtraction | null;
}

export function useReceiptScan() {
  const [state, setState] = useState<ScanState>({
    loading: false,
    error: null,
    result: null,
  });

  async function scan(imageUri: string): Promise<OcrExtraction | null> {
    setState({ loading: true, error: null, result: null });
    try {
      const result = await getOcrService().extract({ imageUri });
      setState({ loading: false, error: null, result });
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : '読み取りに失敗しました';
      setState({ loading: false, error: message, result: null });
      return null;
    }
  }

  return { ...state, scan };
}
