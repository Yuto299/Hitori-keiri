import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppIcon, HomeIllustration, ReceiptAvatar } from '@/components/app-icon';
import { categoryName } from '@/constants/categories';
import { Brand, Spacing } from '@/constants/theme';
import { countReceiptsInMonth, listReceipts } from '@/lib/db/receipt-repository';
import type { Receipt } from '@/shared/types/receipt';
import { useApp } from '@/shared/app-context';

type ReceiptPreview = Pick<Receipt, 'id' | 'date' | 'store' | 'amountYen' | 'category'> & {
  demo?: boolean;
};

const DEMO_RECEIPTS: ReceiptPreview[] = [
  { id: 'demo-starbucks', date: '2026/05/25', store: 'スターバックス', amountYen: 680, category: 'meeting', demo: true },
  { id: 'demo-amazon', date: '2026/05/24', store: 'Amazon.co.jp', amountYen: 2480, category: 'consumables', demo: true },
  { id: 'demo-seven', date: '2026/05/24', store: 'セブン-イレブン', amountYen: 540, category: 'consumables', demo: true },
  { id: 'demo-jr', date: '2026/05/23', store: 'JR東日本', amountYen: 320, category: 'travel', demo: true },
];

/**
 * ホーム画面(S-09)。
 *
 * 今は最小: タイトルと「レシートを撮る」導線。今月の枚数や最近のレシート一覧は
 * フェーズで肉付けする(docs/requirements/04-screen-design.md)。
 */
export default function HomeScreen() {
  const router = useRouter();
  const { userId } = useApp();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [monthlyCount, setMonthlyCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      listReceipts(userId, 4).then(setReceipts);
      countReceiptsInMonth(userId, new Date().toISOString().slice(0, 7)).then(setMonthlyCount);
    }, [userId]),
  );

  const monthlyTotal = useMemo(
    () => receipts.reduce((total, receipt) => total + receipt.amountYen, 0),
    [receipts],
  );
  const displayReceipts: ReceiptPreview[] = receipts.length > 0 ? receipts : DEMO_RECEIPTS;
  const displayMonthlyCount = receipts.length > 0 ? monthlyCount : 12;
  const displayMonthlyTotal = receipts.length > 0 ? monthlyTotal : 24680;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <ThemedText type="small" style={styles.screenLabel}>
                ホーム
              </ThemedText>
              <ThemedText style={styles.greeting}>
                こんにちは、ゆうとさん
              </ThemedText>
            </View>
            <Pressable style={styles.iconButton} onPress={() => router.push('/settings')}>
              <AppIcon color="#14201A" name="settings" size={19} />
            </Pressable>
          </View>

          <View style={styles.summary}>
            <View>
              <ThemedText type="small" style={styles.muted}>
                今月のレシート
              </ThemedText>
              <View style={styles.countRow}>
                <ThemedText style={styles.count}>{displayMonthlyCount}</ThemedText>
                <ThemedText style={styles.countUnit}>件</ThemedText>
              </View>
              <ThemedText type="small" style={styles.amount}>
                ¥{displayMonthlyTotal.toLocaleString()}
              </ThemedText>
            </View>
            <HomeIllustration size={92} />
          </View>

          <Pressable style={styles.primaryButton} onPress={() => router.push('/capture')}>
            <AppIcon color="#ffffff" name="camera" size={22} />
            <ThemedText style={styles.primaryButtonText}>レシートを撮る</ThemedText>
          </Pressable>

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>最近のレシート</ThemedText>
            <Pressable onPress={() => router.push('/explore')}>
              <ThemedText type="small" style={styles.linkText}>すべて見る</ThemedText>
            </Pressable>
          </View>

          <View style={styles.listCard}>
            {displayReceipts.map((receipt) => (
              <Pressable
                key={receipt.id}
                style={styles.receiptRow}
                onPress={() => {
                  if (!receipt.demo) {
                    router.push({ pathname: '/receipt/[id]', params: { id: receipt.id } });
                  }
                }}>
                <View style={styles.receiptIcon}>
                  <ReceiptAvatar accent={receiptAccent(receipt.store)} icon={receiptIcon(receipt.store)} />
                </View>
                <View style={styles.receiptMain}>
                  <ThemedText style={styles.receiptStore}>{receipt.store}</ThemedText>
                  <ThemedText type="small" style={styles.receiptMeta}>
                    {receipt.date} ・ {categoryName(receipt.category)}
                  </ThemedText>
                </View>
                <View style={styles.receiptAmountColumn}>
                  <ThemedText style={styles.receiptAmount}>
                    ¥{receipt.amountYen.toLocaleString()}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function receiptAccent(store: string) {
  if (store.includes('スターバックス')) return '#E4F3EA';
  if (store.includes('Amazon')) return '#EEF3FF';
  if (store.includes('セブン')) return '#FFF2E5';
  if (store.includes('JR')) return '#EDF5F1';
  return '#F2F4F3';
}

function receiptIcon(store: string) {
  if (store.includes('JR')) return 'export' as const;
  return 'receipt' as const;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFA' },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  content: { paddingTop: Spacing.two, paddingBottom: Spacing.six, gap: Spacing.three },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  screenLabel: { color: '#11181C', fontWeight: '700' },
  greeting: { fontSize: 17, fontWeight: '800', lineHeight: 24, marginTop: Spacing.three },
  iconButton: {
    alignItems: 'center',
    borderColor: '#E3E8E4',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  muted: { color: '#66736C' },
  countRow: { alignItems: 'flex-end', flexDirection: 'row', gap: Spacing.one },
  count: { color: '#11181C', fontSize: 42, fontWeight: '800', lineHeight: 48 },
  countUnit: { fontSize: 18, fontWeight: '700', marginBottom: 7 },
  amount: { color: '#66736C', marginTop: Spacing.one },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Brand.primary,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    alignSelf: 'stretch',
    shadowColor: Brand.primary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '600' },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sectionTitle: { fontWeight: '700' },
  linkText: { color: '#66736C' },
  listCard: { gap: Spacing.one },
  receiptRow: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Spacing.two,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  receiptIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  receiptMain: { flex: 1, gap: 2 },
  receiptStore: { fontWeight: '700' },
  receiptMeta: { color: '#66736C' },
  receiptAmountColumn: {
    alignItems: 'flex-end',
    minWidth: 76,
  },
  receiptAmount: { fontSize: 17, fontWeight: '800', textAlign: 'right' },
});
