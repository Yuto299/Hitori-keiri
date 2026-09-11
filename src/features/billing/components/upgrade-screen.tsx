/**
 * アップグレード画面(S-07 / FR-23)。
 *
 * 各課金壁(CSV形式・枚数上限・検索・画像保存・音声メモ)から
 * `?context=` 付きで開かれ、文脈に応じた見出しとプラン比較を出す
 * (docs/requirements/04-screen-design.md §4.6 発火マップ)。
 *
 * 購入(FR-20)は課金基盤(フェーズ6)導入まで未実装。それまでは
 * 「購入機能は準備中」と明示したうえで、開発確認用にプランを切り替える。
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppIcon } from '@/components/app-icon';
import { PLANS, type PlanId } from '@/config/plans';
import { Brand, Palette, Radius, Spacing } from '@/constants/theme';
import { useApp } from '@/shared/app-context';

/** 課金壁の発火文脈(4.6 発火マップ) */
export type UpgradeContext = 'csv' | 'limit' | 'search' | 'image' | 'voice';

interface ContextCopy {
  title: string;
  description: string;
  /** この文脈で必要な最低プラン */
  requiredPlan: Exclude<PlanId, 'free'>;
}

const CONTEXT_COPY: Record<UpgradeContext, ContextCopy> = {
  csv: {
    title: 'freee / マネーフォワード / 弥生 形式で書き出すには Light 以上が必要です',
    description: '会計ソフトにそのまま取り込める形式で、確定申告の入力作業をなくせます。',
    requiredPlan: 'light',
  },
  limit: {
    title: '今月の枚数上限に達しました',
    description: 'Light なら月30枚、Pro なら無制限にレシートを記録できます。',
    requiredPlan: 'light',
  },
  search: {
    title: '過去のレシートを検索するには Pro が必要です',
    description: '日付・金額・店名でいつでも探せます。税務調査や経費の見直しに。',
    requiredPlan: 'pro',
  },
  image: {
    title: '画像を無期限で残すには Pro が必要です',
    description: 'Light は30日で画像が削除されます。Pro なら原本画像をずっと保管できます。',
    requiredPlan: 'pro',
  },
  voice: {
    title: '音声でメモを記録するには Pro が必要です',
    description: '外出直後や運転中でも、話すだけで同席者や目的を残せます。',
    requiredPlan: 'pro',
  },
};

const DEFAULT_COPY: ContextCopy = {
  title: 'プランをアップグレード',
  description: '用途に合わせて Light / Pro を選べます。',
  requiredPlan: 'light',
};

function isUpgradeContext(value: unknown): value is UpgradeContext {
  return typeof value === 'string' && value in CONTEXT_COPY;
}

/** プラン比較表の行 */
const COMPARISON_ROWS: { label: string; value: (plan: PlanId) => string }[] = [
  {
    label: '月間レシート枚数',
    value: (p) => {
      const limit = PLANS[p].features.monthlyReceiptLimit;
      return limit === null ? '無制限' : `${limit}枚`;
    },
  },
  {
    label: '画像の保存',
    value: (p) => {
      const r = PLANS[p].features.imageRetention;
      if (r.kind === 'immediate-delete') return 'なし';
      if (r.kind === 'days') return `${r.days}日`;
      return '無期限';
    },
  },
  { label: '会計ソフト形式CSV', value: (p) => (PLANS[p].features.accountingCsv ? '○' : '−') },
  { label: 'レシート検索', value: (p) => (PLANS[p].features.search ? '○' : '−') },
  { label: '科目のAI学習', value: (p) => (PLANS[p].features.categoryLearning ? '○' : '−') },
  { label: '音声メモ', value: (p) => (PLANS[p].features.voiceMemo ? '○' : '−') },
];

const COMPARED_PLANS: PlanId[] = ['free', 'light', 'pro'];

export function UpgradeScreen() {
  const router = useRouter();
  const { plan, setPlan } = useApp();
  const params = useLocalSearchParams<{ context?: string }>();
  const copy = isUpgradeContext(params.context) ? CONTEXT_COPY[params.context] : DEFAULT_COPY;

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  function choose(target: Exclude<PlanId, 'free'>) {
    // 課金基盤(フェーズ6)導入までは開発確認用の切替。購入処理は未実装。
    setPlan(target);
    goBack();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.nav}>
          <Pressable accessibilityLabel="閉じる" style={styles.navButton} onPress={goBack}>
            <AppIcon color={Palette.text} name="close" size={24} />
          </Pressable>
          <ThemedText style={styles.navTitle}>アップグレード</ThemedText>
          <View style={styles.navButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.title}>{copy.title}</ThemedText>
          <ThemedText type="small" style={styles.description}>
            {copy.description}
          </ThemedText>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHead]}>
              <View style={styles.tableLabelCell} />
              {COMPARED_PLANS.map((p) => (
                <View key={p} style={styles.tableCell}>
                  <ThemedText style={[styles.planName, p === plan && styles.currentPlan]}>
                    {PLANS[p].name}
                  </ThemedText>
                </View>
              ))}
            </View>
            {COMPARISON_ROWS.map((row) => (
              <View key={row.label} style={styles.tableRow}>
                <View style={styles.tableLabelCell}>
                  <ThemedText type="small" style={styles.rowLabel}>
                    {row.label}
                  </ThemedText>
                </View>
                {COMPARED_PLANS.map((p) => (
                  <View key={p} style={styles.tableCell}>
                    <ThemedText type="small">{row.value(p)}</ThemedText>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {(['light', 'pro'] as const).map((p) => {
            const info = PLANS[p];
            const recommended = p === copy.requiredPlan;
            const isCurrent = p === plan;
            return (
              <View
                key={p}
                style={[styles.planCard, recommended && styles.planCardRecommended]}>
                <View style={styles.planCardHeader}>
                  <ThemedText style={styles.planCardName}>{info.name}</ThemedText>
                  {recommended && (
                    <View style={styles.badge}>
                      <ThemedText style={styles.badgeText}>おすすめ</ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={styles.planPrice}>
                  ¥{info.monthlyPriceYen.toLocaleString()}
                  <ThemedText type="small"> /月</ThemedText>
                  {info.yearlyPriceYen !== null && (
                    <ThemedText type="small" style={styles.yearly}>
                      {'  '}年払い ¥{info.yearlyPriceYen.toLocaleString()}
                    </ThemedText>
                  )}
                </ThemedText>
                <Pressable
                  accessibilityLabel={`${info.name}で続ける`}
                  disabled={isCurrent}
                  style={[
                    styles.chooseButton,
                    recommended && styles.chooseButtonPrimary,
                    isCurrent && styles.disabled,
                  ]}
                  onPress={() => choose(p)}>
                  <ThemedText
                    style={[
                      styles.chooseButtonText,
                      recommended && styles.chooseButtonTextPrimary,
                    ]}>
                    {isCurrent ? '現在のプラン' : `${info.name}で続ける`}
                  </ThemedText>
                </Pressable>
              </View>
            );
          })}

          <ThemedText type="small" style={styles.notice}>
            購入機能(App Store / Google Play)は準備中です。現在は開発確認用としてプランを切り替えます。
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
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
  navButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  navTitle: { fontWeight: '800' },
  content: { padding: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.three },
  title: { fontSize: 18, fontWeight: '800', lineHeight: 26 },
  description: { color: Palette.textSecondary },
  table: {
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableRow: {
    alignItems: 'center',
    borderBottomColor: Palette.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  tableHead: { backgroundColor: Palette.backgroundElement },
  tableLabelCell: { flex: 1.4 },
  tableCell: { alignItems: 'center', flex: 1 },
  rowLabel: { color: Palette.textSecondary },
  planName: { fontWeight: '800' },
  currentPlan: { color: Brand.primaryDark },
  planCard: {
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  planCardRecommended: { borderColor: Brand.primary, backgroundColor: Brand.primaryLight },
  planCardHeader: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  planCardName: { fontSize: 17, fontWeight: '800' },
  badge: {
    backgroundColor: Brand.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
  },
  badgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700', lineHeight: 16 },
  planPrice: { fontSize: 22, fontWeight: '800' },
  yearly: { color: Palette.textSecondary },
  chooseButton: {
    alignItems: 'center',
    borderColor: Brand.primary,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.two,
  },
  chooseButtonPrimary: { backgroundColor: Brand.primary },
  chooseButtonText: { color: Brand.primary, fontWeight: '700' },
  chooseButtonTextPrimary: { color: '#ffffff' },
  disabled: { opacity: 0.5 },
  notice: { color: Palette.textSecondary, textAlign: 'center' },
});
