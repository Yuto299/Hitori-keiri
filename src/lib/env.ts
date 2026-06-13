/**
 * 環境変数の型付き読み出し
 *
 * Expo はクライアント公開変数を `EXPO_PUBLIC_` 接頭辞で扱う。
 * 秘密鍵(ANTHROPIC_API_KEY 等)はここでは扱わない —— サーバ側
 * (Supabase Edge Function)でのみ使用する。詳細は docs/development/tech-stack.md。
 *
 * Supabase はオプショナル(未設定でもアプリは動く)。未設定時は
 * env.supabase が null になり、ログインせずローカル限定で利用する。
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const env = {
  /** Supabase が設定されていれば url/anonKey を返す。未設定なら null。 */
  supabase:
    supabaseUrl && supabaseAnonKey
      ? { url: supabaseUrl, anonKey: supabaseAnonKey }
      : null,
  /** OCR を強制的にモックにする(開発用。API コストをかけずに UI を触る) */
  ocrMock: process.env.EXPO_PUBLIC_OCR_MOCK === '1',
};

export function isSupabaseConfigured(): boolean {
  return env.supabase !== null;
}
