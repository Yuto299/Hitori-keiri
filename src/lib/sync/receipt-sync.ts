/**
 * レシートのローカル↔Supabase 同期サービス
 *
 * 設計: docs/development/sync-strategy.md
 * - 書き込み: ローカルに保存後、サインイン中ならバックグラウンドで Supabase へ push
 * - 読み込み: サインイン時に Supabase から pull してローカルにマージ
 * - 失敗は UI を止めない(ローカルが正)。エラーはコンソールに出すだけ
 *
 * UI/features 層はこの関数群を呼ぶだけ。Supabase 未設定 or 未サインインなら
 * 自動的に no-op になり、ローカルだけで完結する。
 */

import * as repoNative from '@/lib/db/receipt-repository';
import * as remote from '@/lib/supabase/receipt-remote';
import type { NewReceipt, Receipt } from '@/shared/types/receipt';

/**
 * ローカルに作成し、サインイン中ならリモートにも push する。
 * 戻り値はローカル作成結果(ID 含む)。リモート push の失敗は無視する。
 */
export async function createReceiptSynced(input: NewReceipt): Promise<Receipt> {
  const created = await repoNative.createReceipt(input);
  // バックグラウンドで push(待たない)
  remote.pushRemoteReceipt(created).catch((e) => {
    console.warn('[sync] push failed:', e);
  });
  return created;
}

/**
 * ローカルで削除し、サインイン中ならリモートからも削除する。
 */
export async function deleteReceiptSynced(id: string): Promise<void> {
  await repoNative.deleteReceipt(id);
  remote.deleteRemoteReceipt(id).catch((e) => {
    console.warn('[sync] delete failed:', e);
  });
}

/**
 * Supabase からレシートを取得し、ローカルに無いものを追加する(マージ)。
 * 既にローカルにある同一 ID は上書きしない(MVPの単純実装)。
 * 戻り値はマージ後のローカル件数。
 */
export async function pullFromRemote(userId: string): Promise<{ pulled: number; added: number }> {
  const remoteRows = await remote.fetchRemoteReceipts();
  if (!remoteRows) {
    return { pulled: 0, added: 0 }; // Supabase 未設定 or 未サインイン
  }
  let added = 0;
  for (const r of remoteRows) {
    if (r.userId !== userId) continue; // 念のためフィルタ(RLSと二重防御)
    const existing = await repoNative.getReceipt(r.id);
    if (!existing) {
      await repoNative.insertReceipt(r);
      added += 1;
    }
  }
  return { pulled: remoteRows.length, added };
}
