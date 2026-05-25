/**
 * 汎用CSVフォーマッタ(FR-15・全プラン)
 *
 * 会計ソフトに依存しない素直な列構成。Excel運用や税理士への受け渡し用。
 * CSV共通ルールは第5章 5.5.1(日付 YYYY/MM/DD・CRLF改行・エスケープ)。
 * freee/マネフォ/弥生の各形式は別ファイルで実装(フェーズ5・実装時に各社仕様で確定)。
 */

import { categoryName } from '@/constants/categories';
import type { Receipt } from '@/shared/types/receipt';

import type { CsvFormatter } from './types';

/** CSVの1セルをエスケープ(カンマ・改行・ダブルクォート対応, 第5章 5.5.1) */
function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toRow(cells: string[]): string {
  return cells.map(escapeCell).join(',');
}

/** 内部の YYYY-MM-DD を会計ソフト慣習の YYYY/MM/DD へ */
function toCsvDate(isoDate: string): string {
  return isoDate.replace(/-/g, '/');
}

const HEADER = ['日付', '金額', '店名', '勘定科目', 'メモ', '同席者', '目的', '案件名'];

export const genericFormatter: CsvFormatter = {
  id: 'generic',
  label: '汎用CSV',
  format(receipts: Receipt[]): string {
    const lines = [toRow(HEADER)];
    for (const r of receipts) {
      lines.push(
        toRow([
          toCsvDate(r.date),
          String(r.amountYen),
          r.store,
          categoryName(r.category),
          r.memo.note ?? '',
          r.memo.attendees ?? '',
          r.memo.purpose ?? '',
          r.memo.project ?? '',
        ]),
      );
    }
    // 第5章 5.5.1: 改行は CRLF
    return lines.join('\r\n');
  },
  fileName({ year }) {
    return year ? `${year}_receipts_generic.csv` : 'receipts_generic.csv';
  },
};
