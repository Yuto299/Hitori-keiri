/**
 * 環境変数の型付き読み出し
 *
 * Expo はクライアント公開変数を `EXPO_PUBLIC_` 接頭辞で扱う。
 * 秘密鍵(ANTHROPIC_API_KEY 等)はここでは扱わない —— サーバ側
 * (Supabase Edge Function)でのみ使用する。詳細は docs/development/tech-stack.md。
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `環境変数 ${name} が未設定です。.env.local を確認してください(.env.example 参照)。`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    "EXPO_PUBLIC_SUPABASE_URL",
  ),
  supabaseAnonKey: required(
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  ),
};
