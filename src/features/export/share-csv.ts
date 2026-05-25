/**
 * 生成したCSVを共有/保存する(ネイティブ実装)
 *
 * SDK 55 の新 File API でキャッシュに一時ファイルを書き、OS の共有シートを開く。
 * 税理士へメール添付・クラウド保存など(第4章 S-06 / US-10)。
 * Web は share-csv.web.ts(ブラウザダウンロード)。
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function shareCsv(fileName: string, content: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  // 既存があれば作り直す
  try {
    if (file.exists) file.delete();
  } catch {
    // ignore
  }
  file.create();
  // UTF-8 BOM 付き(第5章 5.5.1。Excel等の文字化け回避)
  file.write(`﻿${content}`);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
    });
  }
}
