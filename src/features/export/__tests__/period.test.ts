/** @jest-environment node */
import type { Receipt } from '@/shared/types/receipt';

import {
  filterReceiptsByPeriod,
  isValidIsoDate,
  normalizeIsoDate,
  periodBounds,
  periodLabel,
  periodTag,
} from '../period';

function receipt(date: string): Receipt {
  return {
    id: date,
    userId: 'u1',
    date,
    amountYen: 100,
    store: 's',
    category: 'misc',
    memo: {},
    imageStatus: 'deleted',
    capturedPlan: 'free',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

const RECEIPTS = [
  receipt('2025-12-31'),
  receipt('2026-01-01'),
  receipt('2026/02/15'), // スラッシュ区切りも混在しうる
  receipt('2026-02-28'),
  receipt('2026-03-01'),
];

describe('期間指定(FR-19)', () => {
  test('全期間はそのまま返す', () => {
    expect(filterReceiptsByPeriod(RECEIPTS, { kind: 'all' })).toHaveLength(5);
  });

  test('年で絞る', () => {
    const r = filterReceiptsByPeriod(RECEIPTS, { kind: 'year', year: 2026 });
    expect(r.map((x) => x.date)).toEqual(['2026-01-01', '2026/02/15', '2026-02-28', '2026-03-01']);
  });

  test('月で絞る(月末日・スラッシュ日付も含む)', () => {
    const r = filterReceiptsByPeriod(RECEIPTS, { kind: 'month', year: 2026, month: 2 });
    expect(r.map((x) => x.date)).toEqual(['2026/02/15', '2026-02-28']);
    expect(periodBounds({ kind: 'month', year: 2024, month: 2 })).toEqual({
      from: '2024-02-01',
      to: '2024-02-29',
    });
  });

  test('任意範囲で絞る(両端を含む)', () => {
    const r = filterReceiptsByPeriod(RECEIPTS, {
      kind: 'range',
      from: '2025/12/31',
      to: '2026-01-01',
    });
    expect(r.map((x) => x.date)).toEqual(['2025-12-31', '2026-01-01']);
  });

  test('日付の正規化と妥当性', () => {
    expect(normalizeIsoDate('2026/5/1')).toBe('2026-05-01');
    expect(isValidIsoDate('2026-02-29')).toBe(false);
    expect(isValidIsoDate('2024-02-29')).toBe(true);
    expect(isValidIsoDate('abc')).toBe(false);
  });

  test('ラベルとファイル名タグ', () => {
    expect(periodLabel({ kind: 'month', year: 2026, month: 5 })).toBe('2026年5月');
    expect(periodTag({ kind: 'month', year: 2026, month: 5 })).toBe('2026-05');
    expect(periodTag({ kind: 'range', from: '2026/01/01', to: '2026/03/31' })).toBe(
      '2026-01-01_2026-03-31',
    );
    expect(periodTag({ kind: 'all' })).toBeUndefined();
  });
});
