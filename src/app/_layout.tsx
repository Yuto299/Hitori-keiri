import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { queryClient } from '@/lib/query/client';
import { AppProvider } from '@/shared/app-context';

/**
 * ルートレイアウト。アプリ全体の Provider と Stack ナビゲーションを束ねる。
 *
 * 構成:
 * - (tabs)/ グループ ... ホーム/レシート/出力/設定 の4タブ(下部ナビあり)
 * - capture / review / receipt/[id] ... タブ外スタック(タブを覆って表示)
 *
 * これにより router.push('/capture') 等でタブ外画面へ自由に遷移できる。
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="capture" />
            <Stack.Screen name="review" />
            <Stack.Screen name="receipt/[id]" />
          </Stack>
        </ThemeProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
