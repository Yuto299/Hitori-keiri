/**
 * 画像URIをバイト列として読む(Web実装)
 *
 * blob: / data: / http(s): をブラウザの fetch で読む。
 */

export async function readImageBytes(uri: string): Promise<Uint8Array> {
  const res = await fetch(uri);
  if (!res.ok) throw new Error('画像の読み込みに失敗しました');
  return new Uint8Array(await res.arrayBuffer());
}
