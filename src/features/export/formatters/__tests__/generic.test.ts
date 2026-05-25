/** @jest-environment node */
import type { Receipt } from '@/shared/types/receipt';

import { genericFormatter } from '../generic';

function makeReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: 'r1',
    userId: 'u1',
    date: '2026-05-25',
    amountYen: 1280,
    store: 'スターバックス',
    category: 'meeting',
    memo: {},
    imageStatus: 'stored',
    capturedPlan: 'light',
    createdAt: '2026-05-25T10:00:00Z',
    updatedAt: '2026-05-25T10:00:00Z',
    ...overrides,
  };
}

describe('genericFormatter(汎用CSV FR-15)', () => {
  test('ヘッダ行 + データ行を出力する(CRLF・日付はYYYY/MM/DD)', () => {
    const csv = genericFormatter.format([makeReceipt()]);
    const [header, row] = csv.split('\r\n');
    expect(header).toBe('日付,金額,店名,勘定科目,メモ,同席者,目的,案件名');
    // 日付は YYYY/MM/DD、科目はIDではなく名前(会議費)
    expect(row).toBe('2026/05/25,1280,スターバックス,会議費,,,,');
  });

  test('カンマ・改行・引用符を含む値をエスケープする(第5章 5.5.1)', () => {
    const csv = genericFormatter.format([
      makeReceipt({
        store: '店, 名',
        memo: { note: '改行\nと"引用符"' },
      }),
    ]);
    const row = csv.split('\r\n').slice(1).join('\r\n');
    expect(row).toContain('"店, 名"');
    expect(row).toContain('"改行\nと""引用符"""');
  });

  test('ファイル名は年つき/なしを切り替える', () => {
    expect(genericFormatter.fileName({ year: 2025 })).toBe(
      '2025_receipts_generic.csv',
    );
    expect(genericFormatter.fileName({})).toBe('receipts_generic.csv');
  });
});
