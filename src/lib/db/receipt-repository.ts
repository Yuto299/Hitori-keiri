/**
 * レシートのローカル永続化(SQLite)
 *
 * ドメイン型 Receipt と DB 行の相互変換をここに閉じ込める。
 * UI / features 層は Receipt 型だけを扱い、SQL を直接書かない。
 */

import type { NewReceipt, Receipt, ReceiptMemo } from '@/shared/types/receipt';

import { generateUuid } from './id';
import { getDb } from './index';

/** DB 行の形(snake_case・memo は JSON 文字列) */
interface ReceiptRow {
  id: string;
  user_id: string;
  date: string;
  amount_yen: number;
  store: string;
  category: string;
  memo: string;
  image_status: string;
  image_path: string | null;
  captured_plan: string;
  created_at: string;
  updated_at: string;
}

function rowToReceipt(row: ReceiptRow): Receipt {
  let memo: ReceiptMemo = {};
  try {
    memo = JSON.parse(row.memo) as ReceiptMemo;
  } catch {
    memo = {};
  }
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    amountYen: row.amount_yen,
    store: row.store,
    category: row.category,
    memo,
    imageStatus: row.image_status === 'deleted' ? 'deleted' : 'stored',
    imagePath: row.image_path ?? undefined,
    capturedPlan: row.captured_plan as Receipt['capturedPlan'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ID は UUID(端末で生成 → そのまま Supabase でも使う)で揃える(sync-strategy.md)

/**
 * リモートから取得した既存IDの Receipt をそのまま挿入する(同期で使う)。
 * 同じ id がローカルに既にある場合は無視(REPLACE しない・MVP方針)。
 */
export async function insertReceipt(receipt: Receipt): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO receipts
      (id, user_id, date, amount_yen, store, category, memo, image_status, image_path, captured_plan, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    receipt.id,
    receipt.userId,
    receipt.date,
    receipt.amountYen,
    receipt.store,
    receipt.category,
    JSON.stringify(receipt.memo),
    receipt.imageStatus,
    receipt.imagePath ?? null,
    receipt.capturedPlan,
    receipt.createdAt,
    receipt.updatedAt,
  );
}

/** 1件作成して保存後の Receipt を返す */
export async function createReceipt(input: NewReceipt): Promise<Receipt> {
  const db = await getDb();
  const now = new Date().toISOString();
  const receipt: Receipt = {
    ...input,
    id: generateUuid(),
    createdAt: now,
    updatedAt: now,
  };
  await db.runAsync(
    `INSERT INTO receipts
      (id, user_id, date, amount_yen, store, category, memo, image_status, image_path, captured_plan, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    receipt.id,
    receipt.userId,
    receipt.date,
    receipt.amountYen,
    receipt.store,
    receipt.category,
    JSON.stringify(receipt.memo),
    receipt.imageStatus,
    receipt.imagePath ?? null,
    receipt.capturedPlan,
    receipt.createdAt,
    receipt.updatedAt,
  );
  return receipt;
}

/** ユーザーのレシートを新しい順で取得 */
export async function listReceipts(
  userId: string,
  limit = 100,
): Promise<Receipt[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ReceiptRow>(
    `SELECT * FROM receipts WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT ?`,
    userId,
    limit,
  );
  return rows.map(rowToReceipt);
}

/** 1件取得 */
export async function getReceipt(id: string): Promise<Receipt | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ReceiptRow>(
    `SELECT * FROM receipts WHERE id = ?`,
    id,
  );
  return row ? rowToReceipt(row) : null;
}

/**
 * 当月の枚数(FR-22 の判定に使う。YYYY-MM 前方一致)。
 * date は 'YYYY/MM/DD' と 'YYYY-MM-DD' が混在しうるため '-' に正規化して比較する。
 */
export async function countReceiptsInMonth(
  userId: string,
  yearMonth: string, // 'YYYY-MM'
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM receipts WHERE user_id = ? AND replace(date, '/', '-') LIKE ?`,
    userId,
    `${yearMonth}-%`,
  );
  return row?.n ?? 0;
}

/** 当月の合計金額(ホームのサマリー表示用) */
export async function sumReceiptsInMonth(
  userId: string,
  yearMonth: string, // 'YYYY-MM'
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(amount_yen) AS total FROM receipts WHERE user_id = ? AND replace(date, '/', '-') LIKE ?`,
    userId,
    `${yearMonth}-%`,
  );
  return row?.total ?? 0;
}

/** 削除 */
export async function deleteReceipt(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM receipts WHERE id = ?`, id);
}
