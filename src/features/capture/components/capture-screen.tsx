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
        {plan === 'free' && (
          <View style={styles.banner}>
            <ThemedText type="small" style={styles.bannerText}>
              ⚠ Freeプラン:画像はテキスト化後に削除されます。残すには Light 以上へ。
            </ThemedText>
          </View>
        )}

        <View style={styles.body}>
          <ThemedText type="title" style={styles.title}>
            レシートを撮影
          </ThemedText>
          <ThemedText type="small" style={styles.note}>
            {loading ? '読み取り中…' : '撮影または画像を選んでください'}
          </ThemedText>

          <Pressable
            style={[styles.primaryButton, loading && styles.disabled]}
            disabled={loading}
            onPress={() => handlePick(true)}>
            <ThemedText style={styles.primaryButtonText}>📷 レシートを撮る</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, loading && styles.disabled]}
            disabled={loading}
            onPress={() => handlePick(false)}>
            <ThemedText style={styles.secondaryButtonText}>🖼 画像から取り込む</ThemedText>
          </Pressable>

          {error && (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  banner: {
    backgroundColor: Brand.warningBackground,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  bannerText: { color: Brand.warningText },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  title: { textAlign: 'center' },
  note: { opacity: 0.6, textAlign: 'center' },
  primaryButton: {
    backgroundColor: Brand.primary,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.three,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '600' },
  secondaryButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: Brand.primary,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  secondaryButtonText: { color: Brand.primary, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  error: { color: '#C0392B' },
});
