/**
 * Web スモークE2E(コアフローの動作保証)
 *
 * Web はリロードでデータが消える(インメモリDB)ため、
 * 各テストは「まっさらな状態」から始まる前提で書く。
 * OCR はモック(playwright.config.ts で EXPO_PUBLIC_OCR_MOCK=1)。
 */

import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

test('初期状態: サンプル表示が明示され、0件ではCSVを書き出せない', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('こんにちは、ゆうとさん')).toBeVisible({ timeout: 90_000 });

  // デモデータは「サンプル」と明示される
  await expect(page.getByText('サンプル').first()).toBeVisible();

  // 出力タブ: 0件では書き出せない(偽の成功を出さない)
  await page.getByRole('link', { name: '出力' }).click();
  await expect(page.getByText(/対象: 0 件/)).toBeVisible();
  await expect(page.getByText('レシートを保存すると書き出せるようになります')).toBeVisible();
});

test('カメラ撮影: ライブカメラのシャッターでOCR→確認画面に進む', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('こんにちは、ゆうとさん')).toBeVisible({ timeout: 90_000 });

  await page.getByText('レシートを撮る').click();
  await expect(page.getByText('レシートを撮影')).toBeVisible();

  // Free プランの残り枚数表示(FR-22)
  await expect(page.getByText(/今月の残り枚数:あと 5 枚/)).toBeVisible();

  // カメラ準備完了までシャッターは無効。準備でき次第撮影
  const shutter = page.getByLabel('撮影する');
  await expect(shutter).not.toHaveAttribute('aria-disabled', 'true');
  await shutter.click();

  // モックOCR → 確認画面へ
  await expect(page.getByText('内容を確認')).toBeVisible();
});

test('コアフロー: 撮影→確認→保存→一覧→CSV出力→設定', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('こんにちは、ゆうとさん')).toBeVisible({ timeout: 90_000 });

  // --- 撮影(S-02): ギャラリーから画像を選ぶ(OCRはモック) ---
  await page.getByText('レシートを撮る').click();
  await expect(page.getByText('レシートを撮影')).toBeVisible();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByLabel('ギャラリーから選択').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('e2e/fixtures/receipt.png');

  // --- 確認・編集(S-03): モックOCRの抽出結果が初期値に入る ---
  await expect(page.getByText('内容を確認')).toBeVisible();
  // 金額はモックがランダムを返すため、検証しやすい値に上書き
  const amountInput = page.getByPlaceholder('1280');
  await amountInput.fill('1234');
  await page.getByText('承認して保存').click();

  // --- 一覧(S-04): 保存したレシートが実データとして表示される ---
  await expect(page.getByText('レシート一覧')).toBeVisible();
  await expect(page.getByText('¥1,234')).toBeVisible();
  // 実データがあるのでサンプルバッジは出ない(非アクティブタブはDOMに残るため可視のみ数える)
  await expect(page.getByText('サンプル').filter({ visible: true })).toHaveCount(0);

  // --- CSV出力(S-06): 汎用CSVをダウンロードできる ---
  await page.getByRole('link', { name: '出力' }).click();
  await expect(page.getByText(/対象: 1 件/)).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByText('CSVを書き出す', { exact: true }).last().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.csv$/);

  // ダウンロードされたCSVの中身を検証(ヘッダー + 保存したレシートの金額)
  const csv = readFileSync((await download.path())!, 'utf-8');
  expect(csv).toContain('日付');
  expect(csv).toContain('勘定科目');
  expect(csv).toContain('1234');

  await expect(page.getByText(/書き出しが完了しました/)).toBeVisible();
  await page.getByText('完了', { exact: true }).click();

  // --- 設定(S-08): プラン切替(開発用)が機能する ---
  await page.getByRole('link', { name: '設定' }).click();
  await expect(page.getByText('プラン切替(開発用)')).toBeVisible();
  await page.getByText('Light', { exact: true }).click();
  await expect(page.getByText('Lightプラン')).toBeVisible();

  // --- ホーム(S-09): 保存が今月のサマリーに反映され、サンプル表示が消える ---
  await page.getByRole('link', { name: 'ホーム' }).click();
  // サマリー合計と最近のレシート行の両方に金額が出る
  await expect(page.getByText('¥1,234').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText('サンプル').filter({ visible: true })).toHaveCount(0);
});
