/**
 * レシート詳細画面(S-05)。
 *
 * 1件の内容を表示し、削除できる(FR-14)。画像は保存ポリシー(FR-12)で
 * 「画像は削除済み(テキストのみ)」と出る場合がある(Free / 期限切れLight)。
 * 編集機能はフェーズ後半(確認画面の再利用)。
 */

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppIcon } from '@/components/app-icon';
import { categoryName } from '@/constants/categories';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getReceipt } from '@/lib/db/receipt-repository';
import { deleteReceiptSynced } from '@/lib/sync/receipt-sync';
import { confirmAsync } from '@/shared/alert';
import type { Receipt } from '@/shared/types/receipt';

export function ReceiptDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!id) return;
        const r = await getReceipt(id);
        if (active) {
          setReceipt(r);
          setLoaded(true);
        }
      })();
      return () => {
        active = false;
      };
    }, [id]),
  );

  // 履歴がない(URL直叩き・リロード)場合は一覧へ戻す
  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/explore');
    }
  }

  async function confirmDelete() {
    if (!receipt) return;
    const ok = await confirmAsync('削除しますか?', 'このレシートを削除します。', '削除');
    if (!ok) return;
    await deleteReceiptSynced(receipt.id);
    goBack();
  }

  const header = (
    <View style={styles.nav}>
      <Pressable accessibilityLabel="戻る" style={styles.backButton} onPress={goBack}>
        <AppIcon color={Palette.text} name="back" size={24} />
      </Pressable>
      <ThemedText style={styles.navTitle}>レシート詳細</ThemedText>
      <View style={styles.backButton} />
    </View>
  );

  if (loaded && !receipt) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {header}
          <View style={styles.centered}>
            <ThemedText>レシートが見つかりません</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {header}
        {receipt && (
          <View style={styles.body}>
            <View style={styles.imageBox}>
              {receipt.imageStatus === 'stored' && receipt.imagePath ? (
                <Image source={{ uri: receipt.imagePath }} style={styles.image} resizeMode="contain" />
              ) : (
                <ThemedText type="small" style={styles.imageDeleted}>
                  画像は削除済み(テキストのみ保持)
                </ThemedText>
              )}
            </View>

            <Row label="日付" value={receipt.date} />
            <Row label="金額" value={`¥${receipt.amountYen.toLocaleString()}`} />
            <Row label="店名" value={receipt.store} />
            <Row label="勘定科目" value={categoryName(receipt.category)} />
            {receipt.memo.note ? <Row label="メモ" value={receipt.memo.note} /> : null}

            <Pressable style={styles.deleteButton} onPress={confirmDelete}>
              <ThemedText style={styles.deleteText}>削除</ThemedText>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" style={styles.rowLabel}>
        {label}
      </ThemedText>
      <ThemedText style={styles.rowValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.backgroundScreen },
  safeArea: { flex: 1 },
  nav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  navTitle: { fontWeight: '800' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: Spacing.four, gap: Spacing.three },
  imageBox: {
    height: 180,
    borderRadius: Radius.md,
    backgroundColor: Palette.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  imageDeleted: { opacity: 0.6 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
  rowLabel: { opacity: 0.6 },
  rowValue: { fontWeight: '600' },
  deleteButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E0B4B4',
    alignItems: 'center',
  },
  deleteText: { color: '#C0392B', fontWeight: '600' },
});
