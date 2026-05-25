/**
 * 汎用CSVフォーマッタ(FR-15・全プラン)
 *
 * 会計ソフトに依存しない素直な列構成。Excel運用や税理士への受け渡し用。
 * freee/マネフォ/弥生の各形式は別ファイルで実装し、仕様は第5章で確定する。
 */

import { CATEGORY_BY_ID } from "@/constants/categories";
import type { Receipt } from "@/shared/types/receipt";

import type { CsvFormatter } from "./types";

/** CSVの1セルをエスケープ(カンマ・改行・ダブルクォート対応) */
function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toRow(cells: string[]): string {
  return cells.map(escapeCell).join(",");
}

const HEADER = [
  "日付",
  "金額",
  "店名",
  "勘定科目",
  "メモ",
  "同席者",
  "目的",
  "案件名",
];

export const genericFormatter: CsvFormatter = {
  id: "generic",
  label: "汎用CSV",
  format(receipts: Receipt[]): string {
    const lines = [toRow(HEADER)];
    for (const r of receipts) {
      lines.push(
        toRow([
          r.date,
          String(r.amountYen),
          r.store,
          CATEGORY_BY_ID[r.category]?.name ?? r.category,
          r.memo.note ?? "",
          r.memo.attendees ?? "",
          r.memo.purpose ?? "",
          r.memo.project ?? "",
        ]),
      );
    }
    return lines.join("\n");
  },
  fileName({ year }) {
    return year ? `${year}_receipts_generic.csv` : "receipts_generic.csv";
  },
};
