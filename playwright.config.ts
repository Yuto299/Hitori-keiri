/**
 * Playwright E2E 設定(Web スモークテスト)
 *
 * `npm run test:e2e` で expo の Web 開発サーバを自動起動し、
 * コアフロー(撮影→確認→保存→一覧→CSV出力→設定)をブラウザで検証する。
 * OCR はモック固定(EXPO_PUBLIC_OCR_MOCK=1)。API コストはかからない。
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8081',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npx expo start --web --port 8081',
    url: 'http://localhost:8081',
    timeout: 240_000,
    reuseExistingServer: true,
    env: { EXPO_PUBLIC_OCR_MOCK: '1' },
  },
});
