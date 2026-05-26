/**
 * 撮影画面(S-02)。
 *
 * MVP骨組みでは expo-image-picker でカメラ撮影/画像取込の両方を扱う
 * (Web/ネイティブ両対応・実装が簡潔)。リッチなカメラUI(expo-camera)は
 * フェーズ後半で差し替え可能。Free の画像削除バナー(FR-26)も表示する。
 */

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppIcon } from '@/components/app-icon';
import { Brand, Spacing } from '@/constants/theme';
import { useReceiptScan } from '@/features/capture/hooks/use-receipt-scan';
import { useApp } from '@/shared/app-context';

export function CaptureScreen() {
  const router = useRouter();
  const { plan } = useApp();
  const { loading, scan } = useReceiptScan();
  const [error, setError] = useState<string | null>(null);

  async function handlePick(useCamera: boolean) {
    setError(null);
    try {
      const picker = useCamera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

      if (useCamera && Platform.OS !== 'web') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setError('カメラの許可が必要です');
          return;
        }
      }

      const res = await picker({ quality: 0.7, base64: false });
      if (res.canceled || !res.assets?.[0]) return;

      const uri = res.assets[0].uri;
      const extraction = await scan(uri);
      if (!extraction) {
        setError('読み取りに失敗しました');
        return;
      }
      // 確認画面へ。抽出結果と画像URIを渡す
      router.push({
        pathname: '/review',
        params: { imageUri: uri, extraction: JSON.stringify(extraction) },
      });
    } catch {
      setError('画像の取得に失敗しました');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <AppIcon color="#ffffff" name="close" size={24} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>レシートを撮影</ThemedText>
          <View style={styles.closeButton} />
        </View>

        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          <View style={styles.receiptPreview}>
            <ThemedText style={styles.previewStore}>FamilyMart</ThemedText>
            <ThemedText type="small" style={styles.previewLabel}>
              領　収　証
            </ThemedText>
            <ThemedText type="small" style={styles.previewLine}>
              2026年05月25日（月）16:32
            </ThemedText>
            <View style={styles.previewItems}>
              <PreviewLine name="おにぎり 鮭" amount="¥150" />
              <PreviewLine name="お茶 600ml" amount="¥130" />
            </View>
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>合計</ThemedText>
              <ThemedText style={styles.totalAmount}>¥280</ThemedText>
            </View>
            <View style={styles.barcode} />
          </View>
        </View>

        {plan === 'free' && (
          <View style={styles.banner}>
            <ThemedText type="small" style={styles.bannerText}>
              Freeプラン: 画像はテキスト化後すぐ削除されます
            </ThemedText>
          </View>
        )}

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <View style={styles.actions}>
          <Pressable
            style={[styles.toolButton, loading && styles.disabled]}
            disabled={loading}
            onPress={() => handlePick(false)}>
            <AppIcon color="#ffffff" name="gallery" size={22} />
          </Pressable>

          <Pressable
            style={[styles.shutterOuter, loading && styles.disabled]}
            disabled={loading}
            onPress={() => handlePick(true)}>
            <View style={styles.shutterInner}>
              <ThemedText style={styles.shutterText}>{loading ? '…' : ''}</ThemedText>
            </View>
          </Pressable>

          <Pressable
            style={[styles.toolButton, loading && styles.disabled]}
            disabled={loading}
            onPress={() => handlePick(false)}>
            <AppIcon color="#ffffff" name="receipt" size={22} />
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function PreviewLine({ name, amount }: { name: string; amount: string }) {
  return (
    <View style={styles.previewItemRow}>
      <ThemedText type="small">{name}</ThemedText>
      <ThemedText type="small">{amount}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121512' },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
    paddingTop: Spacing.two,
  },
  closeButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerTitle: { color: '#ffffff', fontWeight: '700' },
  viewfinder: {
    alignItems: 'center',
    backgroundColor: '#B88B55',
    borderRadius: Spacing.three,
    flex: 1,
    justifyContent: 'center',
    marginBottom: Spacing.three,
    overflow: 'hidden',
  },
  corner: {
    borderColor: '#52C987',
    height: 44,
    position: 'absolute',
    width: 44,
    zIndex: 2,
  },
  cornerTopLeft: { borderLeftWidth: 4, borderTopWidth: 4, left: Spacing.three, top: Spacing.three },
  cornerTopRight: { borderRightWidth: 4, borderTopWidth: 4, right: Spacing.three, top: Spacing.three },
  cornerBottomLeft: {
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    bottom: Spacing.three,
    left: Spacing.three,
  },
  cornerBottomRight: {
    borderBottomWidth: 4,
    borderRightWidth: 4,
    bottom: Spacing.three,
    right: Spacing.three,
  },
  receiptPreview: {
    backgroundColor: '#FAFAF8',
    elevation: 6,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    width: '70%',
  },
  previewStore: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  previewLabel: { marginTop: Spacing.two, textAlign: 'center' },
  previewLine: { marginTop: Spacing.three, textAlign: 'center' },
  previewItems: { gap: Spacing.one, marginTop: Spacing.three },
  previewItemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalRow: {
    borderTopColor: '#D7D7D3',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
  },
  totalLabel: { fontWeight: '700' },
  totalAmount: { fontSize: 18, fontWeight: '800' },
  barcode: { backgroundColor: '#111111', height: 18, marginTop: Spacing.four, opacity: 0.86 },
  banner: {
    backgroundColor: Brand.warningBackground,
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  bannerText: { color: Brand.warningText },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
  },
  toolButton: {
    alignItems: 'center',
    borderColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  shutterOuter: {
    alignItems: 'center',
    borderColor: '#ffffff',
    borderRadius: 40,
    borderWidth: 4,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  shutterInner: {
    alignItems: 'center',
    backgroundColor: Brand.primary,
    borderRadius: 31,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  shutterText: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  error: { color: '#FFB4A8', marginBottom: Spacing.two, textAlign: 'center' },
});
