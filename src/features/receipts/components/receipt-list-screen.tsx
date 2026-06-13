/**
 * レシート一覧画面(S-04)。
 *
 * ローカルDB のレシートを新しい順に表示。各行タップで詳細(S-05)へ。
 * 未出力/出力済みフィルタ(FR-13 周辺)はフェーズ後半で実装するため、
 * それまでは UI 自体を置かない(押せるのに動かないUIを作らない)。
 */

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppIcon } from '@/components/app-icon';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { ReceiptRow } from '@/features/receipts/components/receipt-row';
import { DEMO_RECEIPTS, type ReceiptPreview } from '@/features/receipts/demo-receipts';
import { useReceipts } from '@/features/receipts/hooks/use-receipts';
import { useApp } from '@/shared/app-context';

export function ReceiptListScreen() {
  const router = useRouter();
  const { userId } = useApp();
  const { data: receipts = [], refetch, isLoading } = useReceipts(userId);
  const [query, setQuery] = useState('');

  // 画面に戻るたび最新化(保存直後の反映)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const filteredReceipts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const source: ReceiptPreview[] = receipts.length > 0 ? receipts : DEMO_RECEIPTS;
    if (!normalized) return source;
    return source.filter((receipt) =>
      `${receipt.date} ${receipt.store} ${receipt.amountYen}`.toLowerCase().includes(normalized),
    );
  }, [query, receipts]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <ThemedText style={styles.title}>レシート一覧</ThemedText>
          <Pressable
            accessibilityLabel="設定を開く"
            style={styles.iconButton}
            onPress={() => router.push('/settings')}>
            <AppIcon color={Palette.text} name="settings" size={19} />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <AppIcon color={Palette.textSecondary} name="search" size={19} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="日付・店名・金額で検索"
          />
        </View>

        {!isLoading && filteredReceipts.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText type="small" style={styles.emptyText}>
              表示できるレシートがありません。
            </ThemedText>
            <ThemedText type="small" style={styles.emptyText}>
              ホームの「レシートを撮る」から追加できます。
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredReceipts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ReceiptRow
                receipt={item}
                onPress={
                  item.demo
                    ? undefined
                    : () => router.push({ pathname: '/receipt/[id]', params: { id: item.id } })
                }
              />
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.backgroundScreen },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  title: { fontWeight: '800' },
  headerSpacer: { width: 36 },
  iconButton: {
    alignItems: 'center',
    borderColor: Palette.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  searchInput: { color: Palette.text, flex: 1, fontSize: 14, paddingVertical: Spacing.two + 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.one },
  emptyText: { opacity: 0.6, textAlign: 'center' },
  list: { gap: Spacing.two, paddingBottom: Spacing.six },
});
