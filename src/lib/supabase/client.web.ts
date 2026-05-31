/**
 * Supabase クライアント(Web 実装)
 *
 * Web では React Native の AsyncStorage を使わない。
 * - ブラウザでは window.localStorage を直接使う
 * - 静的レンダリング(SSR的なビルド時)では window が無いため、安全な no-op ストレージで初期化
 *   → ブラウザに到達した時点で localStorage に切り替わる
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';

// SSR/ビルド時に window が無くても落ちない簡易ストレージ
const memoryStorage = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

function pickStorage() {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage;
  }
  return memoryStorage;
}

let _client: SupabaseClient | null = null;

function build(): SupabaseClient | null {
  if (!env.supabase) return null;
  return createClient(env.supabase.url, env.supabase.anonKey, {
    auth: {
      storage: pickStorage(),
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
