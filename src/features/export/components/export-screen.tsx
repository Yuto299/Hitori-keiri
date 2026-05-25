/**
 * CSV出力画面(S-06)。
 *
 * 形式(汎用/freee/マネフォ/弥生)を選び、対象レシートを書き出して共有する。
 * 各社形式は Light/Pro 限定(FR-16〜18)。Free が選ぶとアップグレード案内(課金壁)。
 * 期間指定(FR-19)は MVP では「全期間 / 年」を簡易対応。
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PLANS } from '@/config/plans';
import { Brand, Spacing } from '@/constants/theme';
import {
  ALL_FORMATTERS,
  canUseFormat,
  type CsvFormatId,
} from '@/features/export/formatters';
import { shareCsv } from '@/features/export/share-csv';
import { listReceipts } from '@/lib/db/receipt-repository';
import { useApp } from '@/shared/app-context';

export function ExportScreen() {
  const { plan, userId } = useApp();
  const [selected, setSelected] = useState<CsvFormatId>('generic');
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listReceipts(userId).then((rs) => setCount(rs.length));
    }, [userId]),
  );

  async function handleExport() {
    if (!canUseFormat(plan, selected)) {
      Alert.alert(
        'この形式は Light 以上で使えます',
        `${PLANS[plan].name} は汎用CSVのみ。freee/マネフォ/弥生 形式は Light 以上にアップグレードで使えます。`,
      );
      return;
    }
    setBusy(true);
    try {
      const receipts = await listReceipts(userId, 100000);
      if (receipts.length === 0) {
        Alert.alert('レシートがありません', '先にレシートを登録してください。');
        return;
      }
      const formatter = ALL_FORMATTERS.find((f) => f.id === selected)!;
      const content = formatter.format(receipts);
      const year = new Date().getFullYear();
      await shareCsv(formatter.fileName({ year }), content);
    } catch {
      Alert.alert('書き出しに失敗しました', 'もう一度お試しください。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title" style={styles.title}>
            CSVを書き出す
          </ThemedText>
          <ThemedText type="small" style={styles.note}>
            対象: {count} 件 / 現在のプラン: {PLANS[plan].name}
          </ThemedText>

          <ThemedText type="small" style={styles.sectionLabel}>
            出力形式を選択
          </ThemedText>
          {ALL_FORMATTERS.map((f) => {
            const allowed = canUseFormat(plan, f.id);
            const active = selected === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setSelected(f.id)}
                style={[styles.option, active && styles.optionActive]}>
                <ThemedText style={active ? styles.optionTextActive : undefined}>
                  {f.label}
                </ThemedText>
                {!allowed && (
                  <ThemedText type="small" style={styles.lock}>
                    Light以上
                  </ThemedText>
                )}
              </Pressable>
            );
          })}

          <Pressable
            style={[styles.exportButton, busy && styles.disabled]}
            disabled={busy}
            onPress={handleExport}>
            <ThemedText style={styles.exportButtonText}>
              {busy ? '書き出し中…' : 'CSVを書き出す'}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.two },
  title: { marginBottom: Spacing.one },
  note: { opacity: 0.6, marginBottom: Spacing.three },
  sectionLabel: { opacity: 0.7, marginBottom: Spacing.one },
  option: {
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
  optionActive: { borderColor: Brand.primary, backgroundColor: Brand.primaryLight },
  optionTextActive: { color: Brand.primaryDark, fontWeight: '600' },
  lock: { color: '#A98600' },
  exportButton: {
    backgroundColor: Brand.primary,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  exportButtonText: { color: '#ffffff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
