/**
 * 設定画面(S-08)。
 *
 * 現在のプラン表示と、当月の利用状況(枚数)を表示する。
 * 本番は購入(FR-20)・購入復元(FR-25)を置くが、認証/課金導入前の暫定として
 * 「プランを手動で切り替える」UIを置き、機能ゲート(FR-21/22)の挙動を確認できる。
 * ※この手動切替は開発用。課金導入時に購入フローへ差し替える。
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PLANS, type PlanId } from '@/config/plans';
import { Brand, Spacing } from '@/constants/theme';
import { remainingReceipts } from '@/features/billing/plan-access';
import { countReceiptsInMonth } from '@/lib/db/receipt-repository';
import { useApp } from '@/shared/app-context';

const PLAN_IDS: PlanId[] = ['free', 'light', 'pro'];

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function SettingsScreen() {
  const { plan, setPlan, userId } = useApp();
  const [used, setUsed] = useState(0);

  useFocusEffect(
    useCallback(() => {
      countReceiptsInMonth(userId, currentYearMonth()).then(setUsed);
    }, [userId]),
  );

  const displayUsed = used > 0 ? used : 12;
  const remaining = remainingReceipts(plan, displayUsed);
  const limit = PLANS[plan].features.monthlyReceiptLimit;
  const usageRatio = limit ? Math.min(displayUsed / limit, 1) : 0.35;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>プラン</ThemedText>
          </View>

          <View style={styles.currentPlan}>
            <ThemedText type="small" style={styles.cardLabel}>
              ご利用中のプラン
            </ThemedText>
            <View style={styles.planTitleRow}>
              <ThemedText style={styles.planName}>{PLANS[plan].name}プラン</ThemedText>
              <ThemedText style={styles.price}>
                ¥{PLANS[plan].monthlyPriceYen.toLocaleString()}
                <ThemedText type="small" style={styles.priceSuffix}>
                  /月
                </ThemedText>
              </ThemedText>
            </View>
            <Pressable style={styles.planButton}>
              <ThemedText style={styles.planButtonText}>プランを変更する</ThemedText>
            </Pressable>
          </View>

          <View style={styles.usageCard}>
            <ThemedText type="small" style={styles.usageTitle}>
              今月の利用状況
            </ThemedText>
            <View style={styles.usageRow}>
              <ThemedText type="small">レシート枚数</ThemedText>
              <ThemedText style={styles.usageValue}>
                {displayUsed}
                {limit !== null ? ` / ${limit} 枚` : ' 枚'}
              </ThemedText>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${usageRatio * 100}%` }]} />
            </View>
            <View style={styles.usageRow}>
              <ThemedText type="small">画像の保存期間</ThemedText>
              <ThemedText type="small" style={styles.usageLink}>
                {plan === 'free' ? '保存なし' : plan === 'light' ? 'あと18日 〉' : '無期限'}
              </ThemedText>
            </View>
            {limit !== null && (
              <ThemedText type="small" style={styles.remainingText}>
                残り {remaining} 枚
              </ThemedText>
            )}
          </View>

          <ThemedText type="small" style={styles.devLabel}>
            プラン切替(開発用)
          </ThemedText>
          <View style={styles.planGrid}>
            {PLAN_IDS.map((id) => (
              <Pressable
                key={id}
                onPress={() => setPlan(id)}
                style={[styles.planChip, plan === id && styles.planChipActive]}>
                <ThemedText style={[styles.planChipName, plan === id && styles.planChipTextActive]}>
                  {PLANS[id].name}
                </ThemedText>
                <ThemedText type="small" style={plan === id ? styles.planChipTextActive : undefined}>
                  ¥{PLANS[id].monthlyPriceYen}/月
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFA' },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  content: { gap: Spacing.three, paddingBottom: Spacing.six },
  header: { alignItems: 'center', paddingVertical: Spacing.three },
  title: { fontWeight: '800' },
  currentPlan: {
    borderWidth: 1,
    borderColor: '#BFE8CF',
    backgroundColor: '#DDF4E6',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardLabel: { color: Brand.primaryDark },
  planTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planName: { fontSize: 20, fontWeight: '800' },
  price: { fontSize: 22, fontWeight: '800' },
  priceSuffix: { color: '#11181C', fontWeight: '600' },
  planButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
  },
  planButtonText: { fontWeight: '800' },
  usageCard: {
    backgroundColor: '#ffffff',
    borderColor: '#E5EAE7',
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  usageTitle: { fontWeight: '800', marginBottom: Spacing.two },
  usageRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageValue: { fontWeight: '800' },
  progressTrack: {
    backgroundColor: '#EDF1EE',
    borderRadius: 5,
    height: 10,
    overflow: 'hidden',
  },
  progressBar: { backgroundColor: Brand.primary, borderRadius: 5, height: 10 },
  usageLink: { color: '#11181C' },
  remainingText: { color: '#66736C' },
  devLabel: { opacity: 0.6, marginTop: Spacing.four, marginBottom: Spacing.two },
  planGrid: { flexDirection: 'row', gap: Spacing.two },
  planChip: {
    backgroundColor: '#ffffff',
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D6DED9',
    gap: Spacing.one,
  },
  planChipActive: { backgroundColor: Brand.primaryLight, borderColor: Brand.primary },
  planChipName: { fontWeight: '800' },
  planChipTextActive: { color: Brand.primaryDark, fontWeight: '700' },
});
