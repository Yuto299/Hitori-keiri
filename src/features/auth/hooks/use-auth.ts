/**
 * 認証状態フック(Supabase Auth)
 *
 * セッションを購読し、現在のユーザー(またはローカル匿名)を返す。
 * Supabase 未設定時はローカル匿名モードで動く(MVP前半の互換性を維持)。
 */

import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { getSupabase } from '@/lib/supabase/client';

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out' | 'local-only';

export interface AuthState {
  status: AuthStatus;
  /** Supabase が設定されていなければ "local-user"(暫定) */
  userId: string;
  email: string | null;
  session: Session | null;
}

const LOCAL_USER_ID = 'local-user';

export function useAuth(): AuthState {
  const supabase = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoaded(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  if (!supabase) {
    return {
      status: 'local-only',
      userId: LOCAL_USER_ID,
      email: null,
      session: null,
    };
  }
  if (!loaded) {
    return { status: 'loading', userId: LOCAL_USER_ID, email: null, session: null };
  }
  if (!session) {
    return { status: 'signed-out', userId: LOCAL_USER_ID, email: null, session: null };
  }
  return {
    status: 'signed-in',
    userId: session.user.id,
    email: session.user.email ?? null,
    session,
  };
}

/**
 * メール+パスワードでサインイン
 */
export async function signInWithEmail(email: string, password: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase が設定されていません');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * メール+パスワードでサインアップ
 */
export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase が設定されていません');
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}
