/**
 * アプリのカラーパレット。
 *
 * デザインは「デザインA(やさしいミニマル / グリーン・ライトテーマ)」で確定
 * (docs/requirements/04-screen-design.md#49-ビジュアルデザイン確定)。
 * MVPはライトテーマ固定(app.json の userInterfaceStyle: light)。dark は予備。
 */

import '@/global.css';

import { Platform } from 'react-native';

/** ブランドカラー(確定UIモックのグリーン基調) */
export const Brand = {
  /** プライマリ(主要ボタン・選択状態・ロゴ) */
  primary: '#2E9E63',
  primaryDark: '#247C4E',
  primaryLight: '#E8F5EC',
  /** Free画像削除の明示バナー(淡イエロー系) */
  warningBackground: '#FFF7E0',
  warningText: '#8A6D1A',
} as const;

export const Colors = {
  light: {
    text: '#11181C',
    background: '#ffffff',
    backgroundElement: '#F4F6F5',
    backgroundSelected: '#E3EEE7',
    textSecondary: '#5B6660',
    tint: Brand.primary,
  },
  dark: {
    text: '#ffffff',
    background: '#0E1411',
    backgroundElement: '#1A211D',
    backgroundSelected: '#27302B',
    textSecondary: '#A7B0AB',
    tint: Brand.primary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
