/**
 * CSVフォーマッタの共通インターフェース
 *
 * 出典: 要件 第3章 FR-15〜18(汎用 / freee / マネフォ / 弥生)
 * 各会計ソフトのインポート仕様に合わせ、Receipt[] を CSV 文字列へ変換する。
 * 仕様の確定は第5章(データモデル / CSV仕様)で行う —— ここは差し替え可能な
 * 構造を用意するための骨組み。
 */

import type { Receipt } from "@/shared/types/receipt";

export type CsvFormatId = "generic" | "freee" | "moneyforward" | "yayoi";

export interface CsvFormatter {
  id: CsvFormatId;
  /** UI表示名 */
  label: string;
  /** Receipt 配列を CSV 文字列へ */
  format(receipts: Receipt[]): string;
  /** 出力ファイル名(例: 2025_receipts_freee.csv) */
  fileName(opts: { year?: number }): string;
}
