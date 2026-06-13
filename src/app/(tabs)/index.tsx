import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppIcon, HomeIllustration } from '@/components/app-icon';
import { Brand, Palette, Radius, Spacing } from '@/constants/theme';
import { ReceiptRow } from '@/features/receipts/components/receipt-row';
import { DEMO_RECEIPTS, type ReceiptPreview } from '@/features/receipts/demo-receipts';
import {
  countReceiptsInMonth,
  listReceipts,
  sumReceiptsInMonth,
} from '@/lib/db/receipt-repository';
import type { Receipt } from '@/shared/types/receipt';
import { useApp } from '@/shared/app-context';

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * ホーム画面(S-09)。
 *
 * 今月のサマリー(枚数・合計)と撮影導線、最近のレシート4件。
 * レシートが1件もない間はサンプルを表示する(「サンプル」バッジで明示)。
 */
export default function HomeScreen() {
  const router = useRouter();
  const { userId } = useApp();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      listReceipts(userId, 4).then(setReceipts);
      countReceiptsInMonth(userId, currentYearMonth()).then(setMonthlyCount);
      sumReceiptsInMonth(userId, currentYearMonth()).then(setMonthlyTotal);
    }, [userId]),
  );

  const isDemo = receipts.length === 0;
  const displayReceipts: ReceiptPreview[] = isDemo ? DEMO_RECEIPTS : receipts;
  const displayMonthlyCount = isDemo ? DEMO_RECEIPTS.length : monthlyCount;
  const displayMonthlyTotal = isDemo
    ? DEMO_RECEIPTS.reduce((total, r) => total + r.amountYen, 0)
    : monthlyTotal;

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
            <Pressable
              accessibilityLabel="設定を開く"
              style={styles.iconButton}
              onPress={() => router.push('/settings')}>
              <AppIcon color={Palette.text} name="settings" size={19} />
            </Pressable>
          </View>

          <View style={styles.summary}>
            <View>
              <View style={styles.summaryLabelRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  今月のレシート
                </ThemedText>
                {isDemo && (
                  <View style={styles.demoBadge}>
                    <ThemedText style={styles.demoBadgeText}>サンプル</ThemedText>
                  </View>
                )}
              </View>
              <View style={styles.countRow}>
                <ThemedText style={styles.count}>{displayMonthlyCount}</ThemedText>
                <ThemedText style={styles.countUnit}>件</ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.amount}>
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
              <ThemedText type="small" themeColor="textSecondary">
                すべて見る
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.listCard}>
            {displayReceipts.map((receipt) => (
              <ReceiptRow
                key={receipt.id}
                receipt={receipt}
                onPress={
                  receipt.demo
                    ? undefined
                    : () => router.push({ pathname: '/receipt/[id]', params: { id: receipt.id } })
                }
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.backgroundScreen },
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
  screenLabel: { fontWeight: '700' },
  greeting: { fontSize: 17, fontWeight: '800', lineHeight: 24, marginTop: Spacing.three },
  iconButton: {
    alignItems: 'center',
    borderColor: Palette.border,
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
  summaryLabelRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  demoBadge: {
    backgroundColor: Palette.backgroundElement,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
  },
  demoBadgeText: { color: Palette.textSecondary, fontSize: 11, fontWeight: '700', lineHeight: 16 },
  countRow: { alignItems: 'flex-end', flexDirection: 'row', gap: Spacing.one },
  count: { fontSize: 42, fontWeight: '800', lineHeight: 48 },
  countUnit: { fontSize: 18, fontWeight: '700', marginBottom: 7 },
  amount: { marginTop: Spacing.one },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Brand.primary,
    borderRadius: Radius.md,
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
  primaryButtonText: { color: '#ffffff', fontWeight: '700' },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sectionTitle: { fontWeight: '700' },
  listCard: { gap: Spacing.one },
});
