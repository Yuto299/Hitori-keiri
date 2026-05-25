/**
 * 弥生 形式CSVフォーマッタ(FR-18・Light/Pro)
 *
 * 第5章 5.5.3 の必須項目(取引日付/借方勘定科目/借方金額/摘要)に沿った暫定実装。
 * ⚠ 弥生の「仕訳データ取込(汎用形式)」は列構成が多く、文字コードは Shift_JIS の
 *    可能性が高い(第5章 5.5.1)。実装着手時に最新仕様で列・エンコードを確定する。
 *    docs/requirements/05-data-model-csv.md#553
 */

import { categoryName } from '@/constants/categories';
import type { Receipt } from '@/shared/types/receipt';

import { buildSummary, joinCsv, toCsvDate, toRow } from './csv-utils';
import type { CsvFormatter } from './types';

// TODO(実装着手): 弥生の正式な仕訳データ取込列に合わせる(+ Shift_JIS 検討)
const HEADER = ['取引日付', '借方勘定科目', '借方金額', '摘要'];

export const yayoiFormatter: CsvFormatter = {
  id: 'yayoi',
  label: '弥生会計形式CSV',
  format(receipts: Receipt[]): string {
    const lines = [toRow(HEADER)];
    for (const r of receipts) {
      lines.push(
        toRow([
          toCsvDate(r.date),
          categoryName(r.category),
          String(r.amountYen),
          buildSummary(r),
        ]),
      );
    }
    return joinCsv(lines);
  },
  fileName({ year }) {
    return year ? `${year}_receipts_yayoi.csv` : 'receipts_yayoi.csv';
  },
};
