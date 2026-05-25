import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';

/**
 * ホーム画面(プレースホルダ)。
 *
 * 設計上は S-09(今月の枚数・最近のレシート・「レシートを撮る」)。
 * 実体は features/ 配下で組み立てる予定(docs/requirements/04-screen-design.md)。
 * いまは足場確認用の最小表示。
 */
export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          ひとり経理
        </ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          レシートを撮るだけ。
        </ThemedText>
        <ThemedText type="small" style={styles.note}>
          ※ 画面は順次実装します(ホーム S-09)
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
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  title: { color: Brand.primary, textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  note: { opacity: 0.6, textAlign: 'center' },
});
