import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useApp } from '@/shared/app-context';

/**
 * ホーム画面(S-09)。
 *
 * 今は最小: タイトルと「レシートを撮る」導線。今月の枚数や最近のレシート一覧は
 * フェーズで肉付けする(docs/requirements/04-screen-design.md)。
 */
export default function HomeScreen() {
  const router = useRouter();
  const { plan } = useApp();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          ひとり経理
        </ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          レシートを撮るだけ。
        </ThemedText>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/capture')}>
          <ThemedText style={styles.primaryButtonText}>📷 レシートを撮る</ThemedText>
        </Pressable>

        <ThemedText type="small" style={styles.note}>
          現在のプラン: {plan.toUpperCase()}
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  title: { color: Brand.primary, textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  primaryButton: {
    backgroundColor: Brand.primary,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.three,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '600' },
  note: { opacity: 0.6, textAlign: 'center' },
});
