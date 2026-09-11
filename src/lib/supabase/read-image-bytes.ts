/**
 * 画像URIをバイト列として読む(ネイティブ実装)
 *
 * SDK 55 の File API で file:// を読む。Web は read-image-bytes.web.ts(fetch)。
 */

import { File } from 'expo-file-system';

export async function readImageBytes(uri: string): Promise<Uint8Array> {
  return new File(uri).bytes();
}
