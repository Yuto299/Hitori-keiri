/**
 * 汎用CSVフォーマッタ(FR-15・全プラン)
 *
 * 会計ソフトに依存しない素直な列構成。Excel運用や税理士への受け渡し用。
 * CSV共通ルールは第5章 5.5.1(YYYY/MM/DD・CRLF・エスケープ)。
 */

import { categoryName } from '@/constants/categories';
import type { Receipt } from '@/shared/types/receipt';

import { joinCsv, toCsvDate, toRow } from './csv-utils';
import type { CsvFormatter } from './types';

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
    return joinCsv(lines);
  },
  fileName({ year }) {
    return year ? `${year}_receipts_generic.csv` : 'receipts_generic.csv';
  },
};
