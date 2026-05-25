import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/**
 * レシート一覧画面(プレースホルダ)。
 *
 * 設計上は S-04(一覧・検索・「未出力/出力済み」タブ)。
 * 実体は features/receipts 配下で組み立てる予定
 * (docs/requirements/04-screen-design.md)。いまは足場確認用の最小表示。
 */
export default function ReceiptsScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          レシート
        </ThemedText>
        <ThemedText type="small" style={styles.note}>
          ※ 画面は順次実装します(一覧 S-04 / 検索 FR-13)
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
  title: { textAlign: 'center' },
  note: { opacity: 0.6, textAlign: 'center' },
});
