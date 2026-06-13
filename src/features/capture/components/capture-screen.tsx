/**
 * 撮影画面(S-02)。
 *
 * expo-camera のライブプレビューで撮影(FR-01)し、ギャラリー取込(FR-02)にも対応。
 * Free の画像削除バナー(FR-26)と今月の残り枚数(FR-22)を表示する。
 * カメラが使えない環境(権限拒否・カメラ無しPC等)でも取込ボタンで完結できる。
 * 連続撮影(FR-03)はフェーズ後半(docs/development/phase-7-polish.md §5)。
 */

import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppIcon } from '@/components/app-icon';
import { PLANS } from '@/config/plans';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { remainingReceipts } from '@/features/billing/plan-access';
import { useReceiptScan } from '@/features/capture/hooks/use-receipt-scan';
import { countReceiptsInMonth } from '@/lib/db/receipt-repository';
import { useApp } from '@/shared/app-context';

export function CaptureScreen() {
  const router = useRouter();
  const { plan, userId } = useApp();
  const { loading, error: scanError, scan } = useReceiptScan();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const monthlyLimit = PLANS[plan].features.monthlyReceiptLimit;

  // 今月の残り枚数(FR-22)。無制限プランでは表示しない
  useFocusEffect(
    useCallback(() => {
      if (monthlyLimit === null) {
        setRemaining(null);
        return;
      }
      countReceiptsInMonth(userId, new Date().toISOString().slice(0, 7)).then((used) => {
        setRemaining(remainingReceipts(plan, used));
      });
    }, [monthlyLimit, plan, userId]),
  );

  const canUseCamera = permission?.granted === true && cameraError === null;

  async function processImage(uri: string) {
    const extraction = await scan(uri);
    if (!extraction) return; // エラーは scanError 経由で表示
    router.push({
      pathname: '/review',
      params: { imageUri: uri, extraction: JSON.stringify(extraction) },
    });
  }

  /**
   * カメラ準備イベントの直後は映像フレームが届く前で撮影が失敗することがある
   * (特にWeb)ため、短い間隔でリトライする。
   */
  async function takePictureWithRetry(): Promise<string | null> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
        if (photo?.uri) return photo.uri;
      } catch (e) {
        if (attempt === 2) console.warn('[capture] takePicture failed:', e);
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    return null;
  }

  async function handleShutter() {
    setError(null);
    const uri = await takePictureWithRetry();
    if (!uri) {
      setError('撮影に失敗しました');
      return;
    }
    await processImage(uri);
  }

  async function handlePickFromLibrary() {
    setError(null);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: false });
      if (res.canceled || !res.assets?.[0]) return;
      await processImage(res.assets[0].uri);
    } catch {
      setError('画像の取得に失敗しました');
    }
  }

  const displayError = error ?? scanError;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="閉じる"
            style={styles.closeButton}
            onPress={() => router.back()}>
            <AppIcon color="#ffffff" name="close" size={24} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>レシートを撮影</ThemedText>
          <View style={styles.closeButton} />
        </View>

        <View style={styles.viewfinder}>
          {canUseCamera ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              onCameraReady={() => setCameraReady(true)}
              onMountError={(e) => setCameraError(e.message)}
            />
          ) : (
            <View style={styles.cameraFallback}>
              {permission == null ? null : cameraError !== null ? (
                <>
                  <ThemedText style={styles.fallbackTitle}>
                    カメラを起動できませんでした
                  </ThemedText>
                  <ThemedText type="small" style={styles.fallbackText}>
                    下の取込ボタンから画像を選んで登録できます
                  </ThemedText>
                </>
              ) : (
                <>
                  <ThemedText style={styles.fallbackTitle}>カメラの許可が必要です</ThemedText>
                  {permission.canAskAgain ? (
                    <Pressable style={styles.permissionButton} onPress={requestPermission}>
                      <ThemedText style={styles.permissionButtonText}>
                        カメラを許可する
                      </ThemedText>
                    </Pressable>
                  ) : (
                    <ThemedText type="small" style={styles.fallbackText}>
                      端末の設定アプリからカメラを許可してください
                    </ThemedText>
                  )}
                  <ThemedText type="small" style={styles.fallbackText}>
                    許可しない場合も、下の取込ボタンから画像を選べます
                  </ThemedText>
                </>
              )}
            </View>
          )}

          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          {remaining !== null && (
            <View style={styles.remainingBadge}>
              <ThemedText type="small" style={styles.remainingText}>
                今月の残り枚数:あと {remaining} 枚
              </ThemedText>
            </View>
          )}

          {loading && (
            <View style={styles.scanOverlay}>
              <ThemedText style={styles.scanText}>読み取り中…</ThemedText>
            </View>
          )}
        </View>

        {plan === 'free' && (
          <View style={styles.banner}>
            <ThemedText type="small" style={styles.bannerText}>
              Freeプラン: 画像はテキスト化後すぐ削除されます
            </ThemedText>
          </View>
        )}

        {displayError && (
          <ThemedText type="small" style={styles.error}>
            {displayError}
          </ThemedText>
        )}

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="ギャラリーから選択"
            style={[styles.toolButton, loading && styles.disabled]}
            disabled={loading}
            onPress={handlePickFromLibrary}>
            <AppIcon color="#ffffff" name="gallery" size={22} />
          </Pressable>

          <Pressable
            accessibilityLabel="撮影する"
            style={[
              styles.shutterOuter,
              (loading || !canUseCamera || !cameraReady) && styles.disabled,
            ]}
            disabled={loading || !canUseCamera || !cameraReady}
            onPress={handleShutter}>
            <View style={styles.shutterInner} />
          </Pressable>

          <View style={styles.toolSpacer} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

// 撮影画面のみ意図的なダークUI(カメラ画面の慣習)。ライトテーマのトークンは使わない
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121512' },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
    paddingTop: 0,
  },
  closeButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerTitle: { color: '#ffffff', fontWeight: '700' },
  viewfinder: {
    backgroundColor: '#0E1411',
    borderRadius: Radius.lg,
    flex: 1,
    marginBottom: Spacing.three,
    overflow: 'hidden',
  },
  cameraFallback: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  fallbackTitle: { color: '#ffffff', fontWeight: '700', textAlign: 'center' },
  fallbackText: { color: '#A7B0AB', textAlign: 'center' },
  permissionButton: {
    backgroundColor: Brand.primary,
    borderRadius: Radius.md,
    marginVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  permissionButtonText: { color: '#ffffff', fontWeight: '700' },
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
  remainingBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: Radius.sm,
    bottom: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    position: 'absolute',
    zIndex: 2,
  },
  remainingText: { color: '#ffffff' },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    zIndex: 3,
  },
  scanText: { color: '#ffffff', fontWeight: '700' },
  banner: {
    backgroundColor: Brand.warningBackground,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  bannerText: { color: Brand.warningText },
  error: { color: '#FFB4A8', marginBottom: Spacing.two, textAlign: 'center' },
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
  toolSpacer: { height: 44, width: 44 },
  shutterOuter: {
    alignItems: 'center',
    borderColor: '#ffffff',
    borderRadius: 40,
    borderWidth: 4,
    height: 80,
    justifyContent: 'center',
    width: 80,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
  },
  shutterInner: {
    backgroundColor: Brand.primary,
    borderRadius: 31,
    height: 62,
    width: 62,
  },
  disabled: { opacity: 0.5 },
});
