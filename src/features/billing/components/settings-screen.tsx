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
import { Pressable, StyleSheet, View } from 'react-native';
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

  const remaining = remainingReceipts(plan, used);
  const limit = PLANS[plan].features.monthlyReceiptLimit;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          設定
        </ThemedText>

        <View style={styles.card}>
          <ThemedText type="small" style={styles.cardLabel}>
            ご利用中のプラン
          </ThemedText>
          <ThemedText type="subtitle">{PLANS[plan].name}</ThemedText>
          <ThemedText type="small" style={styles.usage}>
            今月の利用: {used} 枚
            {limit !== null ? ` / ${limit} 枚(残り ${remaining})` : '(無制限)'}
          </ThemedText>
        </View>

        <ThemedText type="small" style={styles.devLabel}>
          プラン切替(開発用 / 課金導入で置き換え)
        </ThemedText>
        <View style={styles.planRow}>
          {PLAN_IDS.map((id) => (
            <Pressable
              key={id}
              onPress={() => setPlan(id)}
              style={[styles.planChip, plan === id && styles.planChipActive]}>
              <ThemedText style={plan === id ? styles.planChipTextActive : undefined}>
                {PLANS[id].name}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  title: { marginVertical: Spacing.three },
  card: {
    borderWidth: 1,
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryLight,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardLabel: { color: Brand.primaryDark },
  usage: { opacity: 0.7 },
  devLabel: { opacity: 0.6, marginTop: Spacing.four, marginBottom: Spacing.two },
  planRow: { flexDirection: 'row', gap: Spacing.two },
  planChip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#D6DED9',
  },
  planChipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  planChipTextActive: { color: '#ffffff', fontWeight: '600' },
});
