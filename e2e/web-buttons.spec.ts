/**
 * ボタン・ナビゲーション総点検E2E
 *
 * 「押せるUIはすべて押して、期待どおりの結果になるか」を画面ごとに検証する。
 * とくに Web 固有の落とし穴を重点的に:
 * - 履歴がない状態(URL直叩き・リロード)での 閉じる/戻る
 * - ダイアログ(Web は window.alert / window.confirm)が実際に出ること
 */

import { expect, test, type Page } from '@playwright/test';

async function gotoHome(page: Page) {
  await page.goto('/');
  await expect(page.getByText('こんにちは、ゆうとさん')).toBeVisible({ timeout: 90_000 });
}

/** カメラ撮影フローで金額 amount のレシートを1件保存し、一覧まで進む */
async function addReceipt(page: Page, amount: string) {
  await page.getByText('レシートを撮る').click();
  const shutter = page.getByLabel('撮影する');
  await expect(shutter).not.toHaveAttribute('aria-disabled', 'true');
  await shutter.click();
  await expect(page.getByText('内容を確認')).toBeVisible();
  await page.getByPlaceholder('1280').fill(amount);
  await page.getByText('承認して保存').click();
  await expect(page.getByText('レシート一覧')).toBeVisible();
}

test('ナビ: 撮影の閉じる・確認の戻る・ホームのリンクが機能する', async ({ page }) => {
  await gotoHome(page);

  // 撮影 → ❌(閉じる)でホームへ戻れる
  await page.getByText('レシートを撮る').click();
  await expect(page.getByText('レシートを撮影')).toBeVisible();
  await page.getByLabel('閉じる').click();
  await expect(page.getByText('こんにちは、ゆうとさん')).toBeVisible();

  // 撮影 → 確認画面 → 戻る で撮影画面に戻れる
  await page.getByText('レシートを撮る').click();
  const shutter = page.getByLabel('撮影する');
  await expect(shutter).not.toHaveAttribute('aria-disabled', 'true');
  await shutter.click();
  await expect(page.getByText('内容を確認')).toBeVisible();
  await page.getByLabel('戻る').click();
  await expect(page.getByText('レシートを撮影')).toBeVisible();
  await page.getByLabel('閉じる').click();

  // ホームの「すべて見る」→ 一覧、「設定を開く」→ 設定
  await page.getByText('すべて見る').click();
  await expect(page.getByText('レシート一覧')).toBeVisible();
  await page.getByRole('link', { name: 'ホーム' }).click();
  // 一覧画面にも同名ボタンがある(非アクティブタブはDOMに残る)ため可視のみ
  await page.getByLabel('設定を開く').filter({ visible: true }).click();
  await expect(page.getByText('ご利用中のプラン')).toBeVisible();
});

test('ナビ: /capture 直接アクセス(履歴なし)でも ❌ で詰まらない', async ({ page }) => {
  await page.goto('/capture');
  await expect(page.getByText('レシートを撮影')).toBeVisible({ timeout: 90_000 });
  await page.getByLabel('閉じる').click();
  await expect(page.getByText('こんにちは、ゆうとさん')).toBeVisible();
});

test('詳細: 行タップ→詳細→戻る→削除(確認ダイアログ)が機能する', async ({ page }) => {
  await gotoHome(page);
  await addReceipt(page, '2222');

  // 行タップで詳細へ
  await page.getByText('¥2,222').filter({ visible: true }).click();
  await expect(page.getByText('レシート詳細')).toBeVisible();

  // 戻る → 一覧
  await page.getByLabel('戻る').click();
  await expect(page.getByText('レシート一覧')).toBeVisible();

  // もう一度開いて削除。confirm ダイアログが「実際に出る」ことを検証して承諾
  await page.getByText('¥2,222').filter({ visible: true }).click();
  await expect(page.getByText('レシート詳細')).toBeVisible();
  let confirmMessage = '';
  page.once('dialog', (dialog) => {
    confirmMessage = dialog.message();
    dialog.accept();
  });
  await page.getByText('削除', { exact: true }).click();
  await expect(page.getByText('レシート一覧')).toBeVisible();
  expect(confirmMessage).toContain('削除');
  await expect(page.getByText('¥2,222').filter({ visible: true })).toHaveCount(0);
});

test('課金壁: Freeで各社形式を選ぶと案内ダイアログが出て出力されない', async ({ page }) => {
  await gotoHome(page);
  await addReceipt(page, '3333');

  await page.getByRole('link', { name: '出力' }).click();
  await expect(page.getByText(/対象: 1 件/)).toBeVisible();

  // freee形式(Light以上)を選択して書き出し → 課金壁の案内
  await page.getByText('freee形式CSV').click();
  let alertMessage = '';
  page.once('dialog', (dialog) => {
    alertMessage = dialog.message();
    dialog.accept();
  });
  await page.getByText('CSVを書き出す', { exact: true }).last().click();
  expect(alertMessage).toContain('Light 以上');
  // 完了画面には進まない
  await expect(page.getByText(/書き出しが完了しました/)).toHaveCount(0);
});

test('一覧: 検索ボックスで絞り込める', async ({ page }) => {
  await gotoHome(page);
  await page.getByRole('link', { name: 'レシート' }).click();
  await expect(page.getByText('レシート一覧')).toBeVisible();
  await expect(page.getByText('スターバックス').filter({ visible: true })).toBeVisible();

  await page.getByPlaceholder('日付・店名・金額で検索').fill('スター');
  await expect(page.getByText('スターバックス').filter({ visible: true })).toBeVisible();
  await expect(page.getByText('Amazon.co.jp').filter({ visible: true })).toHaveCount(0);
});

test('設定: サインインフォームの開閉・モード切替・プランチップ', async ({ page }) => {
  await gotoHome(page);
  await page.getByRole('link', { name: '設定' }).click();
  await expect(page.getByText('ご利用中のプラン')).toBeVisible();

  // サインインフォームを開く
  await page.getByText('サインイン', { exact: true }).click();
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible();

  // サインアップモードへ切替
  await page.getByText('アカウントをお持ちでない方はこちら').click();
  await expect(page.getByText('アカウント作成', { exact: true }).first()).toBeVisible();

  // ✕ で閉じる
  await page.getByText('✕').click();
  await expect(page.getByPlaceholder('you@example.com')).toHaveCount(0);

  // プランチップ: Pro に切替
  await page.getByText('Pro', { exact: true }).click();
  await expect(page.getByText('Proプラン')).toBeVisible();
});
