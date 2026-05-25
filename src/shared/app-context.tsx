/**
 * アプリ全体で共有する軽量な状態(プラン・ユーザーID)
 *
 * 認証(フェーズ3)導入前の暫定。いまはローカルの匿名ユーザーとして扱い、
 * プランは手元で切り替えられるようにして機能ゲート(FR-21/22)の挙動を確認できる。
 * 認証導入時に userId は Supabase の user id へ、プランは Subscription へ置き換える。
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { PlanId } from '@/config/plans';

interface AppState {
  /** 現在のユーザーID(暫定: ローカル匿名) */
  userId: string;
  plan: PlanId;
  setPlan: (plan: PlanId) => void;
}

const AppContext = createContext<AppState | null>(null);

/** 暫定の匿名ユーザーID(認証導入で置き換え) */
const LOCAL_USER_ID = 'local-user';

export function AppProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanId>('free');

  const value = useMemo<AppState>(
    () => ({ userId: LOCAL_USER_ID, plan, setPlan }),
    [plan],
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
