/**
 * アプリ全体で共有する軽量な状態(プラン・ユーザーID・認証状態)
 *
 * フェーズ3 で認証(Supabase)を導入。サインインしていれば Supabase の user id、
 * していなければ "local-user" 匿名 ID を使う(ローカル限定モード)。
 * プランは認証導入後も「設定画面の開発用切替」を残しつつ、フェーズ6で
 * Supabase の subscriptions テーブルから取得する形に進化させる。
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { PlanId } from '@/config/plans';
import { useAuth, type AuthStatus } from '@/features/auth/hooks/use-auth';
import { pullFromRemote } from '@/lib/sync/receipt-sync';

interface AppState {
  userId: string;
  /** 認証ステータス。未サインインや Supabase 未設定でもアプリは使える */
  authStatus: AuthStatus;
  email: string | null;
  plan: PlanId;
  setPlan: (plan: PlanId) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [plan, setPlan] = useState<PlanId>('light');

  // サインイン時に Supabase からレシートを取ってきてローカルにマージ
  useEffect(() => {
    if (auth.status !== 'signed-in') return;
    pullFromRemote(auth.userId)
      .then(({ pulled, added }) => {
        if (added > 0) {
          console.log(`[sync] pulled ${pulled}, added ${added} new receipts`);
        }
      })
      .catch((e) => console.warn('[sync] pull failed:', e));
  }, [auth.status, auth.userId]);

  const value = useMemo<AppState>(
    () => ({
      userId: auth.userId,
      authStatus: auth.status,
      email: auth.email,
      plan,
      setPlan,
    }),
    [auth.userId, auth.status, auth.email, plan],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp は AppProvider の内側で使ってください');
  }
  return ctx;
}
