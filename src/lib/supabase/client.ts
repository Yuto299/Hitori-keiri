/**
 * Supabase クライアント(ネイティブ実装)
 *
 * 公式 React Native ガイドに準拠:
 * - AsyncStorage でセッションを永続化
 * - autoRefreshToken / persistSession を有効化
 *
 * Web は client.web.ts(ブラウザの localStorage を使う)。
 * 環境変数が未設定の場合は null を返す(まだ Supabase アカウントが無くてもアプリ起動できる)。
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

export function getSupabase(): SupabaseClient | null {
  if (_client === null) {
    _client = build();
  }
  return _client;
}
