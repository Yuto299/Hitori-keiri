/**
 * 確認・編集画面(S-03)。
 *
 * 新規: OCR抽出結果を初期値に、日付/金額/店名/科目/メモを編集して承認保存(FR-07/08/09)。
 *       保存時に枚数上限(FR-22)をチェックし、Free は画像を保存しない(FR-12)。
 *       低確度の項目はラベルに印を付けて注意を促す(第6章 6.3.2)。
 * 編集: `?mode=edit&id=<uuid>` で開くと既存レシートを読み込み、上書き保存する(FR-14)。
 *       詳細画面(S-05)から呼ばれる。枚数上限チェックは行わない(枚数は増えない)。
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppIcon } from '@/components/app-icon';
import { PLANS } from '@/config/plans';
import { CATEGORIES } from '@/constants/categories';
import { Brand, Palette, Radius, Spacing } from '@/constants/theme';
import { canAddReceipt } from '@/features/billing/plan-access';
import { countReceiptsInMonth, getReceipt } from '@/lib/db/receipt-repository';
import { createReceiptSynced, updateReceiptSynced } from '@/lib/sync/receipt-sync';
import { showAlert } from '@/shared/alert';
import { useApp } from '@/shared/app-context';
import type { CategoryId, OcrExtraction, ReceiptMemo } from '@/shared/types/receipt';

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

/** 空文字は undefined にして、メモに空キーを残さない */
function buildMemo(fields: {
  note: string;
  attendees: string;
  purpose: string;
  project: string;
}): ReceiptMemo {
  const memo: ReceiptMemo = {};
  if (fields.note.trim()) memo.note = fields.note.trim();
  if (fields.attendees.trim()) memo.attendees = fields.attendees.trim();
  if (fields.purpose.trim()) memo.purpose = fields.purpose.trim();
  if (fields.project.trim()) memo.project = fields.project.trim();
  return memo;
}

export function ReviewScreen() {
  const router = useRouter();
  const { plan, userId } = useApp();
  const params = useLocalSearchParams<{
    imageUri?: string;
    extraction?: string;
    mode?: string;
    id?: string;
  }>();
  const isEdit = params.mode === 'edit' && typeof params.id === 'string';
  const editId = isEdit ? params.id : undefined;

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
  const [attendees, setAttendees] = useState('');
  const [purpose, setPurpose] = useState('');
  const [project, setProject] = useState('');
  const [showMoreMemo, setShowMoreMemo] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  // 編集モードで既存レシートの読み込みが終わるまで保存させない
  const [editLoaded, setEditLoaded] = useState(!isEdit);

  // 編集モード: 既存レシートを初期値に読み込む
  useEffect(() => {
    if (!editId) return;
    let active = true;
    getReceipt(editId).then((r) => {
      if (!active) return;
      if (!r) {
        showAlert('レシートが見つかりません');
        router.back();
        return;
      }
      setDate(r.date);
      setAmount(String(r.amountYen));
      setStore(r.store);
      setCategory(r.category);
      setNote(r.memo.note ?? '');
      setAttendees(r.memo.attendees ?? '');
      setPurpose(r.memo.purpose ?? '');
      setProject(r.memo.project ?? '');
      if (r.memo.attendees || r.memo.purpose || r.memo.project) setShowMoreMemo(true);
      setEditLoaded(true);
    });
    return () => {
      active = false;
    };
    // router は安定参照。editId が変わった時だけ再読込
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // 科目は代表6件を先に出し、選択中の科目が含まれなければ追加表示。「すべて表示」で全件
  const visibleCategories = useMemo(() => {
    if (showAllCategories) return CATEGORIES;
    const head = CATEGORIES.slice(0, 6);
    if (head.some((c) => c.id === category)) return head;
    const selected = CATEGORIES.find((c) => c.id === category);
    return selected ? [...head, selected] : head;
  }, [category, showAllCategories]);

  const lowAmount = !isEdit && (extraction?.confidence?.amount ?? 1) < 0.8;
  const lowStore = !isEdit && (extraction?.confidence?.store ?? 1) < 0.8;

  async function handleSave() {
    if (!date || !amount || !store) {
      showAlert('入力を確認してください', '日付・金額・店名は必須です');
      return;
    }
    setSaving(true);
    try {
      const memo = buildMemo({ note, attendees, purpose, project });

      if (editId) {
        const updated = await updateReceiptSynced(editId, {
          date,
          amountYen: Number(amount),
          store,
          category,
          memo,
        });
        if (!updated) {
          showAlert('レシートが見つかりません');
          setSaving(false);
          return;
        }
        goBack(); // 詳細画面へ戻る(useFocusEffect で再読込される)
        return;
      }

      const used = await countReceiptsInMonth(userId, currentYearMonth());
      if (!canAddReceipt(plan, used)) {
        // 枚数上限の課金壁(4.6 発火マップ)。上限に達した旨を伝えてから S-07 へ
        showAlert(
          '今月の上限に達しました',
          `${PLANS[plan].name} は月 ${PLANS[plan].features.monthlyReceiptLimit} 枚までです。`,
        );
        setSaving(false);
        router.push({ pathname: '/upgrade', params: { context: 'limit' } });
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
        memo,
        imageStatus: keepImage ? 'stored' : 'deleted',
        imagePath: keepImage ? params.imageUri : undefined,
        capturedPlan: plan,
      });

      router.replace('/explore'); // レシート一覧へ
    } catch {
      showAlert('保存に失敗しました', 'もう一度お試しください');
      setSaving(false);
    }
  }

  // 履歴がない(URL直叩き・リロード)場合はホームへ戻す
  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  const canSave = !saving && editLoaded;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.nav}>
          <Pressable
            accessibilityLabel="戻る"
            style={styles.backButton}
            onPress={goBack}>
            <AppIcon color={Palette.text} name="back" size={24} />
          </Pressable>
          <ThemedText style={styles.navTitle}>{isEdit ? 'レシートを編集' : '内容を確認'}</ThemedText>
          <Pressable disabled={!canSave} onPress={handleSave}>
            <ThemedText style={[styles.saveLink, !canSave && styles.disabledText]}>
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
              {visibleCategories.map((c) => (
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
              {!showAllCategories && (
                <Pressable
                  accessibilityLabel="すべての科目を表示"
                  style={styles.moreMemoButton}
                  onPress={() => setShowAllCategories(true)}>
                  <ThemedText type="small" style={styles.moreMemoText}>
                    ＋ すべての科目を表示
                  </ThemedText>
                </Pressable>
              )}
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

          {showMoreMemo ? (
            <>
              <Field label="同席者(接待交際費・会議費で重要)">
                <TextInput
                  style={styles.input}
                  value={attendees}
                  onChangeText={setAttendees}
                  placeholder="例: ○○社 田中様"
                />
              </Field>
              <Field label="目的・用途">
                <TextInput
                  style={styles.input}
                  value={purpose}
                  onChangeText={setPurpose}
                  placeholder="例: 新規案件の打合せ"
                />
              </Field>
              <Field label="案件名">
                <TextInput
                  style={styles.input}
                  value={project}
                  onChangeText={setProject}
                  placeholder="例: ○○サイト制作"
                />
              </Field>
            </>
          ) : (
            <Pressable
              accessibilityLabel="同席者・目的・案件名を追加"
              style={styles.moreMemoButton}
              onPress={() => setShowMoreMemo(true)}>
              <ThemedText type="small" style={styles.moreMemoText}>
                ＋ 同席者・目的・案件名を追加
              </ThemedText>
            </Pressable>
          )}

          <Pressable
            style={[styles.saveButton, !canSave && styles.disabled]}
            disabled={!canSave}
            onPress={handleSave}>
            <ThemedText style={styles.saveButtonText}>
              {saving ? '保存中…' : isEdit ? '変更を保存' : '承認して保存'}
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
  moreMemoButton: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
  moreMemoText: { color: Brand.primaryDark, fontWeight: '700' },
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
