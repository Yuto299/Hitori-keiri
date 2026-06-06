import AppTabs from '@/components/app-tabs';

/**
 * タブグループのレイアウト。
 *
 * このグループ(ホーム/レシート/出力/設定)を AppTabs(Native Tabs / Web Tabs)で束ねる。
 * /capture, /review, /receipt/[id] 等のタブ外ルートは src/app/_layout.tsx の Stack 配下に置く
 * ことで、router.push でタブ外へ自由に遷移できるようにしている。
 */
export default AppTabs;
