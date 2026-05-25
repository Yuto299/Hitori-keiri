import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { queryClient } from '@/lib/query/client';
import { AppProvider } from '@/shared/app-context';

/**
 * ルートレイアウト。アプリ全体の Provider をここで束ねる。
 * - QueryClientProvider: サーバ状態(TanStack Query)
 * - AppProvider: プラン・ユーザーIDの共有状態(暫定)
 * - ThemeProvider: ナビゲーションのテーマ
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppTabs />
        </ThemeProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
