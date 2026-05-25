/**
 * freee 形式CSVフォーマッタ(FR-16・Light/Pro)
 *
 * 第5章 5.5.3 の必須項目(発生日/勘定科目/金額(税込)/取引先/備考)に沿った暫定実装。
 * ⚠ 列名・列順・必須項目は freee の最新インポート仕様で要確認(実装着手時に確定)。
 *    docs/requirements/05-data-model-csv.md#553
 */

import { categoryName } from '@/constants/categories';
import type { Receipt } from '@/shared/types/receipt';

import { buildSummary, joinCsv, toCsvDate, toRow } from './csv-utils';
import type { CsvFormatter } from './types';

// TODO(実装着手): freee の正式なインポート列に合わせる
const HEADER = ['発生日', '勘定科目', '金額', '取引先', '備考'];

export const freeeFormatter: CsvFormatter = {
  id: 'freee',
  label: 'freee形式CSV',
  format(receipts: Receipt[]): string {
    const lines = [toRow(HEADER)];
    for (const r of receipts) {
      lines.push(
        toRow([
          toCsvDate(r.date),
          categoryName(r.category),
          String(r.amountYen),
          r.store,
          buildSummary(r),
        ]),
      );
    }
    return joinCsv(lines);
  },
  fileName({ year }) {
    return year ? `${year}_receipts_freee.csv` : 'receipts_freee.csv';
  },
};
