/**
 * レシート画像の Supabase Storage 操作(FR-12)
 *
 * 設計: docs/development/image-storage.md
 * - バケット `receipts`(プライベート)/ パス <user_id>/<receipt_id>.jpg
 * - アップロード前に幅 1280px の JPEG へ縮小(転送量・容量の節約)
 * - 表示は署名付きURL(短命)。Supabase 未設定・未サインインなら null を返し、呼び出し側はローカルで完結
 *
 * Receipt.imagePath は「Storage のパス」か「端末ローカルURI」のどちらか。
 * isRemoteImagePath で見分ける(ローカルURIは file:/blob:/data:/content:/http で始まる)。
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { getSupabase } from './client';
import { readImageBytes } from './read-image-bytes';

export const RECEIPTS_BUCKET = 'receipts';

/** アップロード時の幅。OCR送信と同じ基準(ocr-service.claude.ts) */
const UPLOAD_WIDTH = 1280;

/** 署名付きURLの有効期間(秒) */
const SIGNED_URL_TTL = 60 * 10;

/** Storage のパス(<user_id>/<receipt_id>.jpg)か、端末ローカルのURIかを判定 */
export function isRemoteImagePath(path: string): boolean {
  return !/^(file|blob|data|content|https?|ph|assets-library):/i.test(path);
}

export function receiptImagePath(userId: string, receiptId: string): string {
  return `${userId}/${receiptId}.jpg`;
}

/** サインイン中の Supabase クライアント。未設定・未サインインなら null */
async function getSignedInClient() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session ? supabase : null;
}

/** 幅 1280px の JPEG に縮小して URI を返す。失敗時は元URIのまま(アップロードは続行) */
async function toUploadJpeg(imageUri: string): Promise<string> {
  try {
    const context = ImageManipulator.manipulate(imageUri);
    context.resize({ width: UPLOAD_WIDTH, height: null });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
    return saved.uri;
  } catch (e) {
    console.warn('[storage] resize skipped:', e);
    return imageUri;
  }
}

/**
 * 画像をアップロードし、Storage のパスを返す。
 * Supabase 未設定・未サインインなら null(ローカル参照のまま運用)。
 */
export async function uploadReceiptImage(
  receiptId: string,
  userId: string,
  imageUri: string,
): Promise<string | null> {
  const supabase = await getSignedInClient();
  if (!supabase) return null;

  const jpegUri = await toUploadJpeg(imageUri);
  const bytes = await readImageBytes(jpegUri);
  const path = receiptImagePath(userId, receiptId);
  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

/** 表示用の署名付きURL。取得できなければ null */
export async function getReceiptImageUrl(path: string): Promise<string | null> {
  const supabase = await getSignedInClient();
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error) return null;
  return data.signedUrl;
}

/** Storage から削除。未設定・未サインインなら何もしない */
export async function deleteReceiptImage(path: string): Promise<void> {
  const supabase = await getSignedInClient();
  if (!supabase) return;
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
  if (error) throw error;
}
