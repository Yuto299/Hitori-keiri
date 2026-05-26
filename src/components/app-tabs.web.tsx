import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { usePathname } from 'expo-router';
import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Brand, Spacing } from '@/constants/theme';

export default function AppTabs() {
  const pathname = usePathname();
  const tabsVisible =
    pathname === '/' ||
    pathname === '/explore' ||
    pathname === '/export' ||
    pathname === '/settings';
  const isDarkScreen = pathname === '/capture';

  return (
    <Tabs style={styles.appShell}>
      <View style={styles.brandPanel}>
        <View style={styles.brandHeader}>
          <View style={styles.logoMark}>
            <ThemedText style={styles.logoPaper}>▤</ThemedText>
          </View>
          <View>
            <ThemedText style={styles.brandName}>ひとり経理</ThemedText>
            <ThemedText style={styles.brandSub}>Hitori Keiri</ThemedText>
          </View>
        </View>
        <View style={styles.copyBlock}>
          <ThemedText style={styles.copyGreen}>レシートを撮るだけ。</ThemedText>
          <ThemedText style={styles.copyMain}>確定申告前の絶望を、</ThemedText>
          <ThemedText style={styles.copyMain}>3タップで終わらせる。</ThemedText>
          <ThemedText style={styles.copySub}>いちばんやさしい、ひとりの経理。</ThemedText>
        </View>
        <View style={styles.stepsCard}>
          <ThemedText style={styles.stepsTitle}>3タップで完結</ThemedText>
          <View style={styles.stepsRow}>
            <Step icon="▣" title="1. 撮る" body="レシートを撮影" />
            <ThemedText style={styles.stepArrow}>→</ThemedText>
            <Step icon="✓" title="2. 確認" body="内容を確認して保存" />
            <ThemedText style={styles.stepArrow}>→</ThemedText>
            <Step icon="⇩" title="3. 出力" body="CSVを書き出す" />
          </View>
        </View>
      </View>
      <View style={[styles.phoneFrame, isDarkScreen && styles.phoneFrameDark]}>
        <View style={[styles.statusBar, isDarkScreen && styles.statusBarDark]}>
          <ThemedText style={[styles.statusTime, isDarkScreen && styles.statusTextDark]}>
            9:33
          </ThemedText>
          <View style={styles.statusIcons}>
            <ThemedText style={[styles.statusIcon, isDarkScreen && styles.statusTextDark]}>
              ▰
            </ThemedText>
            <ThemedText style={[styles.statusIcon, isDarkScreen && styles.statusTextDark]}>
              ◒
            </ThemedText>
            <ThemedText style={[styles.statusIcon, isDarkScreen && styles.statusTextDark]}>
              ▬
            </ThemedText>
          </View>
        </View>
        <TabSlot style={[styles.tabSlot, !tabsVisible && styles.tabSlotFull]} />
      </View>
      {tabsVisible && (
        <TabList asChild>
          <CustomTabList>
            <TabTrigger name="home" href="/" asChild>
              <TabButton icon="⌂">ホーム</TabButton>
            </TabTrigger>
            <TabTrigger name="explore" href="/explore" asChild>
              <TabButton icon="▤">レシート</TabButton>
            </TabTrigger>
            <TabTrigger name="export" href="/export" asChild>
              <TabButton icon="⇩">出力</TabButton>
            </TabTrigger>
            <TabTrigger name="settings" href="/settings" asChild>
              <TabButton icon="⚙">設定</TabButton>
            </TabTrigger>
          </CustomTabList>
        </TabList>
      )}
    </Tabs>
  );
}

function Step({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIcon}>
        <ThemedText style={styles.stepIconText}>{icon}</ThemedText>
      </View>
      <ThemedText style={styles.stepTitle}>{title}</ThemedText>
      <ThemedText style={styles.stepBody}>{body}</ThemedText>
    </View>
  );
}

export function TabButton({
  children,
  icon,
  isFocused,
  ...props
}: TabTriggerSlotProps & { icon: string }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <ThemedText style={[styles.tabIcon, isFocused && styles.tabActive]}>{icon}</ThemedText>
      <ThemedText type="small" style={[styles.tabLabel, isFocused && styles.tabActive]}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appShell: {
    alignItems: 'center',
    backgroundColor: '#F3F5F3',
    flex: 1,
    flexDirection: 'row',
    gap: 42,
    justifyContent: 'center',
    minHeight: '100%',
    paddingHorizontal: 32,
    width: '100%',
  },
  brandPanel: {
    gap: 34,
    maxWidth: 430,
    width: '42%',
  },
  brandHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: Brand.primary,
    borderRadius: 14,
    height: 58,
    justifyContent: 'center',
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    width: 58,
  },
  logoPaper: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 32,
  },
  brandName: {
    color: '#11181C',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  brandSub: {
    color: '#11181C',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  copyBlock: {
    gap: 8,
  },
  copyGreen: {
    color: Brand.primary,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 36,
  },
  copyMain: {
    color: '#101418',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 42,
  },
  copySub: {
    color: '#101418',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: 16,
  },
  stepsCard: {
    backgroundColor: '#ffffff',
    borderColor: '#E5EAE7',
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    padding: 20,
    shadowColor: '#18241E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
  },
  stepsTitle: {
    color: Brand.primary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  stepsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  step: {
    alignItems: 'center',
    gap: 5,
    width: 92,
  },
  stepIcon: {
    alignItems: 'center',
    backgroundColor: '#EAF7EF',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  stepIconText: {
    color: Brand.primary,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 30,
  },
  stepTitle: {
    color: '#112019',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
  },
  stepBody: {
    color: '#112019',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'center',
  },
  stepArrow: {
    color: Brand.primary,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  phoneFrame: {
    backgroundColor: '#FAFBFA',
    borderColor: '#E5E7E4',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 8,
    maxWidth: 390,
    height: 812,
    maxHeight: '100%',
    shadowColor: '#18241E',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 42,
    overflow: 'hidden',
    width: '100%',
  },
  phoneFrameDark: {
    backgroundColor: '#121512',
  },
  statusBar: {
    alignItems: 'center',
    backgroundColor: '#FAFBFA',
    flexDirection: 'row',
    height: 34,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  statusBarDark: {
    backgroundColor: '#121512',
  },
  statusTime: {
    color: '#101615',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  statusIcons: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  statusIcon: {
    color: '#101615',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 10,
  },
  statusTextDark: {
    color: '#ffffff',
  },
  tabSlot: {
    flex: 1,
    paddingBottom: 72,
  },
  tabSlotFull: {
    paddingBottom: 0,
  },
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    backgroundColor: '#ffffff',
    borderTopColor: '#E5EAE7',
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    justifyContent: 'space-around',
    maxWidth: 390,
    paddingHorizontal: Spacing.two,
    width: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  tabIcon: {
    color: '#7B8580',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  tabLabel: {
    color: '#7B8580',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  tabActive: {
    color: Brand.primary,
  },
});
