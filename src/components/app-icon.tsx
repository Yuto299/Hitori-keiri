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

export function HomeIllustration({ size = 96 }: { size?: number }) {
  return (
    <View style={[styles.illustration, { borderRadius: size / 2, height: size, width: size }]}>
      <View style={styles.personHair} />
      <View style={styles.personHead}>
        <View style={styles.personEye} />
        <View style={[styles.personEye, styles.personEyeRight]} />
        <View style={styles.personMouth} />
      </View>
      <View style={styles.personBody} />
      <View style={styles.handPhone}>
        <AppIcon color="#162019" name="receipt" size={13} />
      </View>
    </View>
  );
}

export function ReceiptAvatar({
  accent = '#DDECE3',
  icon = 'receipt',
}: {
  accent?: string;
  icon?: AppIconName;
}) {
  return (
    <View style={[styles.receiptAvatar, { backgroundColor: accent }]}>
      <View style={styles.receiptAvatarPaper}>
        <AppIcon color="#162019" name={icon} size={17} />
      </View>
    </View>
  );
}

export function CsvBrandBadge({ label, tone }: { label: string; tone: 'blue' | 'green' | 'orange' | 'gray' }) {
  const colors = {
    blue: { bg: '#EAF2FF', fg: '#2C63B7' },
    green: { bg: '#E9F8EE', fg: '#278B56' },
    orange: { bg: '#FFF2E3', fg: '#D06E1B' },
    gray: { bg: '#F2F4F3', fg: '#52605A' },
  }[tone];

  return (
    <View style={[styles.csvBadge, { backgroundColor: colors.bg }]}>
      <ThemedText style={[styles.csvBadgeText, { color: colors.fg }]}>{label}</ThemedText>
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
  illustration: {
    alignItems: 'center',
    backgroundColor: '#EAF7EF',
    borderColor: '#D6EFE1',
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  personHair: {
    backgroundColor: '#162019',
    borderRadius: 16,
    height: 28,
    position: 'absolute',
    right: 25,
    top: 20,
    transform: [{ rotate: '-18deg' }],
    width: 32,
  },
  personHead: {
    backgroundColor: '#FFFFFF',
    borderColor: '#162019',
    borderRadius: 16,
    borderWidth: 1.5,
    height: 31,
    position: 'absolute',
    right: 28,
    top: 25,
    width: 29,
  },
  personEye: {
    backgroundColor: '#162019',
    borderRadius: 1.5,
    height: 3,
    left: 8,
    position: 'absolute',
    top: 12,
    width: 3,
  },
  personEyeRight: {
    left: 17,
  },
  personMouth: {
    borderBottomColor: '#162019',
    borderBottomWidth: 1.5,
    borderRadius: 5,
    bottom: 7,
    height: 5,
    left: 10,
    position: 'absolute',
    width: 9,
  },
  personBody: {
    backgroundColor: '#FFFFFF',
    borderColor: '#162019',
    borderRadius: 20,
    borderWidth: 1.5,
    bottom: 13,
    height: 40,
    position: 'absolute',
    right: 21,
    width: 45,
  },
  handPhone: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#162019',
    borderRadius: 7,
    borderWidth: 1.5,
    height: 28,
    justifyContent: 'center',
    left: 21,
    position: 'absolute',
    top: 36,
    transform: [{ rotate: '-5deg' }],
    width: 20,
  },
  receiptAvatar: {
    alignItems: 'center',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  receiptAvatarPaper: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8E4',
    borderRadius: 8,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 24,
  },
  csvBadge: {
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 42,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  csvBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
});
