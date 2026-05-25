// CSS Modules の型宣言(Web ビルド向け)。
// テンプレの animated-icon.web.tsx 等が .module.css を import するため。
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
