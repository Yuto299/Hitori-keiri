/**
 * 生成したCSVを共有/保存する(Web実装)
 *
 * ブラウザでは Blob を生成して a[download] でダウンロードさせる。
 * UTF-8 BOM 付き(第5章 5.5.1)。
 */

export async function shareCsv(fileName: string, content: string): Promise<void> {
  const blob = new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
