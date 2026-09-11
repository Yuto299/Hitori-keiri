/**
 * 画像保存ポリシー(FR-12)の判定ロジック
 *
 * Free: OCR後ただちに削除(保存しない) / Light: 30日 / Pro: 無期限。
 * 判定はプラン定義(config/plans.ts の imageRetention)から導く。
 * 実際の削除処理は lib/sync/receipt-sync.ts(expireReceiptImageIfNeeded)が行う。
 *
 * プランのダウングレード時は「既存画像は保持し、以後の閲覧時に現行プランのポリシーで判定」
 * (image-storage.md §7 の案B)。Pro→Light に下げた場合、30日超の画像は次に開いた時点で削除される。
 */

import { PLANS, type PlanId } from '@/config/plans';
import type { Receipt } from '@/shared/types/receipt';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 画像の保存期限(ISO datetime)。無期限・保存なしは null */
export function imageExpiresAt(receipt: Pick<Receipt, 'createdAt'>, plan: PlanId): string | null {
  const retention = PLANS[plan].features.imageRetention;
  if (retention.kind !== 'days') return null;
  return new Date(new Date(receipt.createdAt).getTime() + retention.days * DAY_MS).toISOString();
}

/** 現行プランのポリシーで、保存中の画像を削除すべきか */
export function isImageExpired(
  receipt: Pick<Receipt, 'createdAt' | 'imageStatus'>,
  plan: PlanId,
  now: Date = new Date(),
): boolean {
  if (receipt.imageStatus !== 'stored') return false;
  const retention = PLANS[plan].features.imageRetention;
  if (retention.kind === 'unlimited') return false;
  if (retention.kind === 'immediate-delete') return true;
  const expiresAt = imageExpiresAt(receipt, plan);
  return expiresAt !== null && now.getTime() >= new Date(expiresAt).getTime();
}

/** 設定画面などで見せる保存ポリシーの文言 */
export function retentionLabel(plan: PlanId): string {
  const retention = PLANS[plan].features.imageRetention;
  if (retention.kind === 'immediate-delete') return '保存なし(テキスト化後に削除)';
  if (retention.kind === 'days') return `${retention.days}日間`;
  return '無期限';
}
