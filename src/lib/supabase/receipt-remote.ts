/**
 * Supabase 側の receipts 操作
 *
 * ローカルDB(SQLite / Web インメモリ)とは別のリモート永続化層。
 * UI からは直接呼ばず、フェーズ後半で作る同期サービス経由で使う想定。
 * Supabase 未設定時は null を返し、呼び出し側はローカルだけで完結する。
 */

import type { Receipt, ReceiptMemo } from '@/shared/types/receipt';

import { getSupabase } from './client';

interface ReceiptRow {
  id: string;
  user_id: string;
  date: string;
  amount_yen: number;
  store: string;
  category: string;
  memo: ReceiptMemo | null;
  image_status: 'stored' | 'deleted';
  image_path: string | null;
  captured_plan: string;
  created_at: string;
  updated_at: string;
}

function rowToReceipt(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    amountYen: row.amount_yen,
    store: row.store,
    category: row.category,
    memo: row.memo ?? {},
    imageStatus: row.image_status,
    imagePath: row.image_path ?? undefined,
    capturedPlan: row.captured_plan as Receipt['capturedPlan'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** ログイン中ユーザーのレシートをリモートから取得(新しい順) */
export async function fetchRemoteReceipts(): Promise<Receipt[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data as ReceiptRow[]).map(rowToReceipt);
}

/**
 * ローカルで作成済みのレシート(IDあり)をリモートに挿入。
 * ID も含めて送ることで、ローカル=リモートで同じUUIDを共有する(sync-strategy.md)。
 * 既存IDなら upsert で更新(同期再実行時の冪等性)。
 */
export async function pushRemoteReceipt(receipt: Receipt): Promise<Receipt | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('receipts')
    .upsert({
      id: receipt.id,
      user_id: receipt.userId, // RLS が一致を検証
      date: receipt.date,
      amount_yen: receipt.amountYen,
      store: receipt.store,
      category: receipt.category,
      memo: receipt.memo,
      image_status: receipt.imageStatus,
      image_path: receipt.imagePath ?? null,
      captured_plan: receipt.capturedPlan,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToReceipt(data as ReceiptRow);
}

/** 削除 */
export async function deleteRemoteReceipt(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('receipts').delete().eq('id', id);
  if (error) throw error;
}
