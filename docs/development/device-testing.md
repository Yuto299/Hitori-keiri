# 実機テスト(iPhone / Android)の選択肢

> SDK 55 アプリを実機で動かす方法のメモ。Web では確認できないカメラ・SQLite ネイティブ動作・OS共有シート等のテストに使う。
> 最終更新: 2026-05-26

---

## 現状の制約

| プラットフォーム | カメラ動く? | Expo Go(SDK55) | 補足 |
|---|---|---|---|
| Web(ブラウザ) | ❌ | - | image-picker でファイル選択にフォールバック |
| iOS シミュレータ | △ (ダミー) | ✅ | TestFlight or `eas go` |
| iOS 実機 | ✅ | △ App Store版はSDK54 / TestFlight版はSDK55 | `eas go` 推奨 |
| Android 実機 | ✅ | ✅ | `expo-cli` から直接インストール可 |

参考:
- [Expo Changelog: Expo Go and the App Store in May 2026](https://expo.dev/changelog/expo-go-and-app-store-may-2026)
- [Expo SDK 55 リリースノート](https://expo.dev/changelog/sdk-55)

## オーナー環境(yuto): iPhone + Mac

iPhone 実機で動かす現実的な選択肢は次の2つ:

### A方式: `eas go` で自分用 TestFlight 版 Expo Go(おすすめ)

Apple Developer の**無料アカウント**で、自分のApple ID用にTestFlight版 Expo Go(SDK55)を作成し、iPhoneに入れる。

```bash
# 概念フロー(実行前にオーナー確認)
brew install eas-cli            # 初回のみ
eas login                       # Expo アカウントが必要(無料)
eas go                          # 自分用Expo Goをビルド→TestFlight 配布
```

メリット:
- Xcodeのフルインストール(15GB)が要らない
- ビルド時間が短い(EASクラウド)
- 一度入れれば、開発中のアプリは `expo start` で読み込まれる

注意:
- Apple Developer の登録は必要(無料枠でTestFlight 内部テストまで可能)
- EAS Build の無料枠を消費する(初期は十分余裕)

### B方式: `npx expo run:ios` で Development Build

```bash
xcode-select --install   # コマンドラインツール
# あるいは App Store から Xcode 全体(15GB)
npx expo run:ios         # Mac上でビルド→シミュレータ/実機に配信
```

メリット:
- ローカル完結、EAS不要
- ネイティブ層をデバッグしやすい

注意:
- Xcode が大きい(15GB前後)
- 初回ビルドは20〜30分
- iOS実機に入れるなら同様にApple Developer登録が要る

## カメラ・実機機能のテスト範囲

Web では未確認のため、実機で確かめたい項目:

- [ ] `expo-camera` でレシート撮影(現状は image-picker のフォールバック実装)
- [ ] `expo-image-picker.launchCameraAsync` でカメラが起動
- [ ] `expo-file-system` の File API でキャッシュにCSVファイル生成
- [ ] `expo-sharing` で OS 共有シート起動(税理士へCSV送付)
- [ ] `expo-sqlite` で永続化(リロード後もデータが残る)
- [ ] Supabase Auth のセッション永続化(`AsyncStorage` 経由)
- [ ] 4タブの NativeTabs (`expo-router/unstable-native-tabs`) の見た目

## いつやるか

要件・実装ロードマップ的には、**フェーズ4 OCR本実装の前**くらいに1度実機検証を入れるのが目安。

順序イメージ:
1. フェーズ3 認証 ✅(完了)
2. レシート同期(進行中)
3. **実機 Development Build を1度作る ← この回**
4. フェーズ4 OCR本実装(Claude API)
5. 課金 IAP(ストア審査時には実機必須)

## 課金・登録の前提

- Apple Developer 登録: 無料アカウントで TestFlight 内部テストは可能。App Store 公開は年 $99
- EAS Build: 無料枠あり(個人開発初期は十分)。超過時のみ課金
- いずれも**着手前にオーナー確認**(`AGENTS.md` の方針どおり、課金が絡む操作は私から進めない)
