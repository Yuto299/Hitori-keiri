/**
 * メール+パスワードでのサインイン/アップ画面
 *
 * Supabase Auth の最小実装。Apple / Google は後続(オーナー確認のうえ追加)。
 * 環境変数(EXPO_PUBLIC_SUPABASE_URL/ANON_KEY)が未設定のときは案内を出して
 * 入力を無効化する(docs/development/supabase-setup.md を参照)。
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { signInWithEmail, signUpWithEmail } from '@/features/auth/hooks/use-auth';
import { isSupabaseConfigured } from '@/lib/env';

type Mode = 'signin' | 'signup';

export function SignInScreen() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('入力してください', 'メールアドレスとパスワードが必要です。');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
        Alert.alert(
          'サインアップしました',
          '確認メールが有効な設定の場合はメールを確認してください。',
        );
      }
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'エラーが発生しました';
      Alert.alert('失敗しました', msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <ThemedText style={styles.backText}>← 戻る</ThemedText>
          </Pressable>

          <ThemedText style={styles.title}>
            {mode === 'signin' ? 'サインイン' : 'アカウント作成'}
          </ThemedText>
          <ThemedText type="small" style={styles.lead}>
            メールアドレスでログインすると、レシートをサーバに同期して機種変更時にも復元できます。
          </ThemedText>

          {!configured && (
            <View style={styles.warn}>
              <ThemedText type="small" style={styles.warnText}>
                Supabase が設定されていません。`.env.local` に
                EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
                を設定してアプリを再起動してください
                (docs/development/supabase-setup.md)。
              </ThemedText>
            </View>
          )}

          <Field label="メールアドレス">
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              editable={configured && !busy}
            />
          </Field>

          <Field label="パスワード">
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              secureTextEntry
              placeholder="6文字以上"
              editable={configured && !busy}
            />
          </Field>

          <Pressable
            style={[styles.primary, (!configured || busy) && styles.disabled]}
            disabled={!configured || busy}
            onPress={handleSubmit}>
            <ThemedText style={styles.primaryText}>
              {busy
                ? '送信中…'
                : mode === 'signin'
                  ? 'サインイン'
                  : 'アカウント作成'}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            style={styles.switchModeButton}>
            <ThemedText type="small" style={styles.switchModeText}>
              {mode === 'signin'
                ? 'アカウントをお持ちでない方はこちら'
                : 'すでにアカウントをお持ちの方はこちら'}
            </ThemedText>
          </Pressable>

          <ThemedText type="small" style={styles.note}>
            Apple / Google でのサインインは順次対応(MVP)
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFA' },
  safeArea: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  back: { paddingVertical: Spacing.two },
  backText: { color: Brand.primary, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', marginTop: Spacing.two },
  lead: { opacity: 0.7 },
  warn: {
    backgroundColor: Brand.warningBackground,
    borderColor: '#F0DD9E',
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  warnText: { color: Brand.warningText },
  field: { gap: Spacing.one },
  fieldLabel: { color: '#4D5A53', fontWeight: '700' },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#D6DED9',
    borderRadius: Spacing.two,
    borderWidth: 1,
    color: '#11181C',
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  primary: {
    alignItems: 'center',
    backgroundColor: Brand.primary,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    marginTop: Spacing.two,
  },
  primaryText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.5 },
  switchModeButton: { alignItems: 'center', paddingVertical: Spacing.two },
  switchModeText: { color: Brand.primary },
  note: { opacity: 0.5, textAlign: 'center', marginTop: Spacing.three },
});
