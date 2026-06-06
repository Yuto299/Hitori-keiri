/**
 * レシートのローカル永続化(Web版・インメモリ)
 *
 * expo-sqlite の Web(WASM)対応は重いため、Web では同一インターフェースの
 * インメモリ実装を使う(Metro が .web.ts を優先解決)。
 * ブラウザでの動作確認・デモ用途。リロードで消える点はネイティブと異なる。
 *
 * 本番のWeb永続化が必要になったら localStorage/IndexedDB 実装に差し替える。
 */

import type { NewReceipt, Receipt } from '@/shared/types/receipt';

import { generateUuid } from './id';

const store: Receipt[] = [];

/** リモート由来の既存IDレシートをそのまま挿入(同期用)。既存なら無視。 */
export async function insertReceipt(receipt: Receipt): Promise<void> {
  if (store.some((r) => r.id === receipt.id)) return;
  store.unshift(receipt);
}

export async function createReceipt(input: NewReceipt): Promise<Receipt> {
  const now = new Date().toISOString();
  const receipt: Receipt = {
    ...input,
    id: generateUuid(),
    createdAt: now,
    updatedAt: now,
  };
  store.unshift(receipt);
  return receipt;
}

export async function listReceipts(userId: string, limit = 100): Promise<Receipt[]> {
  return store
    .filter((r) => r.userId === userId)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit);
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  return store.find((r) => r.id === id) ?? null;
}

export async function countReceiptsInMonth(
  userId: string,
  yearMonth: string,
): Promise<number> {
  return store.filter((r) => r.userId === userId && r.date.startsWith(yearMonth)).length;
}

export async function deleteReceipt(id: string): Promise<void> {
  const idx = store.findIndex((r) => r.id === id);
  if (idx >= 0) store.splice(idx, 1);
}
