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

  return (
    <Tabs style={styles.appShell}>
      <View style={styles.phoneFrame}>
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
    minHeight: '100%',
    width: '100%',
  },
  phoneFrame: {
    backgroundColor: '#FAFBFA',
    flex: 1,
    maxWidth: 390,
    minHeight: 720,
    overflow: 'hidden',
    width: '100%',
  },
  tabSlot: {
    height: '100%',
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
