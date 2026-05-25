/** @jest-environment node */
import type { Receipt } from '@/shared/types/receipt';

import { buildSummary } from '../csv-utils';
import { canUseFormat, FORMATTER_BY_ID, isAccountingFormat } from '../index';

function makeReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: 'r1',
    userId: 'u1',
    date: '2026-05-26',
    amountYen: 1280,
    store: 'スターバックス',
    category: 'meeting',
    memo: {},
    imageStatus: 'stored',
    capturedPlan: 'light',
    createdAt: '2026-05-26T10:00:00Z',
    updatedAt: '2026-05-26T10:00:00Z',
    ...overrides,
  };
}

describe('摘要結合(第5章 5.5.4)', () => {
  test('存在する項目だけを / で結合する', () => {
    const r = makeReceipt({
      memo: { purpose: '打合せ', attendees: '田中さん', project: 'A案件' },
    });
    expect(buildSummary(r)).toBe('打合せ / 同席者: 田中さん / 案件: A案件');
  });

  test('空メモは空文字', () => {
    expect(buildSummary(makeReceipt())).toBe('');
  });
});

describe('各社フォーマッタ', () => {
  test('freee は発生日/科目/金額/取引先/備考をこの順で出す', () => {
    const csv = FORMATTER_BY_ID.freee.format([makeReceipt()]);
    const [header, row] = csv.split('\r\n');
    expect(header).toBe('発生日,勘定科目,金額,取引先,備考');
    expect(row).toBe('2026/05/26,会議費,1280,スターバックス,');
  });

  test('マネフォは取引日/内容/金額/科目/備考', () => {
    const csv = FORMATTER_BY_ID.moneyforward.format([makeReceipt()]);
    expect(csv.split('\r\n')[0]).toBe('取引日,内容,金額,勘定科目,備考');
  });

  test('弥生は取引日付/借方勘定科目/借方金額/摘要', () => {
    const csv = FORMATTER_BY_ID.yayoi.format([makeReceipt()]);
    expect(csv.split('\r\n')[0]).toBe('取引日付,借方勘定科目,借方金額,摘要');
  });
});

describe('プラン別の出力可否(FR-16〜18)', () => {
  test('汎用は全プラン可', () => {
    expect(canUseFormat('free', 'generic')).toBe(true);
    expect(isAccountingFormat('generic')).toBe(false);
  });

  test('各社形式は Light/Pro のみ', () => {
    expect(canUseFormat('free', 'freee')).toBe(false);
    expect(canUseFormat('light', 'freee')).toBe(true);
    expect(canUseFormat('pro', 'yayoi')).toBe(true);
  });
});
