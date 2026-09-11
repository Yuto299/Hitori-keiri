/**
 * CSV出力画面(S-06)。
 *
 * 形式(汎用/freee/マネフォ/弥生)と期間(全期間/年/月/任意範囲 FR-19)を選び、
 * 対象レシートを書き出して共有する。
 * 各社形式は Light/Pro 限定(FR-16〜18)。Free が選ぶとアップグレード画面 S-07 へ(課金壁)。
 */

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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
import {
  filterReceiptsByPeriod,
  isValidIsoDate,
  periodLabel,
  periodTag,
  type ExportPeriod,
} from '@/features/export/period';
import { shareCsv } from '@/features/export/share-csv';
import { listReceipts } from '@/lib/db/receipt-repository';
import { showAlert } from '@/shared/alert';
import { useApp } from '@/shared/app-context';
import type { Receipt } from '@/shared/types/receipt';

type PeriodKind = ExportPeriod['kind'];

const PERIOD_KINDS: { kind: PeriodKind; label: string }[] = [
  { kind: 'all', label: '全期間' },
  { kind: 'year', label: '年' },
  { kind: 'month', label: '月' },
  { kind: 'range', label: '期間指定' },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function ExportScreen() {
  const router = useRouter();
  const { plan, userId } = useApp();
  const [selected, setSelected] = useState<CsvFormatId>('generic');
  const [allReceipts, setAllReceipts] = useState<Receipt[]>([]);
  const [busy, setBusy] = useState(false);
  const [exportedFileName, setExportedFileName] = useState<string | null>(null);

  // 期間(FR-19)。既定は全期間。年/月は現在を初期値にする
  const now = new Date();
  const [periodKind, setPeriodKind] = useState<PeriodKind>('all');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');

  useFocusEffect(
    useCallback(() => {
      listReceipts(userId, 100000).then(setAllReceipts);
    }, [userId]),
  );

  const rangeValid = isValidIsoDate(rangeFrom) && isValidIsoDate(rangeTo) && rangeFrom <= rangeTo;

  const period = useMemo<ExportPeriod | null>(() => {
    switch (periodKind) {
      case 'all':
        return { kind: 'all' };
      case 'year':
        return { kind: 'year', year };
      case 'month':
        return { kind: 'month', year, month };
      case 'range':
        return rangeValid ? { kind: 'range', from: rangeFrom, to: rangeTo } : null;
    }
  }, [periodKind, year, month, rangeFrom, rangeTo, rangeValid]);

  const targetReceipts = useMemo(
    () => (period ? filterReceiptsByPeriod(allReceipts, period) : []),
    [allReceipts, period],
  );
  const count = targetReceipts.length;

  async function handleExport() {
    if (!canUseFormat(plan, selected)) {
      // Free→Light の課金壁(4.6 発火マップ)
      router.push({ pathname: '/upgrade', params: { context: 'csv' } });
      return;
    }
    if (!period) {
      showAlert('期間を確認してください', '開始日・終了日を YYYY-MM-DD 形式で入力してください。');
      return;
    }
    setBusy(true);
    try {
      if (targetReceipts.length === 0) {
        showAlert('レシートがありません', '対象期間に書き出せるレシートがありません。');
        return;
      }
      const formatter = ALL_FORMATTERS.find((f) => f.id === selected)!;
      const fileName = formatter.fileName({ periodTag: periodTag(period) });
      const content = formatter.format(targetReceipts);
      await shareCsv(fileName, content);
      setExportedFileName(fileName);
    } catch {
      showAlert('書き出しに失敗しました', 'もう一度お試しください。');
    } finally {
      setBusy(false);
    }
  }

  const canExport = !busy && count > 0 && period !== null;

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
                {period ? ` / ${periodLabel(period)}` : ''}
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

              <ThemedText type="small" style={[styles.sectionLabel, styles.sectionGap]}>
                期間
              </ThemedText>
              <View style={styles.segmented}>
                {PERIOD_KINDS.map((k) => {
                  const active = periodKind === k.kind;
                  return (
                    <Pressable
                      key={k.kind}
                      accessibilityLabel={`期間: ${k.label}`}
                      onPress={() => setPeriodKind(k.kind)}
                      style={[styles.segment, active && styles.segmentActive]}>
                      <ThemedText
                        type="small"
                        style={[styles.segmentText, active && styles.segmentTextActive]}>
                        {k.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {(periodKind === 'year' || periodKind === 'month') && (
                <View style={styles.stepper}>
                  <Pressable
                    accessibilityLabel="前の年"
                    style={styles.stepButton}
                    onPress={() => setYear((y) => y - 1)}>
                    <ThemedText style={styles.stepButtonText}>‹</ThemedText>
                  </Pressable>
                  <ThemedText style={styles.stepValue}>{year}年</ThemedText>
                  <Pressable
                    accessibilityLabel="次の年"
                    style={styles.stepButton}
                    onPress={() => setYear((y) => y + 1)}>
                    <ThemedText style={styles.stepButtonText}>›</ThemedText>
                  </Pressable>
                </View>
              )}

              {periodKind === 'month' && (
                <View style={styles.monthGrid}>
                  {MONTHS.map((m) => {
                    const active = month === m;
                    return (
                      <Pressable
                        key={m}
                        accessibilityLabel={`${m}月`}
                        onPress={() => setMonth(m)}
                        style={[styles.monthChip, active && styles.monthChipActive]}>
                        <ThemedText
                          type="small"
                          style={[styles.monthChipText, active && styles.monthChipTextActive]}>
                          {m}月
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {periodKind === 'range' && (
                <View style={styles.rangeRow}>
                  <TextInput
                    accessibilityLabel="開始日"
                    style={styles.dateInput}
                    value={rangeFrom}
                    onChangeText={setRangeFrom}
                    placeholder="2026-01-01"
                    autoCapitalize="none"
                  />
                  <ThemedText type="small" style={styles.rangeSep}>
                    〜
                  </ThemedText>
                  <TextInput
                    accessibilityLabel="終了日"
                    style={styles.dateInput}
                    value={rangeTo}
                    onChangeText={setRangeTo}
                    placeholder="2026-12-31"
                    autoCapitalize="none"
                  />
                </View>
              )}
              {periodKind === 'range' && (rangeFrom || rangeTo) && !rangeValid && (
                <ThemedText type="small" style={styles.rangeError}>
                  開始日・終了日を YYYY-MM-DD で入力してください(開始日 ≦ 終了日)
                </ThemedText>
              )}

              <Pressable
                style={[styles.exportButton, !canExport && styles.disabled]}
                disabled={!canExport}
                onPress={handleExport}>
                <ThemedText style={styles.exportButtonText}>
                  {busy ? '書き出し中…' : 'CSVを書き出す'}
                </ThemedText>
              </Pressable>
              {count === 0 && period !== null && (
                <ThemedText type="small" style={styles.emptyHint}>
                  {allReceipts.length === 0
                    ? 'レシートを保存すると書き出せるようになります'
                    : `${periodLabel(period)} に該当するレシートがありません`}
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
  sectionGap: { marginTop: Spacing.three },
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
  segmented: {
    backgroundColor: Palette.backgroundElement,
    borderRadius: Radius.md,
    flexDirection: 'row',
    padding: 3,
  },
  segment: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    flex: 1,
    paddingVertical: Spacing.two,
  },
  segmentActive: { backgroundColor: Palette.background },
  segmentText: { color: Palette.textSecondary, fontWeight: '700' },
  segmentTextActive: { color: Brand.primaryDark },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  stepButton: {
    alignItems: 'center',
    borderColor: Palette.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepButtonText: { fontSize: 20, fontWeight: '700', lineHeight: 24 },
  stepValue: { fontWeight: '800', minWidth: 72, textAlign: 'center' },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  monthChip: {
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  monthChipActive: { backgroundColor: Brand.primaryLight, borderColor: Brand.primary },
  monthChipText: { color: Palette.text },
  monthChipTextActive: { color: Brand.primaryDark, fontWeight: '800' },
  rangeRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  dateInput: {
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Palette.text,
    flex: 1,
    fontSize: 15,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rangeSep: { color: Palette.textSecondary },
  rangeError: { color: '#C0392B' },
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
