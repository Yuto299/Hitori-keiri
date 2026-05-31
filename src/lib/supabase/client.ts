/**
 * Supabase クライアント(React Native 設定)
 *
 * 公式 React Native ガイドに準拠:
 * - AsyncStorage でセッションを永続化
 * - autoRefreshToken / persistSession を有効化
 * - detectSessionInUrl は RN では無効
 *
 * 環境変数が未設定の場合は null を返す(まだ Supabase アカウントが無い段階でも
 * アプリ全体が起動できるように)。docs/development/supabase-setup.md 参照。
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import { env } from '@/lib/env';

let _client: SupabaseClient | null = null;

function build(): SupabaseClient | null {
  if (!env.supabase) return null;
  return createClient(env.supabase.url, env.supabase.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

/** Supabase クライアント(未設定なら null) */
export function getSupabase(): SupabaseClient | null {
  if (_client === null) {
    _client = build();
  }
  return _client;
}
