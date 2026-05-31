/**
 * メール+パスワードによる認証フォーム(設定画面に埋め込む)
 *
 * Web ではタブ外ルートを増やすとExpo Routerが混乱するので、画面では
 * なく「設定画面の中に展開する小さいパネル」として実装する。
 * Supabase Auth の最小実装。Apple / Google は後続(オーナー確認のうえ追加)。
 * 環境変数(EXPO_PUBLIC_SUPABASE_URL/ANON_KEY)が未設定のときは案内を出して入力を無効化。
 */

import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { signInWithEmail, signUpWithEmail } from '@/features/auth/hooks/use-auth';
import { isSupabaseConfigured } from '@/lib/env';

type Mode = 'signin' | 'signup';

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AuthForm({ onSuccess, onCancel }: Props) {
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
      onSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'エラーが発生しました';
      Alert.alert('失敗しました', msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <ThemedText style={styles.title}>
          {mode === 'signin' ? 'サインイン' : 'アカウント作成'}
        </ThemedText>
        {onCancel && (
          <Pressable onPress={onCancel}>
            <ThemedText type="small" style={styles.close}>
              ✕
            </ThemedText>
          </Pressable>
        )}
      </View>

      <ThemedText type="small" style={styles.lead}>
        メールでログインすると、レシートをサーバに同期し機種変更時にも復元できます。
      </ThemedText>

      {!configured && (
        <View style={styles.warn}>
          <ThemedText type="small" style={styles.warnText}>
            Supabase が未設定です。`.env.local` を確認してアプリを再起動してください
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
    </View>
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
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#E5EAE7',
    borderRadius: Spacing.two,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: { fontSize: 17, fontWeight: '800' },
  close: { fontSize: 16, opacity: 0.6, paddingHorizontal: Spacing.two },
  lead: { opacity: 0.7 },
  warn: {
    backgroundColor: Brand.warningBackground,
    borderColor: '#F0DD9E',
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
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
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    marginTop: Spacing.one,
  },
  primaryText: { color: '#ffffff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  switchModeButton: { alignItems: 'center', paddingVertical: Spacing.two },
  switchModeText: { color: Brand.primary },
});
