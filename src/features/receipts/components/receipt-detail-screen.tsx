/**
 * レシート詳細画面(S-05)。
 *
 * 1件の内容を表示し、編集・削除できる(FR-14)。編集は確認画面(S-03)を
 * `?mode=edit&id=` で再利用する。画像は保存ポリシー(FR-12)で
 * 「画像は削除済み(テキストのみ)」と出る場合がある(Free / 期限切れLight)。
 * 開いた時点で現行プランの保存期限を判定し、期限切れなら画像を削除する(閲覧時判定)。
 * Storage 上の画像は署名付きURLで表示する。Pro 未満で消えた画像を見ようとしたら S-07 へ。
 */

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppIcon } from '@/components/app-icon';
import { categoryName } from '@/constants/categories';
import { Brand, Palette, Radius, Spacing } from '@/constants/theme';
import { imageExpiresAt } from '@/features/receipts/image-retention';
import { getReceipt } from '@/lib/db/receipt-repository';
import {
  deleteReceiptSynced,
  expireReceiptImageIfNeeded,
  resolveReceiptImageUrl,
} from '@/lib/sync/receipt-sync';
import { confirmAsync } from '@/shared/alert';
import { useApp } from '@/shared/app-context';
import type { Receipt } from '@/shared/types/receipt';

export function ReceiptDetailScreen() {
  const router = useRouter();
  const { plan } = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!id) return;
        let r = await getReceipt(id);
        if (r) {
          // 保存ポリシー(FR-12)を閲覧時に適用
          r = await expireReceiptImageIfNeeded(r, plan);
        }
        const url = r ? await resolveReceiptImageUrl(r) : null;
        if (active) {
          setReceipt(r);
          setImageUrl(url);
          setLoaded(true);
        }
      })();
      return () => {
        active = false;
      };
    }, [id, plan]),
  );

  // 履歴がない(URL直叩き・リロード)場合は一覧へ戻す
  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/explore');
    }
  }

  function openEdit() {
    if (!receipt) return;
    router.push({ pathname: '/review', params: { mode: 'edit', id: receipt.id } });
  }

  async function confirmDelete() {
    if (!receipt) return;
    const ok = await confirmAsync('削除しますか?', 'このレシートを削除します。', '削除');
    if (!ok) return;
    await deleteReceiptSynced(receipt.id);
    goBack();
  }

  const header = (
    <View style={styles.nav}>
      <Pressable accessibilityLabel="戻る" style={styles.backButton} onPress={goBack}>
        <AppIcon color={Palette.text} name="back" size={24} />
      </Pressable>
      <ThemedText style={styles.navTitle}>レシート詳細</ThemedText>
      <View style={styles.backButton} />
    </View>
  );

  if (loaded && !receipt) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {header}
          <View style={styles.centered}>
            <ThemedText>レシートが見つかりません</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {header}
        {receipt && (
          <View style={styles.body}>
            <View style={styles.imageBox}>
              {receipt.imageStatus === 'stored' && imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
              ) : receipt.imageStatus === 'stored' ? (
                <ThemedText type="small" style={styles.imageDeleted}>
                  画像を表示できません(オフラインまたは未サインイン)
                </ThemedText>
              ) : plan === 'pro' ? (
                <ThemedText type="small" style={styles.imageDeleted}>
                  画像は削除済み(テキストのみ保持)
                </ThemedText>
              ) : (
                // Light→Pro の課金壁(4.6 発火マップ: 消えた画像を見ようとした時)
                <Pressable
                  accessibilityLabel="画像を残すにはアップグレード"
                  style={styles.imageUpsell}
                  onPress={() =>
                    router.push({ pathname: '/upgrade', params: { context: 'image' } })
                  }>
                  <ThemedText type="small" style={styles.imageDeleted}>
                    画像は削除済み(テキストのみ保持)
                  </ThemedText>
                  <ThemedText type="small" style={styles.imageUpsellLink}>
                    {plan === 'free' ? 'Light 以上で画像を残せます' : 'Pro なら無期限で残せます'} →
                  </ThemedText>
                </Pressable>
              )}
            </View>
            {receipt.imageStatus === 'stored' && imageExpiresAt(receipt, plan) && (
              <ThemedText type="small" style={styles.expiryNote}>
                画像の保存期限: {imageExpiresAt(receipt, plan)!.slice(0, 10)}(Light は30日間)
              </ThemedText>
            )}

            <Row label="日付" value={receipt.date} />
            <Row label="金額" value={`¥${receipt.amountYen.toLocaleString()}`} />
            <Row label="店名" value={receipt.store} />
            <Row label="勘定科目" value={categoryName(receipt.category)} />
            {receipt.memo.note ? <Row label="メモ" value={receipt.memo.note} /> : null}
            {receipt.memo.attendees ? <Row label="同席者" value={receipt.memo.attendees} /> : null}
            {receipt.memo.purpose ? <Row label="目的" value={receipt.memo.purpose} /> : null}
            {receipt.memo.project ? <Row label="案件名" value={receipt.memo.project} /> : null}

            <View style={styles.actions}>
              <Pressable
                accessibilityLabel="このレシートを編集"
                style={styles.editButton}
                onPress={openEdit}>
                <ThemedText style={styles.editText}>編集</ThemedText>
              </Pressable>
              <Pressable style={styles.deleteButton} onPress={confirmDelete}>
                <ThemedText style={styles.deleteText}>削除</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" style={styles.rowLabel}>
        {label}
      </ThemedText>
      <ThemedText style={styles.rowValue}>{value}</ThemedText>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: Spacing.four, gap: Spacing.three },
  imageBox: {
    height: 180,
    borderRadius: Radius.md,
    backgroundColor: Palette.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  imageDeleted: { opacity: 0.6 },
  imageUpsell: { alignItems: 'center', gap: Spacing.one, padding: Spacing.three },
  imageUpsellLink: { color: Brand.primaryDark, fontWeight: '700' },
  expiryNote: { color: Palette.textSecondary, marginTop: -Spacing.two },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
  rowLabel: { opacity: 0.6 },
  rowValue: { flexShrink: 1, fontWeight: '600', marginLeft: Spacing.three, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three },
  editButton: {
    alignItems: 'center',
    borderColor: Brand.primary,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: Spacing.three,
  },
  editText: { color: Brand.primary, fontWeight: '700' },
  deleteButton: {
    alignItems: 'center',
    borderColor: '#E0B4B4',
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: Spacing.three,
  },
  deleteText: { color: '#C0392B', fontWeight: '600' },
});
