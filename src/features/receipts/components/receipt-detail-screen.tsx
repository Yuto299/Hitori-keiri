/**
 * レシート詳細画面(S-05)。
 *
 * 1件の内容を表示し、削除できる(FR-14)。画像は保存ポリシー(FR-12)で
 * 「画像は削除済み(テキストのみ)」と出る場合がある(Free / 期限切れLight)。
 * 編集機能はフェーズ後半(確認画面の再利用)。
 */

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { categoryName } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import { deleteReceipt, getReceipt } from '@/lib/db/receipt-repository';
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

  function confirmDelete() {
    if (!receipt) return;
    Alert.alert('削除しますか?', 'このレシートを削除します。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await deleteReceipt(receipt.id);
          router.back();
        },
      },
    ]);
  }

  if (loaded && !receipt) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ThemedText>レシートが見つかりません</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
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
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: Spacing.four, gap: Spacing.three },
  imageBox: {
    height: 180,
    borderRadius: Spacing.two,
    backgroundColor: '#F4F6F5',
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
    borderBottomColor: '#EBEFEC',
  },
  rowLabel: { opacity: 0.6 },
  rowValue: { fontWeight: '600' },
  deleteButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#E0B4B4',
    alignItems: 'center',
  },
  deleteText: { color: '#C0392B', fontWeight: '600' },
});
