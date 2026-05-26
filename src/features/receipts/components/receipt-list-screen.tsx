/**
 * レシート一覧画面(S-04)。
 *
 * ローカルDB のレシートを新しい順に表示。各行タップで詳細(S-05)へ。
 * 検索(FR-13)・未出力/出力済みタブはフェーズ後半。いまは一覧と空状態。
 */

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppIcon } from '@/components/app-icon';
import { categoryName } from '@/constants/categories';
import { Brand, Spacing } from '@/constants/theme';
import { useReceipts } from '@/features/receipts/hooks/use-receipts';
import { useApp } from '@/shared/app-context';
import type { Receipt } from '@/shared/types/receipt';

type ReceiptPreview = Pick<Receipt, 'id' | 'date' | 'store' | 'amountYen' | 'category'> & {
  demo?: boolean;
};

const DEMO_RECEIPTS: ReceiptPreview[] = [
  { id: 'demo-familymart', date: '2026/05/25', store: 'ファミリーマート', amountYen: 280, category: 'consumables', demo: true },
  { id: 'demo-starbucks', date: '2026/05/24', store: 'スターバックス', amountYen: 680, category: 'meeting', demo: true },
  { id: 'demo-amazon', date: '2026/05/24', store: 'Amazon.co.jp', amountYen: 2480, category: 'consumables', demo: true },
];

export function ReceiptListScreen() {
  const router = useRouter();
  const { userId } = useApp();
  const { data: receipts = [], refetch, isLoading } = useReceipts(userId);
  const [filter, setFilter] = useState<'all' | 'pending' | 'exported'>('all');
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
    return source.filter((receipt) => {
      if (filter !== 'all') return false;
      if (!normalized) return true;
      return `${receipt.date} ${receipt.store} ${receipt.amountYen}`.toLowerCase().includes(normalized);
    });
  }, [filter, query, receipts]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <ThemedText style={styles.title}>レシート一覧</ThemedText>
          <Pressable style={styles.iconButton}>
            <AppIcon color="#14201A" name="settings" size={19} />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <AppIcon color="#6B7770" name="search" size={19} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="日付・店名・金額で検索"
            />
          </View>
          <Pressable style={styles.filterButton}>
            <AppIcon color="#14201A" name="filter" size={20} />
          </Pressable>
        </View>

        <View style={styles.tabs}>
          <TabButton active={filter === 'all'} label="すべて" onPress={() => setFilter('all')} />
          <TabButton active={filter === 'pending'} label="未出力" onPress={() => setFilter('pending')} />
          <TabButton
            active={filter === 'exported'}
            label="出力済み"
            onPress={() => setFilter('exported')}
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
              <Pressable
                style={styles.row}
                onPress={() => {
                  if (!item.demo) {
                    router.push({ pathname: '/receipt/[id]', params: { id: item.id } });
                  }
                }}>
                <View style={styles.rowIcon}>
                  <AppIcon color="#14201A" name="receipt" size={19} />
                </View>
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

function TabButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <ThemedText type="small" style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFA' },
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
    borderColor: '#E3E8E4',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  searchRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#DDE4E0',
    borderRadius: Spacing.two,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  searchInput: { color: '#11181C', flex: 1, fontSize: 14, paddingVertical: Spacing.two },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#DDE4E0',
    borderRadius: Spacing.two,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  tabs: {
    borderBottomColor: '#DDE4E0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: Spacing.two,
  },
  tabButton: { alignItems: 'center', flex: 1, paddingVertical: Spacing.two },
  tabButtonActive: { borderBottomColor: Brand.primary, borderBottomWidth: 2 },
  tabText: { color: '#6B7770', fontWeight: '700' },
  tabTextActive: { color: Brand.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.one },
  emptyText: { opacity: 0.6, textAlign: 'center' },
  list: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: '#ffffff',
  },
  rowIcon: {
    alignItems: 'center',
    backgroundColor: '#F2F4F3',
    borderRadius: Spacing.two,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  rowMain: { gap: 2, flexShrink: 1, paddingRight: Spacing.two },
  meta: { color: '#66736C' },
  bold: { fontWeight: '700' },
});
