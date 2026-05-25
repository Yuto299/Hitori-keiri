/**
 * レシート一覧の取得フック(React Query)
 *
 * ローカルDB(SQLite)から当該ユーザーのレシートを新しい順で取得する。
 * 保存後の再取得は queryClient の invalidate で行う(呼び出し側)。
 */

import { useQuery } from '@tanstack/react-query';

import { listReceipts } from '@/lib/db/receipt-repository';

export const receiptsQueryKey = (userId: string) => ['receipts', userId] as const;

export function useReceipts(userId: string) {
  return useQuery({
    queryKey: receiptsQueryKey(userId),
    queryFn: () => listReceipts(userId),
  });
}
