/**
 * CSV出力画面(S-06)。
 *
 * 形式(汎用/freee/マネフォ/弥生)を選び、対象レシートを書き出して共有する。
 * 各社形式は Light/Pro 限定(FR-16〜18)。Free が選ぶとアップグレード案内(課金壁)。
 * 期間指定(FR-19)は MVP では「全期間 / 年」を簡易対応。
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppIcon, CsvBrandBadge } from '@/components/app-icon';
import { PLANS } from '@/config/plans';
import { Brand, Palette, Radius, Spacing } from '@/constants/theme';
import {
  ALL_FORMATTERS,
  canUseFormat,
  type CsvFormatId,
} from '@/features/export/formatters';
import { shareCsv } from '@/features/export/share-csv';
import { listReceipts } from '@/lib/db/receipt-repository';
import { showAlert } from '@/shared/alert';
import { useApp } from '@/shared/app-context';

export function ExportScreen() {
  const { plan, userId } = useApp();
  const [selected, setSelected] = useState<CsvFormatId>('generic');
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [exportedFileName, setExportedFileName] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      listReceipts(userId).then((rs) => setCount(rs.length));
    }, [userId]),
  );

  async function handleExport() {
    if (!canUseFormat(plan, selected)) {
      showAlert(
        'この形式は Light 以上で使えます',
        `${PLANS[plan].name} は汎用CSVのみ。freee/マネフォ/弥生 形式は Light 以上にアップグレードで使えます。`,
      );
      return;
    }
    setBusy(true);
    try {
      const receipts = await listReceipts(userId, 100000);
      if (receipts.length === 0) {
        showAlert('レシートがありません', '撮影して保存すると書き出せます。');
        return;
      }
      const formatter = ALL_FORMATTERS.find((f) => f.id === selected)!;
      const year = new Date().getFullYear();
      const fileName = formatter.fileName({ year });
      const content = formatter.format(receipts);
      await shareCsv(fileName, content);
      setExportedFileName(fileName);
    } catch {
      showAlert('書き出しに失敗しました', 'もう一度お試しください。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          {exportedFileName ? (
            <View style={styles.doneView}>
              <View style={styles.doneMark}>
                <AppIcon color="#ffffff" name="check" size={46} />
              </View>
              <ThemedText style={styles.doneTitle}>書き出しが完了しました！</ThemedText>
              <ThemedText type="small" style={styles.doneMeta}>
                {ALL_FORMATTERS.find((f) => f.id === selected)?.label}
              </ThemedText>
              <ThemedText type="small" style={styles.doneMeta}>
                {exportedFileName}
              </ThemedText>
              <View style={styles.doneActions}>
                <Pressable style={styles.outlineButton} onPress={() => setExportedFileName(null)}>
                  <ThemedText style={styles.outlineButtonText}>もう一度出力</ThemedText>
                </Pressable>
                <Pressable style={styles.doneButton} onPress={() => setExportedFileName(null)}>
                  <ThemedText style={styles.doneButtonText}>完了</ThemedText>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <ThemedText style={styles.title}>CSVを書き出す</ThemedText>
              <ThemedText type="small" style={styles.note}>
                対象: {count} 件 / 現在のプラン: {PLANS[plan].name}
              </ThemedText>

              <ThemedText type="small" style={styles.sectionLabel}>
                出力形式を選択
              </ThemedText>
              <View style={styles.optionGroup}>
                {ALL_FORMATTERS.map((f) => {
                  const allowed = canUseFormat(plan, f.id);
                  const active = selected === f.id;
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => setSelected(f.id)}
                      style={[styles.option, active && styles.optionActive]}>
                      <View style={[styles.radio, active && styles.radioActive]}>
                        {active && <View style={styles.radioDot} />}
                      </View>
                      <ThemedText style={[styles.optionLabel, active && styles.optionTextActive]}>
                        {f.label}
                      </ThemedText>
                      <CsvBrandBadge label={formatBadgeLabel(f.id)} tone={formatBadgeTone(f.id)} />
                      {!allowed && (
                        <ThemedText type="small" style={styles.lock}>
                          Light以上
                        </ThemedText>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={[styles.exportButton, (busy || count === 0) && styles.disabled]}
                disabled={busy || count === 0}
                onPress={handleExport}>
                <ThemedText style={styles.exportButtonText}>
                  {busy ? '書き出し中…' : 'CSVを書き出す'}
                </ThemedText>
              </Pressable>
              {count === 0 && (
                <ThemedText type="small" style={styles.emptyHint}>
                  レシートを保存すると書き出せるようになります
                </ThemedText>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function formatBadgeLabel(id: CsvFormatId) {
  if (id === 'freee') return 'freee';
  if (id === 'moneyforward') return 'MF';
  if (id === 'yayoi') return '弥生';
  return 'CSV';
}

function formatBadgeTone(id: CsvFormatId) {
  if (id === 'freee') return 'blue' as const;
  if (id === 'moneyforward') return 'orange' as const;
  if (id === 'yayoi') return 'green' as const;
  return 'gray' as const;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.backgroundScreen },
  safeArea: { flex: 1 },
  content: { flexGrow: 1, padding: Spacing.four, gap: Spacing.two },
  title: { fontWeight: '800', marginBottom: Spacing.three, textAlign: 'center' },
  note: { opacity: 0.6, marginBottom: Spacing.three },
  sectionLabel: { opacity: 0.7, marginBottom: Spacing.one },
  optionGroup: {
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderBottomColor: Palette.divider,
    borderBottomWidth: 1,
    backgroundColor: Palette.background,
  },
  optionActive: { backgroundColor: Brand.primaryLight },
  radio: {
    alignItems: 'center',
    borderColor: '#B7C2BC',
    borderRadius: 8,
    borderWidth: 1,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  radioActive: { borderColor: Brand.primary },
  radioDot: { backgroundColor: Brand.primary, borderRadius: 4, height: 8, width: 8 },
  optionLabel: { flex: 1 },
  optionTextActive: { color: Brand.primaryDark, fontWeight: '600' },
  lock: { color: Brand.warningText },
  exportButton: {
    backgroundColor: Brand.primary,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  exportButtonText: { color: '#ffffff', fontWeight: '700' },
  emptyHint: { opacity: 0.6, textAlign: 'center' },
  disabled: { opacity: 0.5 },
  doneView: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
  },
  doneMark: {
    alignItems: 'center',
    backgroundColor: Brand.primary,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    marginBottom: Spacing.three,
    width: 72,
  },
  doneTitle: { fontSize: 18, fontWeight: '800', marginBottom: Spacing.three },
  doneMeta: { color: Palette.textSecondary },
  doneActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.five,
    width: '100%',
  },
  outlineButton: {
    alignItems: 'center',
    borderColor: Brand.primary,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: Spacing.two,
  },
  outlineButtonText: { color: Brand.primary, fontWeight: '700' },
  doneButton: {
    alignItems: 'center',
    backgroundColor: Brand.primary,
    borderRadius: Radius.md,
    flex: 1,
    paddingVertical: Spacing.two,
  },
  doneButtonText: { color: '#ffffff', fontWeight: '700' },
});
