# Apple / Google サインイン追加

> 関連: 要件 [FR-25 / 第4章 4.8](../requirements/04-screen-design.md#48-ログイン手段fr-25-関連) / 第7章 7.6
> ステータス: 設計(メール認証は実装済み・追加は未着手)
> 最終更新: 2026-05-26

---

## 0. ゴール

設定画面の認証フォーム(現状メールのみ)に **Apple Sign-In** と **Google Sign-In** を追加する。

## 1. 重要な前提

### App Store ガイドライン(必読)

> 他社ソーシャルログイン(Google等)を提供するiOSアプリは、**Sign in with Apple** を併設する必要がある。

→ **Apple → Google の順、または同時に追加**するのが安全。Google だけ先行はNG。

### 課金

| プロバイダ | 必要なもの | 課金 |
|---|---|---|
| Apple Sign-In | Apple Developer 登録(年 $99) | 発生 |
| Google Sign-In | Google Cloud(OAuth クライアント発行) | 無料枠で十分 |

⚠ Apple は年額課金。**着手前にオーナー確認必須**(AGENTS.md の方針)。

## 2. 全体フロー

```
[アプリ]
  └ サインイン画面で「Appleで続ける」or「Googleで続ける」をタップ
        ↓
  [OS のネイティブ認証ダイアログ / OAuth Web]
        ↓
  ID トークン取得
        ↓
[Supabase Auth]
  └ supabase.auth.signInWithIdToken({ provider, token })
        ↓
  サインイン完了 → 既存の useAuth が状態更新 → ホームへ
```

## 3. Apple Sign-In 追加手順

### 3.1 オーナー作業(コンソール側)

1. **Apple Developer 登録**(年 $99)
2. **Certificates, Identifiers & Profiles** で App ID を作成
3. 「**Sign In with Apple**」capability を有効化
4. **Services ID** を作成(Webドメイン・リダイレクト URL を登録)
5. **Key** を作成し、p8 ファイルをダウンロード(後で Supabase に貼る)
6. Supabase ダッシュボード → **Authentication → Providers → Apple** を有効化
   - Services ID / Team ID / Key ID / 秘密鍵(p8の中身)を入力

### 3.2 クライアント実装(私)

```bash
npx expo install expo-apple-authentication
```

`app.json`:
```json
{
  "ios": {
    "usesAppleSignIn": true
  }
}
```

`auth-form.tsx` または専用ボタンコンポーネントに追加:

```tsx
import * as AppleAuthentication from 'expo-apple-authentication';
import { getSupabase } from '@/lib/supabase/client';

async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error('No identity token');
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase 未設定');
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;
}
```

### 3.3 制約

- **Apple Sign-In は iOS のみ**(Web/Android では別のフロー or 非表示)
- シミュレータでは Sign-In ダイアログが完全には動かない場合あり → 実機テスト必須([device-testing.md](./device-testing.md))

## 4. Google Sign-In 追加手順

### 4.1 オーナー作業(コンソール側)

1. **Google Cloud Console** で新規プロジェクト or 既存プロジェクト選択
2. **OAuth 2.0 クライアント ID を発行**(iOS用 / Web用 / Android用 を必要に応じて)
3. **OAuth 同意画面** を設定(アプリ名・サポートメール)
4. Supabase ダッシュボード → **Authentication → Providers → Google** を有効化
   - Client ID と Client Secret を入力

### 4.2 クライアント実装(私)

選択肢2つ:

**選択肢A: `@react-native-google-signin/google-signin`(ネイティブ統合・推奨)**

```bash
npx expo install @react-native-google-signin/google-signin
```

```tsx
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  iosClientId: 'xxx.apps.googleusercontent.com',
  webClientId: 'yyy.apps.googleusercontent.com', // Supabaseに渡す用
});

async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const supabase = getSupabase();
  if (!supabase || !userInfo.data?.idToken) throw new Error('Setup error');
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: userInfo.data.idToken,
  });
  if (error) throw error;
}
```

**選択肢B: OAuth ブラウザ経由(Webでも動く・実装軽い)**

```tsx
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const redirectTo = Linking.createURL('/auth-callback');
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo },
});
```

→ Webブラウザ起動 → 認証 → アプリ復帰。Native画面遷移は重いが、Web/iOS/Android 共通で動く。

**MVPはまず選択肢Bで簡素化、必要なら後でAに置き換え**を推奨。

## 5. UI への組み込み

[auth-form.tsx](../../src/features/auth/components/auth-form.tsx) にボタンを追加。Platform.OS で出し分け:

```tsx
{Platform.OS === 'ios' && (
  <AppleAuthentication.AppleAuthenticationButton
    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
    cornerRadius={5}
    style={{ width: '100%', height: 44 }}
    onPress={signInWithApple}
  />
)}
<Pressable onPress={signInWithGoogle}>
  <ThemedText>Google で続ける</ThemedText>
</Pressable>
```

Apple ボタンは Apple のデザイン規約に厳密に従う必要あり(色・サイズ・テキスト)。

## 6. 段階的な実装順序

1. **Google Sign-In(選択肢B / OAuthブラウザ)を先に**実装 — 軽い・Web対応
2. **Apple Sign-In** を実装(iOS実機テスト必須)
3. **Google Sign-In をネイティブ統合(選択肢A)に置き換え** — UXが滑らかになる
4. 既存メール認証はそのまま残す

## 7. 既存コードへの影響

- [auth-form.tsx](../../src/features/auth/components/auth-form.tsx):ボタン追加・各プロバイダのハンドラを追加
- [use-auth.ts](../../src/features/auth/hooks/use-auth.ts):`signInWithIdToken` ラッパを追加
- [app.json](../../app.json):`usesAppleSignIn: true`、Google用のURLスキーム追加
- [device-testing.md](./device-testing.md):Apple/Google の実機テスト項目を追加

## 8. 注意点

- **メールアカウントとソーシャルアカウントの統合**:同じメールアドレスで「最初はメール、後でGoogle」とサインインすると、Supabase は別ユーザー扱いになる場合がある。事前にユーザーに「使う認証方法は1つに統一して」と伝えるか、後でアカウント統合機能を入れるか
- **Sign in with Apple のメール非公開**:ユーザーが「メールを隠す」を選ぶと、`@privaterelay.appleid.com` 形式のリレーメールになる。Supabase側でも管理可能
- **退会・データ削除**(第7章 / Apple審査要件):アカウント削除導線を必ず提供
