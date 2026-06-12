/**
 * 初回起動時(レシート0件)に見た目を伝えるためのサンプルデータ。
 * 実データと混同されないよう、表示側で必ず「サンプル」バッジを付ける(ReceiptRow)。
 */

import type { Receipt } from '@/shared/types/receipt';

export type ReceiptPreview = Pick<Receipt, 'id' | 'date' | 'store' | 'amountYen' | 'category'> & {
  /** true ならサンプルデータ(タップ不可・バッジ表示) */
  demo?: boolean;
};

export const DEMO_RECEIPTS: ReceiptPreview[] = [
  { id: 'demo-starbucks', date: '2026/05/25', store: 'スターバックス', amountYen: 680, category: 'meeting', demo: true },
  { id: 'demo-amazon', date: '2026/05/24', store: 'Amazon.co.jp', amountYen: 2480, category: 'consumables', demo: true },
  { id: 'demo-seven', date: '2026/05/24', store: 'セブン-イレブン', amountYen: 540, category: 'consumables', demo: true },
  { id: 'demo-jr', date: '2026/05/23', store: 'JR東日本', amountYen: 320, category: 'travel', demo: true },
];
