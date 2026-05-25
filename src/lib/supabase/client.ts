/**
 * Supabase クライアント(React Native 設定)
 *
 * 公式 React Native ガイドに準拠:
 * - AsyncStorage でセッションを永続化
 * - autoRefreshToken / persistSession を有効化
 * - detectSessionInUrl は RN では無効(URLベースのセッション検出はWeb向け)
 *
 * RLS(行レベルセキュリティ)前提で anon key を使用する。
 * 秘密鍵はここに置かない(docs/development/tech-stack.md)。
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

import { env } from "@/lib/env";

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
