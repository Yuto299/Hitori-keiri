/**
 * CSVフォーマッタのレジストリ
 *
 * 出力画面(S-06)はここから利用可能なフォーマッタを取得する。
 * 各社形式(freee/マネフォ/弥生)は Light/Pro 限定(FR-16〜18)。
 */

import type { PlanId } from '@/config/plans';
import { canExportAccountingCsv } from '@/features/billing/plan-access';

import { freeeFormatter } from './freee';
import { genericFormatter } from './generic';
import { moneyforwardFormatter } from './moneyforward';
import type { CsvFormatId, CsvFormatter } from './types';
import { yayoiFormatter } from './yayoi';

export type { CsvFormatId, CsvFormatter } from './types';

export const ALL_FORMATTERS: CsvFormatter[] = [
  genericFormatter,
  freeeFormatter,
  moneyforwardFormatter,
  yayoiFormatter,
];

export const FORMATTER_BY_ID: Record<CsvFormatId, CsvFormatter> = {
  generic: genericFormatter,
  freee: freeeFormatter,
  moneyforward: moneyforwardFormatter,
  yayoi: yayoiFormatter,
};

/** 各社形式かどうか(汎用以外は Light/Pro 限定) */
export function isAccountingFormat(id: CsvFormatId): boolean {
  return id !== 'generic';
}

/** 指定プランでその形式を出力できるか(課金壁の判定に使う) */
export function canUseFormat(plan: PlanId, id: CsvFormatId): boolean {
  if (!isAccountingFormat(id)) return true; // 汎用は全プラン
  return canExportAccountingCsv(plan);
}
