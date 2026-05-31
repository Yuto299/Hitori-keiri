/**
 * Supabase 側の receipts 操作
 *
 * ローカルDB(SQLite / Web インメモリ)とは別のリモート永続化層。
 * UI からは直接呼ばず、フェーズ後半で作る同期サービス経由で使う想定。
 * Supabase 未設定時は null を返し、呼び出し側はローカルだけで完結する。
 */

import type { NewReceipt, Receipt, ReceiptMemo } from '@/shared/types/receipt';

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

/** 新規レシートをリモートに挿入(RLSにより user_id は自動で auth.uid()) */
export async function pushRemoteReceipt(input: NewReceipt): Promise<Receipt | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('receipts')
    .insert({
      user_id: input.userId, // RLS が一致を検証
      date: input.date,
      amount_yen: input.amountYen,
      store: input.store,
      category: input.category,
      memo: input.memo,
      image_status: input.imageStatus,
      image_path: input.imagePath ?? null,
      captured_plan: input.capturedPlan,
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
