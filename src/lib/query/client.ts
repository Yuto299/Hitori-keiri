/**
 * TanStack Query クライアント
 *
 * サーバ状態(Supabase からのデータ)のフェッチ・キャッシュに使う。
 * モバイル向けに、画面復帰時の過剰な再フェッチを抑える設定にしている。
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1分間は新鮮とみなす
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
