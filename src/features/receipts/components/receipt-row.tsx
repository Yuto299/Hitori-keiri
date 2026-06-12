/**
 * レシート1件の行表示。ホーム(S-09)と一覧(S-04)で共用する。
 *
 * - アバターの背景色は店名から決定的に選ぶ(特定店名のハードコードはしない)
 * - サンプルデータには「サンプル」バッジを付け、タップさせない
 */

import { Pressable, StyleSheet, View } from 'react-native';

import { ReceiptAvatar } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { categoryName } from '@/constants/categories';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { ReceiptPreview } from '@/features/receipts/demo-receipts';

/** 淡いパステル(やさしいミニマルのトーンに合わせた4色) */
const AVATAR_ACCENTS = ['#E8F7EF', '#EEF3FF', '#FFF2E5', '#EDF5F1'];

function accentFor(store: string): string {
  let hash = 0;
  for (let i = 0; i < store.length; i++) {
    hash = (hash * 31 + store.charCodeAt(i)) >>> 0;
  }
  return AVATAR_ACCENTS[hash % AVATAR_ACCENTS.length];
}

export function ReceiptRow({
  receipt,
  onPress,
}: {
  receipt: ReceiptPreview;
  /** サンプル行では渡さない(押せない行にする) */
  onPress?: () => void;
}) {
  return (
    <Pressable disabled={!onPress} style={styles.row} onPress={onPress}>
      <ReceiptAvatar accent={accentFor(receipt.store)} />
      <View style={styles.main}>
        <View style={styles.storeRow}>
          <ThemedText numberOfLines={1} style={styles.store}>
            {receipt.store}
          </ThemedText>
          {receipt.demo && (
            <View style={styles.demoBadge}>
              <ThemedText style={styles.demoBadgeText}>サンプル</ThemedText>
            </View>
          )}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {receipt.date} ・ {categoryName(receipt.category)}
        </ThemedText>
      </View>
      <View style={styles.amountColumn}>
        <ThemedText style={styles.amount}>¥{receipt.amountYen.toLocaleString()}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  main: { flex: 1, gap: 2, minWidth: 0 },
  storeRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  store: { flexShrink: 1, fontWeight: '700' },
  demoBadge: {
    backgroundColor: Palette.backgroundElement,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
  },
  demoBadgeText: { color: Palette.textSecondary, fontSize: 11, fontWeight: '700', lineHeight: 16 },
  amountColumn: { alignItems: 'flex-end', minWidth: 76 },
  amount: { fontSize: 17, fontWeight: '800', textAlign: 'right' },
});
