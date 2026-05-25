/**
 * レシートのドメイン型
 *
 * 出典: 要件定義 第3章(確認・編集 FR-07〜10)/ 第4章(S-03 確認画面)
 * OCR抽出結果とユーザー入力メモを保持する中核エンティティ。
 */

import type { PlanId } from "@/config/plans";

/** 勘定科目(MVPは初期セット + 自由入力。詳細は constants/categories.ts) */
export type CategoryId = string;

/** レシートに任意で付与するメモ(FR-09) */
export interface ReceiptMemo {
  /** 自由記述メモ(汎用) */
  note?: string;
  /** 同席者(交際費・会議費。税務調査でも参照) */
  attendees?: string;
  /** 目的・用途 */
  purpose?: string;
  /** プロジェクト/案件名 */
  project?: string;
}

/** OCRが抽出した生の値。承認前の候補段階で使う */
export interface OcrExtraction {
  /** ISO 日付(YYYY-MM-DD)。抽出失敗時は null */
  date: string | null;
  /** 税込合計(円)。抽出失敗時は null */
  amountYen: number | null;
  /** 店名(加盟店名) */
  store: string | null;
  /** 勘定科目候補(確度順) */
  categoryCandidates: CategoryId[];
}

export interface Receipt {
  id: string;
  userId: string;
  /** 確定済みの値(ユーザー承認後) */
  date: string; // YYYY-MM-DD
  amountYen: number;
  store: string;
  category: CategoryId;
  memo: ReceiptMemo;
  /**
   * 画像の状態。プランの保存ポリシー(FR-12)で変わる。
   * - "stored": 画像あり
   * - "deleted": テキスト化後に削除済み(Free / 期限切れLight)
   */
  imageStatus: "stored" | "deleted";
  /** 画像のストレージパス(stored のときのみ) */
  imagePath?: string;
  /** このレシートを記録した時点のプラン(集計・表示用) */
  capturedPlan: PlanId;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}
