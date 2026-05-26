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

import { AppIcon, type AppIconName } from '@/components/app-icon';
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
      <View style={[styles.phoneFrame, isDarkScreen && styles.phoneFrameDark]}>
        <View style={[styles.statusBar, isDarkScreen && styles.statusBarDark]}>
          <ThemedText style={[styles.statusTime, isDarkScreen && styles.statusTextDark]}>
            9:33
          </ThemedText>
          <View style={styles.statusIcons}>
            <View style={[styles.signalIcon, isDarkScreen && styles.signalIconDark]} />
            <View style={[styles.wifiIcon, isDarkScreen && styles.signalIconDark]} />
            <View style={[styles.batteryIcon, isDarkScreen && styles.batteryIconDark]} />
          </View>
        </View>
        <TabSlot style={[styles.tabSlot, !tabsVisible && styles.tabSlotFull]} />
      </View>
      {tabsVisible && (
        <TabList asChild>
          <CustomTabList>
            <TabTrigger name="home" href="/" asChild>
              <TabButton icon="home">ホーム</TabButton>
            </TabTrigger>
            <TabTrigger name="explore" href="/explore" asChild>
              <TabButton icon="receipt">レシート</TabButton>
            </TabTrigger>
            <TabTrigger name="export" href="/export" asChild>
              <TabButton icon="export">出力</TabButton>
            </TabTrigger>
            <TabTrigger name="settings" href="/settings" asChild>
              <TabButton icon="settings">設定</TabButton>
            </TabTrigger>
          </CustomTabList>
        </TabList>
      )}
    </Tabs>
  );
}

export function TabButton({
  children,
  icon,
  isFocused,
  ...props
}: TabTriggerSlotProps & { icon: AppIconName }) {
  const color = isFocused ? Brand.primary : '#7B8580';

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <AppIcon color={color} name={icon} size={23} />
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
    justifyContent: 'center',
    minHeight: '100%',
    paddingHorizontal: 16,
    width: '100%',
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
  signalIcon: {
    backgroundColor: '#101615',
    borderRadius: 2,
    height: 10,
    width: 12,
  },
  wifiIcon: {
    backgroundColor: '#101615',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  batteryIcon: {
    backgroundColor: '#101615',
    borderRadius: 2,
    height: 9,
    width: 18,
  },
  signalIconDark: {
    backgroundColor: '#ffffff',
  },
  batteryIconDark: {
    backgroundColor: '#ffffff',
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
