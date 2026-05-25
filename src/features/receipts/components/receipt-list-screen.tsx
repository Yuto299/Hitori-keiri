/**
 * レシート一覧画面(S-04)。
 *
 * ローカルDB のレシートを新しい順に表示。各行タップで詳細(S-05)へ。
 * 検索(FR-13)・未出力/出力済みタブはフェーズ後半。いまは一覧と空状態。
 */

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { categoryName } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import { useReceipts } from '@/features/receipts/hooks/use-receipts';
import { useApp } from '@/shared/app-context';

export function ReceiptListScreen() {
  const router = useRouter();
  const { userId } = useApp();
  const { data: receipts = [], refetch, isLoading } = useReceipts(userId);

  // 画面に戻るたび最新化(保存直後の反映)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          レシート
        </ThemedText>

        {!isLoading && receipts.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText type="small" style={styles.emptyText}>
              まだレシートがありません。
            </ThemedText>
            <ThemedText type="small" style={styles.emptyText}>
              ホームの「レシートを撮る」から追加できます。
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={receipts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: item.id } })}>
                <View style={styles.rowMain}>
                  <ThemedText style={styles.bold}>{item.store}</ThemedText>
                  <ThemedText type="small" style={styles.meta}>
                    {item.date} ・ {categoryName(item.category)}
                  </ThemedText>
                </View>
                <ThemedText style={styles.bold}>¥{item.amountYen.toLocaleString()}</ThemedText>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  title: { marginVertical: Spacing.three },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.one },
  emptyText: { opacity: 0.6, textAlign: 'center' },
  list: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#EBEFEC',
    backgroundColor: '#ffffff',
  },
  rowMain: { gap: 2, flexShrink: 1, paddingRight: Spacing.two },
  meta: { opacity: 0.6 },
  bold: { fontWeight: '600' },
});
