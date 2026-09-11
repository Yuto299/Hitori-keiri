/**
 * レシートのローカル↔Supabase 同期サービス
 *
 * 設計: docs/development/sync-strategy.md
 * - 書き込み: ローカルに保存後、サインイン中ならバックグラウンドで Supabase へ push
 *   (Light/Pro の画像は Storage へアップロードし、imagePath を Storage パスに置換)
 * - 画像ポリシー(FR-12): 閲覧時に expireReceiptImageIfNeeded で期限切れを削除
 * - 読み込み: サインイン時に Supabase から pull してローカルにマージ
 * - 失敗は UI を止めない(ローカルが正)。エラーはコンソールに出すだけ
 *
 * UI/features 層はこの関数群を呼ぶだけ。Supabase 未設定 or 未サインインなら
 * 自動的に no-op になり、ローカルだけで完結する。
 */

import type { PlanId } from '@/config/plans';
import { isImageExpired } from '@/features/receipts/image-retention';
import * as repoNative from '@/lib/db/receipt-repository';
import {
  deleteReceiptImage,
  getReceiptImageUrl,
  isRemoteImagePath,
  uploadReceiptImage,
} from '@/lib/supabase/image-storage';
import * as remote from '@/lib/supabase/receipt-remote';
import type { NewReceipt, Receipt } from '@/shared/types/receipt';

/**
 * ローカルに作成し、サインイン中ならリモートにも push する。
 * 戻り値はローカル作成結果(ID 含む)。リモート push の失敗は無視する。
 */
export async function createReceiptSynced(input: NewReceipt): Promise<Receipt> {
  const created = await repoNative.createReceipt(input);
  // バックグラウンドで push(待たない)。画像があれば Storage へ上げてからパスを差し替える
  syncCreatedReceipt(created).catch((e) => {
    console.warn('[sync] push failed:', e);
  });
  return created;
}

/**
 * 作成直後の同期。画像(Light/Pro)は Storage にアップロードし、成功したら
 * imagePath を Storage のパスに置き換えて ローカル・リモート両方を更新する(FR-12)。
 * アップロードに失敗してもレシート本体の push は行い、画像はローカル参照のまま残す。
 */
async function syncCreatedReceipt(created: Receipt): Promise<void> {
  let receipt = created;
  if (receipt.imageStatus === 'stored' && receipt.imagePath && !isRemoteImagePath(receipt.imagePath)) {
    try {
      const path = await uploadReceiptImage(receipt.id, receipt.userId, receipt.imagePath);
      if (path) {
        const updated = await repoNative.updateReceipt(receipt.id, { imagePath: path });
        if (updated) receipt = updated;
      }
    } catch (e) {
      console.warn('[sync] image upload failed (kept local):', e);
    }
  }
  await remote.pushRemoteReceipt(receipt);
}

/**
 * 表示用の画像URLを解決する。ローカルURIはそのまま、Storage のパスは署名付きURLに変換。
 * 取得できなければ null(「画像を表示できません」扱い)。
 */
export async function resolveReceiptImageUrl(receipt: Receipt): Promise<string | null> {
  if (receipt.imageStatus !== 'stored' || !receipt.imagePath) return null;
  if (!isRemoteImagePath(receipt.imagePath)) return receipt.imagePath;
  try {
    return await getReceiptImageUrl(receipt.imagePath);
  } catch (e) {
    console.warn('[sync] signed url failed:', e);
    return null;
  }
}

/**
 * 保存ポリシー(FR-12)を適用する。現行プランで期限切れなら画像を削除し、
 * imageStatus='deleted' に更新した Receipt を返す。変更がなければそのまま返す。
 * 閲覧時に判定する方式(image-storage.md §6.2 案B)。
 */
export async function expireReceiptImageIfNeeded(receipt: Receipt, plan: PlanId): Promise<Receipt> {
  if (!isImageExpired(receipt, plan)) return receipt;
  await removeStoredImage(receipt.imagePath);
  const updated = await repoNative.updateReceipt(receipt.id, {
    imageStatus: 'deleted',
    imagePath: undefined,
  });
  if (!updated) return receipt;
  remote.pushRemoteReceipt(updated).catch((e) => {
    console.warn('[sync] expire push failed:', e);
  });
  return updated;
}

/** Storage 上の画像を削除(ローカルURIなら何もしない)。失敗はログのみ */
async function removeStoredImage(imagePath: string | undefined): Promise<void> {
  if (!imagePath || !isRemoteImagePath(imagePath)) return;
  try {
    await deleteReceiptImage(imagePath);
  } catch (e) {
    console.warn('[sync] image delete failed:', e);
  }
}

/**
 * ローカルを更新し、サインイン中ならリモートにも upsert で反映する(FR-14 編集)。
 * ID が同じなので upsert が更新として働く。存在しなければ null。
 */
export async function updateReceiptSynced(
  id: string,
  patch: repoNative.ReceiptPatch,
): Promise<Receipt | null> {
  const updated = await repoNative.updateReceipt(id, patch);
  if (!updated) return null;
  remote.pushRemoteReceipt(updated).catch((e) => {
    console.warn('[sync] update push failed:', e);
  });
  return updated;
}

/**
 * ローカルで削除し、サインイン中ならリモートからも削除する。
 */
export async function deleteReceiptSynced(id: string): Promise<void> {
  const existing = await repoNative.getReceipt(id);
  await repoNative.deleteReceipt(id);
  remote.deleteRemoteReceipt(id).catch((e) => {
    console.warn('[sync] delete failed:', e);
  });
  removeStoredImage(existing?.imagePath).catch(() => undefined);
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
