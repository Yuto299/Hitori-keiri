/** @jest-environment node */
import {
  canAddReceipt,
  canExportAccountingCsv,
  canSearch,
  canUseCategoryLearning,
  canUseVoiceMemo,
  remainingReceipts,
} from '@/features/billing/plan-access';

describe('機能ゲート(FR-21)', () => {
  test('対応形式CSVは Light/Pro のみ', () => {
    expect(canExportAccountingCsv('free')).toBe(false);
    expect(canExportAccountingCsv('light')).toBe(true);
    expect(canExportAccountingCsv('pro')).toBe(true);
  });

  test('検索・音声メモ・AI学習は Pro のみ', () => {
    expect(canSearch('free')).toBe(false);
    expect(canSearch('light')).toBe(false);
    expect(canSearch('pro')).toBe(true);

    expect(canUseVoiceMemo('light')).toBe(false);
    expect(canUseVoiceMemo('pro')).toBe(true);

    expect(canUseCategoryLearning('light')).toBe(false);
    expect(canUseCategoryLearning('pro')).toBe(true);
  });
});

describe('枚数管理(FR-22)', () => {
  test('Free は月5枚、残り枚数を返す', () => {
    expect(remainingReceipts('free', 0)).toBe(5);
    expect(remainingReceipts('free', 5)).toBe(0);
    expect(remainingReceipts('free', 7)).toBe(0); // マイナスにならない
  });

  test('Light は月30枚', () => {
    expect(remainingReceipts('light', 10)).toBe(20);
  });

  test('Pro は無制限(null)', () => {
    expect(remainingReceipts('pro', 999)).toBeNull();
  });

  test('上限到達で追加不可、無制限は常に追加可', () => {
    expect(canAddReceipt('free', 5)).toBe(false);
    expect(canAddReceipt('free', 4)).toBe(true);
    expect(canAddReceipt('light', 30)).toBe(false);
    expect(canAddReceipt('pro', 100000)).toBe(true);
  });
});
