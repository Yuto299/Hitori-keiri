import { SymbolView } from 'expo-symbols';
import medium from 'expo-symbols/androidWeights/medium';
import type { SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View, type ColorValue, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export type AppIconName =
  | 'back'
  | 'calendar'
  | 'camera'
  | 'check'
  | 'close'
  | 'csv'
  | 'export'
  | 'filter'
  | 'gallery'
  | 'home'
  | 'receipt'
  | 'search'
  | 'settings'
  | 'warning';

const SYMBOLS: Record<AppIconName, SymbolViewProps['name']> = {
  back: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  camera: { ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  csv: { ios: 'doc.text', android: 'csv', web: 'csv' },
  export: { ios: 'square.and.arrow.down', android: 'download', web: 'download' },
  filter: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
  gallery: { ios: 'photo.on.rectangle', android: 'image', web: 'image' },
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  receipt: { ios: 'receipt.fill', android: 'receipt_long', web: 'receipt_long' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
};

export function AppIcon({
  color,
  name,
  size = 22,
  style,
}: {
  color: ColorValue;
  name: AppIconName;
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <SymbolView
      fallback={<ThemedText style={[styles.fallback, { color, fontSize: size }]}>{name[0]}</ThemedText>}
      name={SYMBOLS[name]}
      resizeMode="scaleAspectFit"
      size={size}
      style={[{ height: size, width: size }, style]}
      tintColor={color}
      weight={{ ios: 'semibold', android: medium }}
    />
  );
}

export function ReceiptLogo({ size = 58 }: { size?: number }) {
  const paperSize = Math.round(size * 0.6);

  return (
    <View style={[styles.logo, { borderRadius: size * 0.24, height: size, width: size }]}>
      <View style={[styles.paper, { borderRadius: size * 0.08, height: paperSize, width: paperSize }]}>
        <View style={styles.paperLine} />
        <View style={[styles.paperLine, styles.paperLineShort]} />
        <View style={styles.paperLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    fontWeight: '800',
    lineHeight: 24,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: '#31B66B',
    borderColor: '#249D59',
    borderWidth: 1,
    justifyContent: 'center',
    shadowColor: '#2E9E63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  paper: {
    backgroundColor: '#FFFFFF',
    gap: 5,
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  paperLine: {
    backgroundColor: '#162019',
    borderRadius: 2,
    height: 2,
    width: '100%',
  },
  paperLineShort: {
    width: '70%',
  },
});
