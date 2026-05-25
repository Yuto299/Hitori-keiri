/**
 * 料金プラン定義(Free / Light / Pro)
 *
 * 出典: 要件定義 第1章 1.7(docs/requirements/01-product-overview.md)
 * プランごとの枚数上限・画像保存ポリシー・機能フラグを一元管理する。
 * 機能ゲート(FR-21)・枚数管理(FR-22)はこの定義を参照する。
 */

export type PlanId = "free" | "light" | "pro";

/** 画像保存ポリシー(FR-12) */
export type ImageRetention =
  | { kind: "immediate-delete" } // Free: OCR後ただちに削除
  | { kind: "days"; days: number } // Light: 30日
  | { kind: "unlimited" }; // Pro: 無期限

export interface PlanFeatures {
  /** 月間レシート上限(null = 無制限) */
  monthlyReceiptLimit: number | null;
  imageRetention: ImageRetention;
  /** 汎用CSVは全プラン可 */
  genericCsv: boolean;
  /** freee/マネフォ/弥生形式CSV */
  accountingCsv: boolean;
  /** 店名→科目のAI学習(FR-06) */
  categoryLearning: boolean;
  /** レシート検索(FR-13) */
  search: boolean;
  /** メモの音声入力(FR-10) */
  voiceMemo: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  /** 月額(円) */
  monthlyPriceYen: number;
  /** 年額(円, 月額×10相当)。Free は null */
  yearlyPriceYen: number | null;
  features: PlanFeatures;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceYen: 0,
    yearlyPriceYen: null,
    features: {
      monthlyReceiptLimit: 5,
      imageRetention: { kind: "immediate-delete" },
      genericCsv: true,
      accountingCsv: false,
      categoryLearning: false,
      search: false,
      voiceMemo: false,
    },
  },
  light: {
    id: "light",
    name: "Light",
    monthlyPriceYen: 480,
    yearlyPriceYen: 4800,
    features: {
      monthlyReceiptLimit: 30,
      imageRetention: { kind: "days", days: 30 },
      genericCsv: true,
      accountingCsv: true,
      categoryLearning: false,
      search: false,
      voiceMemo: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPriceYen: 780,
    yearlyPriceYen: 7800,
    features: {
      monthlyReceiptLimit: null,
      imageRetention: { kind: "unlimited" },
      genericCsv: true,
      accountingCsv: true,
      categoryLearning: true,
      search: true,
      voiceMemo: true,
    },
  },
};

export const DEFAULT_PLAN: PlanId = "free";
