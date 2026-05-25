/**
 * プランに応じた機能ゲート判定(FR-21)と枚数管理(FR-22)
 *
 * UI からは「この機能は使えるか」「あと何枚撮れるか」をこの関数群で問い合わせる。
 * プラン定義そのものは config/plans.ts。判定ロジックはここに集約する。
 */

import { PLANS, type PlanId } from "@/config/plans";

/** 指定プランで対応形式CSV(freee/マネフォ/弥生)を出せるか */
export function canExportAccountingCsv(plan: PlanId): boolean {
  return PLANS[plan].features.accountingCsv;
}

/** 指定プランで検索が使えるか(FR-13) */
export function canSearch(plan: PlanId): boolean {
  return PLANS[plan].features.search;
}

/** 指定プランで音声メモが使えるか(FR-10) */
export function canUseVoiceMemo(plan: PlanId): boolean {
  return PLANS[plan].features.voiceMemo;
}

/** 指定プランでカテゴリAI学習が使えるか(FR-06) */
export function canUseCategoryLearning(plan: PlanId): boolean {
  return PLANS[plan].features.categoryLearning;
}

/**
 * 今月あと何枚撮れるか(FR-22)。
 * 無制限プランは null を返す。上限到達時は 0。
 */
export function remainingReceipts(
  plan: PlanId,
  usedThisMonth: number,
): number | null {
  const limit = PLANS[plan].features.monthlyReceiptLimit;
  if (limit === null) return null; // 無制限
  return Math.max(0, limit - usedThisMonth);
}

/** これ以上レシートを追加できるか(上限チェック) */
export function canAddReceipt(plan: PlanId, usedThisMonth: number): boolean {
  const remaining = remainingReceipts(plan, usedThisMonth);
  return remaining === null || remaining > 0;
}
