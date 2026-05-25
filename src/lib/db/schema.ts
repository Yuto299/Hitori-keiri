/**
 * ローカルDB(expo-sqlite)のスキーマ定義とマイグレーション
 *
 * オフラインでの撮影・閲覧(第7章 7.3)のため、レシートはまず端末の
 * SQLite に保存し、オンライン時に Supabase へ同期する(同期はフェーズ3)。
 *
 * memo は JSON 文字列として 1 カラムに格納する(ReceiptMemo をシリアライズ)。
 */

export const DB_NAME = 'hitori-keiri.db';

/** スキーマバージョン。マイグレーション追加時にインクリメントする。 */
export const SCHEMA_VERSION = 1;

/**
 * 各バージョンで実行する DDL。
 * user_version(PRAGMA)で現在の適用済みバージョンを管理し、差分のみ適用する。
 */
export const MIGRATIONS: Record<number, string> = {
  1: `
    CREATE TABLE IF NOT EXISTS receipts (
      id            TEXT PRIMARY KEY NOT NULL,
      user_id       TEXT NOT NULL,
      date          TEXT NOT NULL,          -- YYYY-MM-DD
      amount_yen    INTEGER NOT NULL,       -- 税込合計(円・整数)
      store         TEXT NOT NULL,
      category      TEXT NOT NULL,          -- CategoryId
      memo          TEXT NOT NULL DEFAULT '{}', -- ReceiptMemo を JSON 文字列で
      image_status  TEXT NOT NULL,          -- 'stored' | 'deleted'
      image_path    TEXT,
      captured_plan TEXT NOT NULL,          -- 'free' | 'light' | 'pro'
      created_at    TEXT NOT NULL,          -- ISO datetime
      updated_at    TEXT NOT NULL           -- ISO datetime
    );
    CREATE INDEX IF NOT EXISTS idx_receipts_user_date
      ON receipts (user_id, date DESC);
  `,
};
