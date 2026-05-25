/**
 * 勘定科目マスタ(初期セット)
 *
 * 個人事業主が経費計上で使う代表的な科目。OCRの科目候補提示(FR-05)と
 * 確認画面(S-03)の選択肢に使う。Pro のAI学習(FR-06)はこの科目に
 * 対する過去採用率を記録する。
 *
 * 注: 簿記知識を要求しない方針(要件 1.5)のため、UI上はやさしい呼称を併記する。
 */

import type { CategoryId } from "@/shared/types/receipt";

export interface Category {
  id: CategoryId;
  /** 会計上の科目名 */
  name: string;
  /** ユーザー向けのやさしい補足 */
  hint?: string;
}

export const CATEGORIES: Category[] = [
  { id: "consumables", name: "消耗品費", hint: "文具・備品など" },
  { id: "supplies", name: "事務用品費", hint: "事務まわりの細かい物" },
  { id: "travel", name: "旅費交通費", hint: "電車・バス・ガソリンなど" },
  { id: "entertainment", name: "接待交際費", hint: "打合せの飲食・手土産" },
  { id: "meeting", name: "会議費", hint: "打合せ時のお茶代など" },
  { id: "communication", name: "通信費", hint: "スマホ・ネット回線" },
  { id: "utilities", name: "水道光熱費", hint: "電気・ガス・水道" },
  { id: "outsourcing", name: "外注費", hint: "業務委託の支払い" },
  { id: "advertising", name: "広告宣伝費", hint: "広告・販促" },
  { id: "books", name: "新聞図書費", hint: "書籍・資料" },
  { id: "rent", name: "地代家賃", hint: "事務所・店舗の家賃" },
  { id: "misc", name: "雑費", hint: "どれにも当てはまらない時" },
];

export const CATEGORY_BY_ID: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

export const DEFAULT_CATEGORY: CategoryId = "misc";
