/**
 * マネーフォワード 形式CSVフォーマッタ(FR-17・Light/Pro)
 *
 * 第5章 5.5.3 の必須項目(取引日/内容/金額/勘定科目/備考)に沿った暫定実装。
 * ⚠ 列名・列順は MFクラウド会計の最新インポート仕様で要確認(実装着手時に確定)。
 *    docs/requirements/05-data-model-csv.md#553
 */

import { categoryName } from '@/constants/categories';
import type { Receipt } from '@/shared/types/receipt';

import { buildSummary, joinCsv, toCsvDate, toRow } from './csv-utils';
import type { CsvFormatter } from './types';

// TODO(実装着手): マネーフォワードの正式なインポート列に合わせる
const HEADER = ['取引日', '内容', '金額', '勘定科目', '備考'];

export const moneyforwardFormatter: CsvFormatter = {
  id: 'moneyforward',
  label: 'マネーフォワード形式CSV',
  format(receipts: Receipt[]): string {
    const lines = [toRow(HEADER)];
    for (const r of receipts) {
      lines.push(
        toRow([
          toCsvDate(r.date),
          r.store,
          String(r.amountYen),
          categoryName(r.category),
          buildSummary(r),
        ]),
      );
    }
    return joinCsv(lines);
  },
  fileName({ year }) {
    return year ? `${year}_receipts_moneyforward.csv` : 'receipts_moneyforward.csv';
  },
};
