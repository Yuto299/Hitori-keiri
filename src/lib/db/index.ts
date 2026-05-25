/**
 * ローカルDB(expo-sqlite)の初期化とアクセス
 *
 * openDatabaseAsync で 1 接続を共有し、起動時に migrate() を呼んで
 * スキーマを最新へ。アプリ全体は getDb() から DB を取得する。
 */

import * as SQLite from 'expo-sqlite';

import { DB_NAME, MIGRATIONS, SCHEMA_VERSION } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** 共有 DB 接続を取得(初回はオープン + マイグレーション) */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrate(db);
  return db;
}

/**
 * user_version を見て未適用のマイグレーションだけ順に流す。
 */
export async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;',
  );
  const current = row?.user_version ?? 0;

  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    const ddl = MIGRATIONS[v];
    if (!ddl) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(ddl);
    });
    // PRAGMA はパラメータバインドできないため数値を直接埋め込む(v は内部定数)
    await db.execAsync(`PRAGMA user_version = ${v};`);
  }
}

/** テスト・サインアウト用にキャッシュした接続を破棄する */
export function resetDbForTests(): void {
  dbPromise = null;
}
