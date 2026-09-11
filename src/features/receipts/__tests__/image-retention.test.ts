/** @jest-environment node */
import { imageExpiresAt, isImageExpired, retentionLabel } from '../image-retention';

const created = { createdAt: '2026-05-01T00:00:00.000Z', imageStatus: 'stored' as const };

describe('画像保存ポリシー(FR-12)', () => {
  test('Pro は無期限', () => {
    expect(isImageExpired(created, 'pro', new Date('2030-01-01T00:00:00Z'))).toBe(false);
    expect(imageExpiresAt(created, 'pro')).toBeNull();
  });

  test('Light は30日で期限切れ', () => {
    expect(imageExpiresAt(created, 'light')).toBe('2026-05-31T00:00:00.000Z');
    expect(isImageExpired(created, 'light', new Date('2026-05-30T23:59:59Z'))).toBe(false);
    expect(isImageExpired(created, 'light', new Date('2026-05-31T00:00:00Z'))).toBe(true);
  });

  test('Free は保存中の画像があれば即期限切れ(ダウングレード時の扱い)', () => {
    expect(isImageExpired(created, 'free', new Date('2026-05-01T00:00:01Z'))).toBe(true);
  });

  test('既に削除済みなら常に false', () => {
    expect(isImageExpired({ ...created, imageStatus: 'deleted' }, 'free')).toBe(false);
  });

  test('保存ポリシーの文言', () => {
    expect(retentionLabel('free')).toContain('保存なし');
    expect(retentionLabel('light')).toBe('30日間');
    expect(retentionLabel('pro')).toBe('無期限');
  });
});
