/**
 * クロスプラットフォームのダイアログ表示
 *
 * react-native-web は Alert.alert を実装していない(呼んでも何も起きない)ため、
 * Web では window.alert / window.confirm に振り分ける。
 * 画面からは必ずこのヘルパーを使う(Alert.alert を直接呼ばない)。
 */

import { Alert, Platform } from 'react-native';

/** 通知ダイアログ(OKのみ) */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/** 破壊的操作などの確認ダイアログ。確定なら true を返す */
export function confirmAsync(
  title: string,
  message: string,
  confirmLabel = 'OK',
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'キャンセル', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
