/**
 * レシート等のローカル/リモート共通の ID 生成
 *
 * 端末で UUID v4 を生成し、そのまま Supabase の uuid カラムにも使う
 * (sync-strategy.md「ID戦略」案1)。これにより同期コードがシンプルになる。
 */

import * as Crypto from 'expo-crypto';

export function generateUuid(): string {
  return Crypto.randomUUID();
}
