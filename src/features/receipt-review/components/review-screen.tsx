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
import { AppIcon } from '@/components/app-icon';
import { PLANS } from '@/config/plans';
import { CATEGORIES } from '@/constants/categories';
import { Brand, Palette, Radius, Spacing } from '@/constants/theme';
import { canAddReceipt } from '@/features/billing/plan-access';
import { countReceiptsInMonth } from '@/lib/db/receipt-repository';
import { createReceiptSynced } from '@/lib/sync/receipt-sync';
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

  // OCR が読み取れなかった項目は空欄にする(偽の初期値で埋めない。ユーザーが手入力)
  const [date, setDate] = useState(extraction?.date ?? '');
  const [amount, setAmount] = useState(
    extraction?.amountYen != null ? String(extraction.amountYen) : '',
  );
  const [store, setStore] = useState(extraction?.store ?? '');
  const [category, setCategory] = useState<CategoryId>(
    extraction?.categoryCandidates?.[0] ?? 'consumables',
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
      await createReceiptSynced({
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
        <View style={styles.nav}>
          <Pressable
            accessibilityLabel="戻る"
            style={styles.backButton}
            onPress={() => router.back()}>
            <AppIcon color={Palette.text} name="back" size={24} />
          </Pressable>
          <ThemedText style={styles.navTitle}>内容を確認</ThemedText>
          <Pressable disabled={saving} onPress={handleSave}>
            <ThemedText style={[styles.saveLink, saving && styles.disabledText]}>
              {saving ? '保存中' : '保存'}
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Field label="日付">
            <View style={styles.inputWrap}>
              <AppIcon color={Palette.textSecondary} name="calendar" size={19} />
              <TextInput
                style={styles.inputInWrap}
                value={date}
                onChangeText={setDate}
                placeholder="2026/05/25"
              />
            </View>
          </Field>

          <Field label={`金額${lowAmount ? '（要確認）' : ''}`}>
            <View style={[styles.inputWrap, lowAmount && styles.warnInput]}>
              <ThemedText style={styles.inputPrefix}>¥</ThemedText>
              <TextInput
                style={styles.inputInWrap}
                value={amount}
                onChangeText={setAmount}
                keyboardType="number-pad"
                placeholder="1280"
              />
            </View>
          </Field>

          <Field label={`店名${lowStore ? '（要確認）' : ''}`}>
            <TextInput
              style={[styles.input, lowStore && styles.warnInput]}
              value={store}
              onChangeText={setStore}
              placeholder="ファミリーマート"
            />
          </Field>

          <Field label="カテゴリ（勘定科目） ？">
            <View style={styles.categoryList}>
              {CATEGORIES.slice(0, 6).map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  style={[styles.categoryOption, category === c.id && styles.categoryOptionActive]}>
                  <View style={[styles.radio, category === c.id && styles.radioActive]}>
                    {category === c.id && <View style={styles.radioDot} />}
                  </View>
                  <ThemedText style={category === c.id ? styles.categoryTextActive : undefined}>
                    {c.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label="メモ(任意)">
            <TextInput
              style={[styles.input, styles.memoInput]}
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
  container: { flex: 1, backgroundColor: Palette.backgroundScreen },
  safeArea: { flex: 1 },
  nav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  navTitle: { fontWeight: '800' },
  saveLink: { color: Brand.primary, fontWeight: '800' },
  disabledText: { opacity: 0.5 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  field: { gap: Spacing.two },
  fieldLabel: { color: Palette.textSecondary, fontWeight: '700' },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  inputPrefix: { fontWeight: '700' },
  input: {
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    color: Palette.text,
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  inputInWrap: {
    color: Palette.text,
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  warnInput: { borderColor: '#E0A100', backgroundColor: '#FFFBEF' },
  memoInput: { minHeight: 46 },
  categoryList: { gap: Spacing.two },
  categoryOption: {
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 42,
    paddingHorizontal: Spacing.two,
  },
  categoryOptionActive: { backgroundColor: Brand.primaryLight, borderColor: Brand.primary },
  radio: {
    alignItems: 'center',
    borderColor: '#B7C2BC',
    borderRadius: 9,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  radioActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  radioDot: { backgroundColor: '#ffffff', borderRadius: 4, height: 8, width: 8 },
  categoryTextActive: { color: Brand.primaryDark, fontWeight: '800' },
  saveButton: {
    backgroundColor: Brand.primary,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveButtonText: { color: '#ffffff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
