/**
 * 確認・編集画面(S-03)。
 *
 * OCR抽出結果(モック)を初期値に、日付/金額/店名/科目/メモを編集して承認保存(FR-07/08/09)。
 * 保存時に枚数上限(FR-22)をチェックし、Free は画像を保存しない(FR-12)。
 * 低確度の項目はラベルに印を付けて注意を促す(第6章 6.3.2)。
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PLANS } from '@/config/plans';
import { CATEGORIES, DEFAULT_CATEGORY } from '@/constants/categories';
import { Brand, Spacing } from '@/constants/theme';
import { canAddReceipt } from '@/features/billing/plan-access';
import { countReceiptsInMonth, createReceipt } from '@/lib/db/receipt-repository';
import { useApp } from '@/shared/app-context';
import type { CategoryId, OcrExtraction } from '@/shared/types/receipt';

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

export function ReviewScreen() {
  const router = useRouter();
  const { plan, userId } = useApp();
  const params = useLocalSearchParams<{ imageUri?: string; extraction?: string }>();

  const extraction = useMemo<OcrExtraction | null>(() => {
    if (!params.extraction) return null;
    try {
      return JSON.parse(params.extraction) as OcrExtraction;
    } catch {
      return null;
    }
  }, [params.extraction]);

  const [date, setDate] = useState(extraction?.date ?? '');
  const [amount, setAmount] = useState(
    extraction?.amountYen != null ? String(extraction.amountYen) : '',
  );
  const [store, setStore] = useState(extraction?.store ?? '');
  const [category, setCategory] = useState<CategoryId>(
    extraction?.categoryCandidates?.[0] ?? DEFAULT_CATEGORY,
  );
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const lowAmount = (extraction?.confidence?.amount ?? 1) < 0.8;
  const lowStore = (extraction?.confidence?.store ?? 1) < 0.8;

  async function handleSave() {
    if (!date || !amount || !store) {
      Alert.alert('入力を確認してください', '日付・金額・店名は必須です');
      return;
    }
    setSaving(true);
    try {
      const used = await countReceiptsInMonth(userId, currentYearMonth());
      if (!canAddReceipt(plan, used)) {
        Alert.alert(
          '今月の上限に達しました',
          `${PLANS[plan].name} は月 ${PLANS[plan].features.monthlyReceiptLimit} 枚までです。アップグレードで増やせます。`,
        );
        setSaving(false);
        return;
      }

      // Free は画像を保存しない(FR-12)。Light/Pro は画像URIを保持。
      const keepImage = plan !== 'free';
      await createReceipt({
        userId,
        date,
        amountYen: Number(amount),
        store,
        category,
        memo: note ? { note } : {},
        imageStatus: keepImage ? 'stored' : 'deleted',
        imagePath: keepImage ? params.imageUri : undefined,
        capturedPlan: plan,
      });

      router.replace('/explore'); // レシート一覧へ
    } catch {
      Alert.alert('保存に失敗しました', 'もう一度お試しください');
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title" style={styles.title}>
            内容を確認
          </ThemedText>

          <Field label="日付(YYYY-MM-DD)">
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2026-05-26" />
          </Field>

          <Field label={`金額${lowAmount ? ' ⚠ 要確認' : ''}`}>
            <TextInput
              style={[styles.input, lowAmount && styles.warnInput]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              placeholder="1280"
            />
          </Field>

          <Field label={`店名${lowStore ? ' ⚠ 要確認' : ''}`}>
            <TextInput
              style={[styles.input, lowStore && styles.warnInput]}
              value={store}
              onChangeText={setStore}
              placeholder="ファミリーマート"
            />
          </Field>

          <Field label="勘定科目">
            <View style={styles.categoryWrap}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  style={[styles.chip, category === c.id && styles.chipActive]}>
                  <ThemedText
                    type="small"
                    style={category === c.id ? styles.chipTextActive : undefined}>
                    {c.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label="メモ(任意)">
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="例: 打合せのお茶代"
            />
          </Field>

          <Pressable
            style={[styles.saveButton, saving && styles.disabled]}
            disabled={saving}
            onPress={handleSave}>
            <ThemedText style={styles.saveButtonText}>
              {saving ? '保存中…' : '承認して保存'}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three },
  title: { marginBottom: Spacing.two },
  field: { gap: Spacing.one },
  fieldLabel: { opacity: 0.7 },
  input: {
    borderWidth: 1,
    borderColor: '#D6DED9',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    color: '#11181C',
    backgroundColor: '#ffffff',
  },
  warnInput: { borderColor: '#E0A100', backgroundColor: '#FFFBEF' },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#D6DED9',
  },
  chipActive: { backgroundColor: Brand.primaryLight, borderColor: Brand.primary },
  chipTextActive: { color: Brand.primaryDark },
  saveButton: {
    backgroundColor: Brand.primary,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveButtonText: { color: '#ffffff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
