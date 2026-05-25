/**
 * レシートのドメイン型
 *
 * 出典: 要件 第3章(確認・編集 FR-07〜10)/ 第4章(S-03 確認画面)/ 第5章(データモデル)
 * OCR抽出結果とユーザー入力メモを保持する中核エンティティ。
 */

import type { PlanId } from '@/config/plans';

/** 勘定科目ID(マスタは constants/categories.ts) */
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

/** OCRが抽出した生の値。承認前の候補段階で使う(FR-04/05) */
export interface OcrExtraction {
  /** ISO 日付(YYYY-MM-DD)。抽出失敗時は null */
  date: string | null;
  /** 税込合計(円)。抽出失敗時は null */
  amountYen: number | null;
  /** 店名(加盟店名) */
  store: string | null;
  /** 勘定科目候補(確度順、最大3件想定) */
  categoryCandidates: CategoryId[];
  /** 項目ごとの確度(0〜1)。低確度は確認画面で強調(第6章 6.3.2) */
  confidence?: {
    date?: number;
    amount?: number;
    store?: number;
  };
}

/** 画像の保存状態(プランの保存ポリシー FR-12 で遷移) */
export type ImageStatus = 'stored' | 'deleted';

export interface Receipt {
  id: string;
  userId: string;
  /** 確定済みの値(ユーザー承認後) */
  date: string; // YYYY-MM-DD
  amountYen: number; // 税込合計(整数・円)
  store: string;
  category: CategoryId;
  memo: ReceiptMemo;
  /** "deleted" は「テキスト化後に削除済み」(Free / 期限切れLight) */
  imageStatus: ImageStatus;
  /** 画像のストレージパス(stored のときのみ) */
  imagePath?: string;
  /** このレシートを記録した時点のプラン(集計・表示用) */
  capturedPlan: PlanId;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/** 新規作成時の入力(id / 時刻はストア側で付与) */
export type NewReceipt = Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>;
